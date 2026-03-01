// src/App.jsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react'; 
import { calcularCotizacionCompleta } from './logica/calculadora';
import { getDepartamentos, getCiudadesPorDepartamento, getClima } from './datos/clima';
import { getRegion } from './datos/tarifas';
import { cargarEcosistema } from './servicios/firebase'; 
import './App.css';

import { FormularioManual } from './components/FormularioManual';
import { AsistenteIA } from './components/AsistenteIA';

function App() {
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Estados Datos (Inicializados post-carga)
  const [datosForm, setDatosForm] = useState(null);
  const [mensajesChat, setMensajesChat] = useState([]);
  
  const [ciudadesDisponibles, setCiudadesDisponibles] = useState([]);
  const [resultado, setResultado] = useState(null);

  // Orquestador asíncrono
  useEffect(() => {
    cargarEcosistema().then((defaults) => {
      const savedForm = localStorage.getItem('formData');
      setDatosForm(savedForm ? JSON.parse(savedForm) : defaults);

      const savedChat = localStorage.getItem('chatHistory');
      setMensajesChat(savedChat ? JSON.parse(savedChat) : [
        { role: 'ia', texto: '¡Hola! 🌊 Soy Sol. ¿Cómo te llamas y de dónde nos escribes?' }
      ]);
      setCargando(false);
    }).catch(err => console.error("Error DB:", err));
  }, []);

  // Persistencia y validaciones encadenadas
  useEffect(() => { if (datosForm) localStorage.setItem('formData', JSON.stringify(datosForm)); }, [datosForm]);
  useEffect(() => { if (!cargando) localStorage.setItem('chatHistory', JSON.stringify(mensajesChat)); }, [mensajesChat, cargando]);

  useEffect(() => {
    if (datosForm?.Departamento) setCiudadesDisponibles(getCiudadesPorDepartamento(datosForm.Departamento));
    else setCiudadesDisponibles([]);
  }, [datosForm?.Departamento]);

  useEffect(() => {
    if (datosForm?.Departamento && datosForm?.Ciudad) {
      const clima = getClima(datosForm.Departamento, datosForm.Ciudad);
      if (clima.found) {
         setDatosForm(prev => {
            if (prev.Ciudad === clima.nombreOficial && prev.T_a === clima.T_a) return prev;
            return { ...prev, Ciudad: clima.nombreOficial, Departamento: clima.deptOficial, T_a: clima.T_a, HR: clima.HR };
         });
      } else {
         setDatosForm(prev => ({ ...prev, T_a: prev.T_a || 26, HR: prev.HR || 70 }));
      }
    }
  }, [datosForm?.Ciudad, datosForm?.Departamento]);

  const agregarNotificacion = (mensaje) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, mensaje }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDatosForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'Departamento' ? { Ciudad: '' } : {})
    }));
  };

  const handleSubmit = (e, preferenciaOverride = null) => {
    if (e) e.preventDefault();
    const preferenciaFinal = preferenciaOverride || datosForm.preferenciaCotizacion;
    
    if (!datosForm.Departamento || !datosForm.Ciudad) {
       agregarNotificacion("⚠️ Faltan datos de ubicación");
       return;
    }
    
    const datosCliente = {
      ...datosForm,
      Volumen: parseFloat(datosForm.Volumen) || 0,
      Largo: parseFloat(datosForm.Largo) || 0,
      Ancho: parseFloat(datosForm.Ancho) || 0,
      Profundidad: parseFloat(datosForm.Profundidad) || 0,
      T_w: parseFloat(datosForm.T_w),
      Precio_kWh: parseFloat(datosForm.Precio_kWh),
      T_a: parseFloat(datosForm.T_a) || 26, 
      HR: parseFloat(datosForm.HR) || 70
    };

    const calculo = calcularCotizacionCompleta(datosCliente);
    
    if (calculo.error) {
        agregarNotificacion(`❌ ${calculo.error}`);
    } else {
      setResultado({ ...calculo, preferenciaUsuario: preferenciaFinal });
      if(modalAbierto) {
          setModalAbierto(false);
          agregarNotificacion("✅ Datos manuales guardados");
      }
    }
  };

  // Bloqueo de renderizado estructural
  if (cargando || !datosForm) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Cargando sistema...</div>;
  }

  // Inicialización síncrona habilitada
  const departamentosDisponibles = getDepartamentos();
  
  const contextoParaIA = {
    datos: datosForm,
    sistema: {
      regionDetectada: getRegion(datosForm.Departamento),
      climaAutomatico: !!(datosForm.T_a && datosForm.HR),
      departamentosDisponibles: departamentosDisponibles
    }
  };

  return (
    <div className="app-container">
      
      {/* TOASTS FLOTANTES (Dentro del container) */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast-notification">
            {t.mensaje}
          </div>
        ))}
      </div>

      <div className="chat-fullscreen">
          <AsistenteIA 
            contextoGlobal={contextoParaIA}
            setDatosForm={setDatosForm}
            mensajes={mensajesChat}      
            setMensajes={setMensajesChat} 
            onCalcular={handleSubmit}
            agregarNotificacion={agregarNotificacion} 
            resultadoFinal={resultado} 
            abrirManual={() => setModalAbierto(true)} 
          />
      </div>

      {/* MODAL */}
      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Configuración Manual</h2>
              <button className="btn-close" onClick={() => setModalAbierto(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
                <FormularioManual 
                    datosForm={datosForm}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    departamentosDisponibles={departamentosDisponibles}
                    ciudadesDisponibles={ciudadesDisponibles}
                    error={null}
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;