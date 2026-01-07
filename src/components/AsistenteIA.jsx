// src/components/AsistenteIA.jsx

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Trash2, Download, Settings } from 'lucide-react'; 
import ReactMarkdown from 'react-markdown'; 
import { enviarMensajeGroq } from '../servicios/groq'; 
import { generarPDF } from '../logica/generadorPDF'; 
import { validarUbicacion } from '../datos/clima'; 
import './AsistenteIA.css';
import logoEmpresa from '../assets/ico.png';

// --- TARJETA DE RESUMEN (DISEÑO LIMPIO + DATOS COMPLETOS) ---
const ResumenCotizacion = ({ resultado, modo }) => {
    const money = (val) => `$ ${new Intl.NumberFormat('es-CO').format(val.toFixed(0))}`;
    const fmtNum = (val) => new Intl.NumberFormat('es-CO').format(val);
    
    const mostrarVenta = modo === 'VENTA' || modo === 'AMBAS';
    const mostrarRenta = modo === 'RENTA' || modo === 'AMBAS';

    return (
        <div className="cotizacion-summary-card animate-fade-in">
            <div className="summary-header">
                <h3>📋 Resumen Técnico</h3>
                <div className="summary-badges">
                    <span>📍 {resultado.datosUsados.Ciudad}</span>
                    <span>💧 {resultado.datosUsados.Volumen} m³</span>
                </div>
            </div>

            <div className="summary-content">
                
                {/* === OPCIÓN VENTA (COMPLETA) === */}
                {mostrarVenta && resultado.escenarioVenta && (
                    <div className="scenario-box venta">
                        <div className="card-title-row">
                            <span>OPCIÓN VENTA</span>
                            <span style={{color: '#059669', fontSize: '0.8rem'}}>Tecnología Inverter</span>
                        </div>

                        {/* 1. Lista de Equipos */}
                        <div className="eq-list">
                            {resultado.escenarioVenta.equipo.equipos.map((eq, i) => (
                                <div key={i} className="eq-item">
                                    <strong>{eq.cantidad}x</strong> {eq.sku} <small>({fmtNum(eq.btu)} BTU/h)</small>
                                </div>
                            ))}
                        </div>

                        {/* 2. Datos Técnicos (Recuperados) */}
                        <div className="extra-details">
                            <div className="extra-item">
                                <strong>⚡Potencia Total</strong>
                                <span>{fmtNum(resultado.escenarioVenta.equipo.P_cal_btu)} BTU/h</span>
                            </div>
                            <div className="extra-item">
                                <strong>🔋 Consumo Est.</strong>
                                <span>{money(resultado.escenarioVenta.costo_dia * 30)} / mes</span>
                            </div>
                            <div className="extra-item">
                                <strong>Clima Base</strong>
                                <span>{resultado.datosUsados.T_a}°C / {resultado.datosUsados.HR}%</span>
                            </div>
                        </div>

                        {/* 3. Precio */}
                        <div className="price-section">
                            <span className="price-label">INVERSIÓN TOTAL</span>
                            <span className="price-val">{money(resultado.escenarioVenta.total)}</span>
                        </div>

                        <button onClick={() => generarPDF(resultado, "VENTA")} className="btn-action bg-green">
                            <Download size={18} /> Descargar PDF Venta
                        </button>
                    </div>
                )}

                {/* === OPCIÓN RENTA (COMPLETA) === */}
                {mostrarRenta && resultado.escenarioRenta && (
                    <div className="scenario-box renta">
                        <div className="card-title-row">
                            <span>OPCIÓN RENTA</span>
                            <span style={{color: '#d97706', fontSize: '0.8rem'}}>Tecnología On/Off</span>
                        </div>

                        {/* 1. Lista de Equipos */}
                        <div className="eq-list">
                            {resultado.escenarioRenta.equipo.equipos.map((eq, i) => (
                                <div key={i} className="eq-item">
                                    <strong>{eq.cantidad}x</strong> {eq.sku}
                                </div>
                            ))}
                        </div>

                        {/* 2. Datos Técnicos (Recuperados) */}
                        <div className="extra-details">
                            <div className="extra-item">
                                <strong>Costo Inicio (Único)</strong>
                                <span>{money(resultado.escenarioRenta.instalacionInicial)}</span>
                            </div>
                            <div className="extra-item">
                                <strong>⚡Potencia Total</strong>
                                <span>{fmtNum(resultado.escenarioRenta.equipo.P_cal_btu)} BTU/h</span>
                            </div>
                            <div className="extra-item">
                                <strong>Instalación</strong>
                                <span>Incluida 100% ✅</span>
                            </div>
                            <div className="extra-item">
                                <strong>🔋 Consumo Est.</strong>
                                <span>{money(resultado.escenarioRenta.costo_dia_energia * 30)} / mes</span>
                            </div>
                        </div>

                        {/* 3. Precio */}
                        <div className="price-section">
                            <span className="price-label">MENSUALIDAD</span>
                            <span className="price-val">{money(resultado.escenarioRenta.mensualidad)}</span>
                        </div>

                        <button onClick={() => generarPDF(resultado, "RENTA")} className="btn-action bg-orange">
                            <Download size={18} /> Descargar PDF Renta
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export function AsistenteIA({ contextoGlobal, setDatosForm, mensajes, setMensajes, onCalcular, agregarNotificacion, resultadoFinal, abrirManual }) {
  const [inputUsuario, setInputUsuario] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); // 1. Referencia al input

  // Scroll automático
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes, cargando, mostrarResumen]);

  // 2. Efecto Mágico: Devolver el foco al terminar de cargar
  useEffect(() => {
    if (!cargando) {
      // Un pequeño timeout asegura que el input ya esté habilitado en el DOM
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [cargando]);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!inputUsuario.trim()) return;

    const textoUsuario = inputUsuario;
    setInputUsuario(''); 
    setMostrarResumen(false); 
    
    const nuevosMensajes = [...mensajes, { role: 'usuario', texto: textoUsuario }];
    setMensajes(nuevosMensajes);
    setCargando(true);

    // Enviar a Groq
    const historialEnvio = nuevosMensajes.slice(-15);
    const respuestaObj = await enviarMensajeGroq(historialEnvio, contextoGlobal);
    
    const textoIA = respuestaObj.respuesta_chat;
    const datosNuevos = respuestaObj.datos_actualizados;

    setMensajes(prev => [...prev, { role: 'ia', texto: textoIA }]);

    if (datosNuevos) {
        const datosAnteriores = contextoGlobal.datos; 
        const datosLimpios = Object.fromEntries(
            Object.entries(datosNuevos).filter(([_, v]) => v !== null && v !== undefined)
        );

        // Notificaciones (Solo si hay cambios)
        if (datosLimpios.nombreCliente && datosLimpios.nombreCliente !== datosAnteriores.nombreCliente) 
            agregarNotificacion(`👤 Cliente: ${datosLimpios.nombreCliente}`);
        
        if (datosLimpios.Ciudad && datosLimpios.Ciudad !== datosAnteriores.Ciudad) {
             const ubi = validarUbicacion(datosLimpios.Ciudad, datosLimpios.Departamento);
             datosLimpios.Ciudad = ubi.Ciudad;
             datosLimpios.Departamento = ubi.Departamento;
             agregarNotificacion(`📍 Ubicación: ${ubi.Ciudad}`);
        }

        if (datosLimpios.tipoCliente && datosLimpios.tipoCliente !== datosAnteriores.tipoCliente) 
            agregarNotificacion(`🏢 Tipo: ${datosLimpios.tipoCliente}`);
        
        if (datosLimpios.Volumen && datosLimpios.Volumen !== datosAnteriores.Volumen) 
            agregarNotificacion(`💧 Volumen: ${datosLimpios.Volumen} m³`);

        // Actualizar Estado
        setDatosForm(prev => {
            const nuevoEstado = { ...prev, ...datosLimpios };
            if (nuevoEstado.Largo && nuevoEstado.Ancho && !nuevoEstado.Volumen) { 
                 const prof = nuevoEstado.Profundidad || 1.35; 
                 nuevoEstado.Volumen = (nuevoEstado.Largo * nuevoEstado.Ancho * prof).toFixed(1);
            }
            return nuevoEstado;
        });

        // Acción Final
        if (datosLimpios.accion === "COTIZAR") {
            const preferencia = datosLimpios.preferenciaCotizacion || 'AMBAS';
            onCalcular(null, preferencia);
            setMostrarResumen(true);
        }
    }
    setCargando(false);
  };

  const borrarMemoria = () => {
    if(confirm("¿Borrar historial y datos?")) {
      setMensajes([{ role: 'ia', texto: '¡Hola! 🌊 Soy Sol. Comencemos un gusto, ¿cuál es tu nombre?' }]);
      setMostrarResumen(false);
      setDatosForm({
        nombreCliente: '', Departamento: '', Ciudad: '', tipoCliente: 'Persona Natural',
        Volumen: 50, Largo: '', Ancho: '', Profundidad: '', T_w: 30, T_a: '', HR: '',
        usa_manta: false, Precio_kWh: 700, preferenciaCotizacion: 'AMBAS'
      });
      agregarNotificacion("🗑️ Memoria borrada");
    }
  };

  return (
    <>
      <div className="chat-header-bar">
        <div className="ai-status">
          <div className="avatar-circle">
            <img 
                src={logoEmpresa}
                alt="Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
            />
        </div>
          <div className="header-info">
            <span className="ai-name">Sol IA</span>
            <span className="ai-role">Ingeniero en Ventas</span>
          </div>
        </div>
        <div className="header-actions">
            <button onClick={abrirManual} className="btn-icon" title="Manual"><Settings size={20} /></button>
            <button onClick={borrarMemoria} className="btn-icon" title="Reiniciar"><Trash2 size={20} /></button>
        </div>
      </div>

      <div className="chat-messages-area">
        {mensajes.map((msg, i) => (
          <div key={i} className={`msg-row ${msg.role === 'ia' ? 'msg-left' : 'msg-right'}`}>
            <div className={`msg-bubble ${msg.role === 'ia' ? 'bubble-ia' : 'bubble-user'}`}>
              <ReactMarkdown>{msg.texto}</ReactMarkdown>
            </div>
          </div>
        ))}
        
        {/* AQUÍ ESTÁ EL RESUMEN CON TODA LA INFO DETALLADA */}
        {mostrarResumen && resultadoFinal && (
            <div className="contenedor-full-width animate-fade-in">
                <ResumenCotizacion 
                    resultado={resultadoFinal} 
                    modo={resultadoFinal.preferenciaUsuario} 
                />
            </div>
        )}

        {cargando && <div className="msg-row msg-left"><div className="typing-indicator"><span></span><span></span><span></span></div></div>}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={manejarEnvio} className="chat-input-bar">
        <input 
          ref={inputRef} // 3. Asignar la referencia
          type="text" value={inputUsuario} onChange={(e) => setInputUsuario(e.target.value)}
          placeholder="Escribe un mensaje" disabled={cargando} autoFocus
        />
        <button type="submit" disabled={!inputUsuario.trim() || cargando} className="btn-send">
          <Send size={22} />
        </button>
      </form>
    </>
  );
}