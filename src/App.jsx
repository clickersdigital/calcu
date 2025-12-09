// src/App.jsx
import { useState } from 'react';
import { calcularCotizacionCompleta } from './logica/calculadora';
import { generarPDF } from './logica/generadorPDF';
import './App.css'

const ciudadesDisponibles = ['Bogotá', 'Medellín', 'Cartagena'];

function App() {
  const [datosForm, setDatosForm] = useState({
    Ciudad: 'Bogotá',
    Volumen: 50,
    Largo: '',
    Ancho: '',
    Profundidad: '',
    T_w: 30,
    usa_manta: false,
    Precio_kWh: 700,
  });
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDatosForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' || type === 'text' ? value : value),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setResultado(null);
    
    // Convertir a números
    const datosCliente = {
      ...datosForm,
      Volumen: parseFloat(datosForm.Volumen) || 0,
      Largo: parseFloat(datosForm.Largo) || 0,
      Ancho: parseFloat(datosForm.Ancho) || 0,
      Profundidad: parseFloat(datosForm.Profundidad) || 0,
      T_w: parseFloat(datosForm.T_w),
      Precio_kWh: parseFloat(datosForm.Precio_kWh),
    };

    const calculo = calcularCotizacionCompleta(datosCliente);
    
    if (calculo.error) {
      setError(calculo.error);
    } else {
      setResultado(calculo);
    }
  };

  const handleGenerarPDF = () => {
    if (resultado) {
      generarPDF(resultado);
    }
  };

  return (
    <div className="container">
      <h1>♨️ Calculadora de Cotización ♨️</h1>
      <form onSubmit={handleSubmit}>
        {/* --- DATOS BÁSICOS --- */}
        <label>Ciudad:
          <select name="Ciudad" value={datosForm.Ciudad} onChange={handleChange}>
            {ciudadesDisponibles.map((ciudad) => (
              <option key={ciudad} value={ciudad}>
                {ciudad}
              </option>
            ))}
          </select>
        </label>
        <label>Temp. Objetivo (°C):
          <input name="T_w" type="number" value={datosForm.T_w} onChange={handleChange} />
        </label>
        <label>Precio kWh (COP):
          <input name="Precio_kWh" type="number" value={datosForm.Precio_kWh} onChange={handleChange} />
        </label>
        <label>
          <input name="usa_manta" type="checkbox" checked={datosForm.usa_manta} onChange={handleChange} />
          ¿Usa Manta Térmica?
        </label>

        {/* --- DATOS VOLUMEN --- */}
        <fieldset>
          <legend>Volumen (Una de las dos)</legend>
          <label>Volumen (m³):
            <input name="Volumen" type="number" value={datosForm.Volumen} onChange={handleChange} />
          </label>
          <hr/>
          <label>Largo (m):
            <input name="Largo" type="number" value={datosForm.Largo} onChange={handleChange} />
          </label>
          <label>Ancho (m):
            <input name="Ancho" type="number" value={datosForm.Ancho} onChange={handleChange} />
          </label>
          <label>Profundidad (m):
            <input name="Profundidad" type="number" placeholder="Defecto 1.35m" value={datosForm.Profundidad} onChange={handleChange} />
          </label>
        </fieldset>

        <button type="submit">Calcular Cotización</button>
      </form>

      {error && <div className="error">{error}</div>}

      {resultado && (
        <div className="resultados">
          <h2>Resultados del Cálculo</h2>
          <p>Potencia Requerida (Q_total): {resultado.Q_total.toFixed(2)} kW</p>
          <p>Equipo Seleccionado (P_cal): {resultado.P_cal} kW ({resultado.seleccion.equipos[0].sku})</p>
          <p>Costo Operativo Diario: ${resultado.Costo_dia.toFixed(0)} COP</p>
          <hr />
          <h3>Cotización Preliminar</h3>
          <p>Equipos: ${resultado.subtotal.toFixed(0)}</p>
          <p>Instalación: ${resultado.instalacion.toFixed(0)}</p>
          <p>IVA: ${resultado.iva.toFixed(0)}</p>
          <h4>Total: ${resultado.total.toFixed(0)} COP</h4>
          
          <button onClick={handleGenerarPDF}>Generar PDF</button>
        </div>
      )}
    </div>
  );
}

export default App;