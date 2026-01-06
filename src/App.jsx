// src/App.jsx
import { useState, useEffect } from 'react';
import { calcularCotizacionCompleta } from './logica/calculadora';
import { generarPDF } from './logica/generadorPDF';
import { getDepartamentos, getCiudadesPorDepartamento, getClima } from './datos/clima'; // Importamos getClima también
import { TIPOS_CLIENTE } from './datos/tarifas';
import './App.css';

function App() {
  const departamentosDisponibles = getDepartamentos();
  
  const [datosForm, setDatosForm] = useState({
    Departamento: '',
    Ciudad: '',
    tipoCliente: 'Persona Natural',
    Volumen: 50,
    Largo: '',
    Ancho: '',
    Profundidad: '',
    T_w: 30, // Temp deseada
    T_a: '', // Temp Ambiente (Editable)
    HR: '',  // Humedad (Editable)
    usa_manta: false,
    Precio_kWh: 700,
  });

  const [ciudadesDisponibles, setCiudadesDisponibles] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  // 1. Cargar ciudades cuando cambia departamento
  useEffect(() => {
    if (datosForm.Departamento) {
      const ciudades = getCiudadesPorDepartamento(datosForm.Departamento);
      setCiudadesDisponibles(ciudades);
    } else {
      setCiudadesDisponibles([]);
    }
  }, [datosForm.Departamento]);

  // 2. Cargar clima automático cuando cambia Ciudad (pero permitir edición)
  useEffect(() => {
    if (datosForm.Departamento && datosForm.Ciudad) {
      const climaData = getClima(datosForm.Departamento, datosForm.Ciudad);
      setDatosForm(prev => ({
        ...prev,
        T_a: climaData.T_a,
        HR: climaData.HR
      }));
    }
  }, [datosForm.Ciudad]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Si cambia Dept, reseteamos ciudad
    if (name === 'Departamento') {
      setDatosForm(prev => ({ ...prev, Departamento: value, Ciudad: '' }));
    } else {
      setDatosForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setResultado(null);
    
    if (!datosForm.Departamento || !datosForm.Ciudad) {
        setError("⚠️ Selecciona una ubicación válida.");
        return;
    }

    // Convertir a números
    const datosCliente = {
      ...datosForm,
      Volumen: parseFloat(datosForm.Volumen) || 0,
      Largo: parseFloat(datosForm.Largo) || 0,
      Ancho: parseFloat(datosForm.Ancho) || 0,
      Profundidad: parseFloat(datosForm.Profundidad) || 0,
      T_w: parseFloat(datosForm.T_w),
      Precio_kWh: parseFloat(datosForm.Precio_kWh),
      // T_a y HR se envían tal cual están en el form (pueden ser strings del input, la calculadora los parsea)
    };

    const calculo = calcularCotizacionCompleta(datosCliente);
    
    if (calculo.error) {
      setError(calculo.error);
    } else {
      setResultado(calculo);
    }
  };

  // Helper para moneda
  const money = (val) => `$ ${new Intl.NumberFormat('es-CO').format(val.toFixed(0))}`;

  return (
    <div className="app-container">
      <header className="header">
        <h1>🌊 Calculadora Inteligente 🌊</h1>
        <p>Más Centígrados S.A.S.</p>
      </header>

      <div className="main-grid">
        {/* === COLUMNA IZQUIERDA: FORMULARIO === */}
        <form onSubmit={handleSubmit} className="form-panel">
          
          <div className="section-title">📍 Ubicación y Cliente</div>
          <div className="input-group-row">
            <select name="tipoCliente" value={datosForm.tipoCliente} onChange={handleChange} className="full-width">
              {TIPOS_CLIENTE.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="input-group-row">
            <select name="Departamento" value={datosForm.Departamento} onChange={handleChange}>
              <option value="">Departamento...</option>
              {departamentosDisponibles.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select name="Ciudad" value={datosForm.Ciudad} onChange={handleChange} disabled={!datosForm.Departamento}>
              <option value="">Ciudad...</option>
              {ciudadesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="section-title">🌤️ Condiciones Climáticas (Editables)</div>
          <div className="input-group-row three-cols">
            <div className="input-wrapper">
              <label>Ambiente (°C)</label>
              <input name="T_a" type="number" value={datosForm.T_a} onChange={handleChange} />
            </div>
            <div className="input-wrapper">
              <label>Humedad (%)</label>
              <input name="HR" type="number" value={datosForm.HR} onChange={handleChange} />
            </div>
            <div className="input-wrapper">
              <label>Deseada (°C)</label>
              <input name="T_w" type="number" value={datosForm.T_w} onChange={handleChange} />
            </div>
          </div>

          <div className="section-title">📐 Piscina</div>
          <div className="input-group-row">
            <input name="Volumen" type="number" placeholder="Volumen (m³)" value={datosForm.Volumen} onChange={handleChange} />
          </div>
          <div className="or-divider">- O calcula por medidas -</div>
          <div className="input-group-row three-cols">
            <input name="Largo" type="number" placeholder="Largo" value={datosForm.Largo} onChange={handleChange} />
            <input name="Ancho" type="number" placeholder="Ancho" value={datosForm.Ancho} onChange={handleChange} />
            <input name="Profundidad" type="number" placeholder="Prof." value={datosForm.Profundidad} onChange={handleChange} />
          </div>
          
          <div className="section-title">⚡ Energía</div>
          <div className="input-group-row">
             <div className="input-wrapper">
              <label>Costo kWh</label>
              <input name="Precio_kWh" type="number" value={datosForm.Precio_kWh} onChange={handleChange} />
            </div>
            <div className="checkbox-wrapper">
              <input id="manta" name="usa_manta" type="checkbox" checked={datosForm.usa_manta} onChange={handleChange} />
              <label htmlFor="manta">Usa Manta</label>
            </div>
          </div>

          <button type="submit" className="btn-calculate">CALCULAR AHORA</button>
          {error && <div className="error-msg">{error}</div>}
        </form>

        {/* === COLUMNA DERECHA: RESULTADOS === */}
        <div className="results-panel">
      {!resultado ? (
            <div className="placeholder-text">
              <p>👈 Aquí se generará el cálculo. Completa los datos y presiona "Calcular".</p>
            </div>
          ) :  (
        
        <div className="results-panel">
          <div className="tech-summary">
            {/* ... esto igual ... */}
             <div className="tech-item">
                  <span>Potencia requerida: </span>
                  <strong>{new Intl.NumberFormat('es-CO').format(resultado.escenarioVenta?.equipo.P_cal_btu || 0)} BTU/h</strong>
                </div>
                <div className="tech-item">
                  <span>Clima Base:</span>
                  <strong>{resultado.datosUsados.T_a}°C / {resultado.datosUsados.HR}%</strong>
                </div>
          </div>

          {/* Opción 1: VENTA */}
          {resultado.escenarioVenta && (
            <div className="result-card venta-card">
              <div className="card-header">
                <h3>VENTA (Compra)</h3>
                <span className="badge">Inverter</span>
              </div>
              <div className="card-body">
                {/* AQUI EL CAMBIO: Mapeamos los equipos */}
                <div className="equipos-list">
                  {resultado.escenarioVenta.equipo.equipos.map((eq, idx) => (
                    <p key={idx} className="model-sku">
                      <strong>{eq.cantidad}x</strong> {eq.sku} ({new Intl.NumberFormat('es-CO').format(eq.btu)} BTU/h)
                    </p>
                  ))}
                </div>
                
                <div className="price-row main-price">
                  <span>Total Inversión:</span>
                  <strong>{money(resultado.escenarioVenta.total)}</strong>
                </div>
                <div className="details-list">
                   <p>⚡ Capacidad Total: <strong>{new Intl.NumberFormat('es-CO').format(resultado.escenarioVenta.equipo.P_cal_btu)} BTU/h</strong></p>
                   <p>🔋 Consumo Est.: <strong>{money(resultado.escenarioVenta.costo_dia * 30)} / mes</strong></p>
                </div>
                <button onClick={() => generarPDF(resultado, "VENTA")} className="btn-pdf btn-venta">
                  📄 PDF VENTA
                </button>
              </div>
            </div>
          )}

          {/* Opción 2: RENTA */}
          {resultado.escenarioRenta && (
            <div className="result-card renta-card">
              <div className="card-header">
                <h3>RENTA (Mensual)</h3>
                <span className="badge">On/Off</span>
              </div>
              <div className="card-body">
                {/* AQUI EL CAMBIO: Mapeamos los equipos */}
                <div className="equipos-list">
                  {resultado.escenarioRenta.equipo.equipos.map((eq, idx) => (
                    <p key={idx} className="model-sku">
                      <strong>{eq.cantidad}x</strong> {eq.sku} ({eq.potencia} kW c/u)
                    </p>
                  ))}
                </div>

                <div className="price-row main-price">
                  <span>Mensualidad:</span>
                  <strong>{money(resultado.escenarioRenta.mensualidad)}</strong>
                </div>
                <div className="details-list">
                  <p>⚡ Potencia Instalada: <strong>{resultado.escenarioRenta.equipo.P_cal} kW</strong></p>
                  <p>🚀 Inicio (Único): <strong>{money(resultado.escenarioRenta.instalacionInicial)}</strong></p>
                </div>
                <button onClick={() => generarPDF(resultado, "RENTA")} className="btn-pdf btn-renta">
                  📄 PDF RENTA
                </button>
              </div>
            </div>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

export default App;