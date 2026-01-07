// src/components/FormularioManual.jsx
import { TIPOS_CLIENTE } from '../datos/tarifas';
import './FormularioManual.css';

export function FormularioManual({ 
  datosForm, 
  handleChange, 
  handleSubmit, 
  departamentosDisponibles, 
  ciudadesDisponibles, 
  error 
}) {
  return (
    <form onSubmit={handleSubmit} className="form-panel animate-fade-in">
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
  );
}