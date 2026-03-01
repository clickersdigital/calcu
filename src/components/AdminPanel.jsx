import { useState, useEffect } from 'react';
import { auth, db } from '../servicios/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { ref, get, set, update, remove } from 'firebase/database';
import { Trash2, PlusCircle, Save, LogOut, ShieldCheck, Search, AlertTriangle, Menu, X } from 'lucide-react';
import './AdminPanel.css'; 

const DESCRIPCIONES_CONSTANTES = {
  PR_M_DEFAULT: "Profundidad media por defecto de la piscina (metros) si no se especifica.",
  VV: "Velocidad promedio del viento (m/s). Afecta la pérdida por convección y evaporación.",
  HFG: "Entalpía de vaporización del agua. Define la energía requerida para la evaporación.",
  EPS: "Coeficiente de emisividad del agua. Usado en el cálculo de pérdida por radiación.",
  CP: "Capacidad calorífica del agua.",
  RO: "Densidad del agua (kg/m³).",
  PCT_INSTALACION: "Porcentaje base global de instalación (ej: 0.20 = 20%).",
  PCT_IVA: "Impuesto de valor agregado (ej: 0.19 = 19%).",
  HORAS_DIARIAS_TRABAJO: "Horas diarias estimadas que trabajará la bomba de calor.",
  FACTOR_SEGURIDAD_QTOTAL: "Multiplicador de margen de error sobre la carga total (ej: 1.2 = +20%)."
};

const DESCRIPCIONES_DEFAULT = {
  nombreCliente: "Nombre inicial del cliente en el formulario.",
  Departamento: "Departamento preseleccionado al cargar (Dependiente del clima).",
  Ciudad: "Ciudad preseleccionada al cargar.",
  tipoCliente: "Categoría inicial (Extraído de Tarifas).",
  Volumen: "Volumen (m³) estándar sugerido (ej: 50).",
  Largo: "Largo predeterminado en metros.",
  Ancho: "Ancho predeterminado en metros.",
  Profundidad: "Profundidad predeterminada en metros.",
  T_w: "Temperatura del agua deseada (°C) estándar.",
  T_a: "Temperatura ambiente (°C) de respaldo (si falla cruce satelital).",
  HR: "Humedad relativa (%) de respaldo.",
  usa_manta: "Estado inicial del selector de manta térmica.",
  Precio_kWh: "Tarifa base de energía sugerida ($/kWh).",
  preferenciaCotizacion: "Modo inicial de cotización."
};

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [data, setData] = useState(null);
  const [admins, setAdmins] = useState({});
  const [activeTab, setActiveTab] = useState('constantes');
  const [saving, setSaving] = useState(false);
  const [busquedaClima, setBusquedaClima] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const [modalDelete, setModalDelete] = useState({ open: false, path: '', array: [], index: null });
  const [deletePass, setDeletePass] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) cargarDatos();
    });
    return unsubscribe;
  }, []);

  const cargarDatos = async () => {
    try {
      const snapshot = await get(ref(db, 'calcu'));
      if (snapshot.exists()) {
        const fullData = snapshot.val();
        setData({
          constantes: fullData.constantes || {},
          default: fullData.default || {},
          tarifas: fullData.tarifas || {},
          catalogo: fullData.catalogo || { INVERTER: [], ON_OFF: [] },
          colombia_clima: fullData.colombia_clima || []
        });
        setAdmins(fullData.acceso?.admin || {});
      }
    } catch (err) {
      setError("Error de lectura. Verifica permisos.");
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Credenciales inválidas.");
    }
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await set(ref(db, `calcu/${activeTab}`), data[activeTab]);
      alert("✅ Cambios sincronizados.");
    } catch (err) {
      alert("❌ Error: Transacción rechazada. Permisos insuficientes.");
    }
    setSaving(false);
  };

  const handleCambio = (path, value) => {
    const keys = path.split('.');
    setData(prev => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = Array.isArray(current[keys[i]]) ? [...current[keys[i]]] : { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const [nuevoAdmin, setNuevoAdmin] = useState('');
  const agregarAdmin = async () => {
    if(!nuevoAdmin.includes('@')) return alert("Ingresa un correo válido");
    const correoKey = nuevoAdmin.replace(/\./g, ',');
    try {
      await update(ref(db, `calcu/acceso/admin`), { [correoKey]: true });
      setAdmins(prev => ({ ...prev, [correoKey]: true }));
      setNuevoAdmin('');
    } catch (err) { alert("Error al inyectar admin."); }
  };
  
  const eliminarAdmin = async (correoKey) => {
    if(window.confirm("¿Revocar acceso?")) {
      try {
        await remove(ref(db, `calcu/acceso/admin/${correoKey}`));
        setAdmins(prev => { const n = {...prev}; delete n[correoKey]; return n; });
      } catch (err) { alert("Error al eliminar."); }
    }
  };

  const confirmarEliminacion = async (e) => {
    e.preventDefault();
    setDeleteError('');
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePass);
      await reauthenticateWithCredential(user, credential);
      const nuevoArray = modalDelete.array.filter((_, i) => i !== modalDelete.index);
      handleCambio(modalDelete.path, nuevoArray);
      setModalDelete({ open: false, path: '', array: [], index: null });
      setDeletePass('');
    } catch (err) {
      setDeleteError('Contraseña incorrecta.');
    }
  };

  const renderConstantes = () => (
    <div className="grid-2-cols">
      {Object.keys(data.constantes).map(key => (
        <div key={key} className="admin-input-group card-style">
          <label>{key}</label>
          <p className="const-hint">{DESCRIPCIONES_CONSTANTES[key]}</p>
          <input 
            type="number" 
            step="any"
            value={data.constantes[key]} 
            onChange={(e) => handleCambio(`constantes.${key}`, Number(e.target.value))} 
          />
        </div>
      ))}
    </div>
  );

  const renderDefault = () => {
    const deptoActual = data.colombia_clima.find(d => d.departamento === data.default.Departamento);
    const ciudadesDisponibles = deptoActual ? deptoActual.ciudades : [];
    const camposNumericosEstrictos = ['Volumen', 'Largo', 'Ancho', 'Profundidad', 'T_w', 'T_a', 'HR', 'Precio_kWh'];

    // Organización por bloques temáticos
    const gruposDefault = [
      {
        titulo: "Datos de Ubicación y Cliente",
        keys: ["Departamento", "Ciudad", "nombreCliente", "tipoCliente"]
      },
      {
        titulo: "Dimensiones del Vaso (Piscina/Jacuzzi)",
        keys: ["Volumen", "Largo", "Ancho", "Profundidad"]
      },
      {
        titulo: "Climatización y Variables Térmicas",
        keys: ["T_w", "T_a", "HR"]
      },
      {
        titulo: "Ajustes de Cotización",
        keys: ["preferenciaCotizacion", "Precio_kWh", "usa_manta"]
      }
    ];

    return (
      <div className="default-container">
        {gruposDefault.map((grupo, gIdx) => (
          <div key={gIdx} className="admin-card mb-20">
            <div className="admin-card-header"><h3>{grupo.titulo}</h3></div>
            <div className="admin-card-body grid-2-cols">
              {grupo.keys.map(key => {
                const value = data.default[key];
                if (value === undefined) return null; // Respaldo de seguridad

                let inputNode;

                if (key === 'tipoCliente') {
                  inputNode = (
                    <select className="admin-select" value={value} onChange={e => handleCambio(`default.${key}`, e.target.value)}>
                      {data.tarifas.TIPOS_CLIENTE.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  );
                } else if (key === 'preferenciaCotizacion') {
                  inputNode = (
                    <select className="admin-select" value={value} onChange={e => handleCambio(`default.${key}`, e.target.value)}>
                      <option value="VENTA">VENTA</option><option value="RENTA">RENTA</option><option value="AMBAS">AMBAS</option>
                    </select>
                  );
                } else if (key === 'Departamento') {
                  inputNode = (
                    <select className="admin-select" value={value} onChange={e => {
                      handleCambio(`default.${key}`, e.target.value);
                      handleCambio('default.Ciudad', ''); 
                    }}>
                      <option value="">Seleccione...</option>
                      {data.colombia_clima.map(d => <option key={d.departamento} value={d.departamento}>{d.departamento}</option>)}
                    </select>
                  );
                } else if (key === 'Ciudad') {
                  inputNode = (
                    <select className="admin-select" value={value} onChange={e => handleCambio(`default.${key}`, e.target.value)}>
                      <option value="">Seleccione...</option>
                      {ciudadesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  );
                } else if (typeof value === 'boolean') {
                  inputNode = (
                    <label className="switch mt-10">
                      <input type="checkbox" checked={value} onChange={(e) => handleCambio(`default.${key}`, e.target.checked)} />
                      <span className="slider round"></span>
                    </label>
                  );
                } else {
                  const isNumeric = camposNumericosEstrictos.includes(key);
                  inputNode = (
                    <input 
                      type={isNumeric ? 'number' : 'text'} 
                      step={isNumeric ? 'any' : undefined}
                      value={value} 
                      onChange={(e) => {
                        const val = e.target.value;
                        handleCambio(`default.${key}`, isNumeric && val !== '' ? Number(val) : val);
                      }} 
                    />
                  );
                }

                return (
                  <div key={key} className="admin-input-group card-style">
                    <label>{key.replace(/_/g, ' ')}</label>
                    <p className="const-hint">{DESCRIPCIONES_DEFAULT[key]}</p>
                    {inputNode}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTarifas = () => (
    <div className="tarifas-container">
      <div className="admin-card mb-20">
        <div className="admin-card-header"><h3>Tasa de Instalación (% sobre valor equipo)</h3></div>
        <div className="admin-card-body">
          {['VENTA', 'RENTA'].map(modalidad => (
            <div key={modalidad} className="sub-seccion">
              <h4>{modalidad}</h4>
              <div className="grid-3-cols">
                {Object.keys(data.tarifas.TASA_INSTALACION[modalidad]).map(tipoCliente => (
                  <div key={tipoCliente} className="tarifa-box">
                    <h5>{tipoCliente}</h5>
                    {Object.keys(data.tarifas.TASA_INSTALACION[modalidad][tipoCliente]).map(region => (
                      <div key={region} className="tarifa-input">
                        <span>{region}</span>
                        <input type="number" step="0.01" value={data.tarifas.TASA_INSTALACION[modalidad][tipoCliente][region]} 
                          onChange={e => handleCambio(`tarifas.TASA_INSTALACION.${modalidad}.${tipoCliente}.${region}`, Number(e.target.value))} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="admin-card mb-20">
        <div className="admin-card-header"><h3>Tarifa de Renta ($ / m³)</h3></div>
        <div className="admin-card-body grid-3-cols">
            {Object.keys(data.tarifas.TARIFA_RENTA_M3).map(tipoCliente => (
                <div key={tipoCliente} className="tarifa-box">
                  <h5>{tipoCliente}</h5>
                  {Object.keys(data.tarifas.TARIFA_RENTA_M3[tipoCliente]).map(region => (
                    <div key={region} className="tarifa-input">
                      <span>{region}</span>
                      <input type="number" value={data.tarifas.TARIFA_RENTA_M3[tipoCliente][region]} 
                        onChange={e => handleCambio(`tarifas.TARIFA_RENTA_M3.${tipoCliente}.${region}`, Number(e.target.value))} />
                    </div>
                  ))}
                </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderCatalogo = () => (
    <div className="catalogo-container">
      {['INVERTER', 'ON_OFF'].map(categoria => {
        const titulo = categoria === 'INVERTER' ? 'INVERTER (Artículos para la Venta)' : 'ON/OFF (Artículos para Renta)';
        const arrayEquipos = data.catalogo[categoria] || [];
        const baseTipo = categoria === 'INVERTER' ? 'VENTA' : 'RENTA';

        return (
          <div key={categoria} className="admin-card mb-20">
            <div className="admin-card-header"><h3>{titulo}</h3></div>
            <div className="admin-card-body array-grid">
              {arrayEquipos.map((equipo, idx) => (
                <div key={idx} className="array-item-card">
                  <div className="array-item-header">
                    <span>{equipo.sku || 'Nuevo Equipo'}</span>
                    <button className="btn-icon btn-danger" onClick={() => setModalDelete({ open: true, path: `catalogo.${categoria}`, array: arrayEquipos, index: idx })}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="admin-input-group"><label>SKU</label><input type="text" value={equipo.sku} onChange={e => handleCambio(`catalogo.${categoria}.${idx}.sku`, e.target.value)} /></div>
                  <div className="admin-input-group"><label>Potencia (kW)</label><input type="number" value={equipo.potencia} onChange={e => handleCambio(`catalogo.${categoria}.${idx}.potencia`, Number(e.target.value))} /></div>
                  <div className="admin-input-group"><label>BTU</label><input type="number" value={equipo.btu} onChange={e => handleCambio(`catalogo.${categoria}.${idx}.btu`, Number(e.target.value))} /></div>
                  <div className="admin-input-group"><label>Precio ($)</label><input type="number" value={equipo.precio} onChange={e => handleCambio(`catalogo.${categoria}.${idx}.precio`, Number(e.target.value))} /></div>
                  <div className="admin-input-group"><label>Enlace Ficha Técnica</label><input type="text" value={equipo.fichaTecnica} onChange={e => handleCambio(`catalogo.${categoria}.${idx}.fichaTecnica`, e.target.value)} /></div>
                </div>
              ))}
              <button className="btn-agregar" onClick={() => handleCambio(`catalogo.${categoria}`, [...arrayEquipos, { sku: "NUEVO-SKU", potencia: 0, btu: 0, precio: 0, tipo: baseTipo, fichaTecnica: "" }])}>
                <PlusCircle size={18} /> Agregar Producto
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderClima = () => {
    const filtrados = data.colombia_clima.map((depto, deptoIdx) => {
      const ciudadesFiltradas = depto.ciudades_data?.filter(c => 
        c.nombre.toLowerCase().includes(busquedaClima.toLowerCase()) || 
        depto.departamento.toLowerCase().includes(busquedaClima.toLowerCase())
      ) || [];
      return { ...depto, deptoIdx, ciudades_data: ciudadesFiltradas };
    }).filter(d => d.ciudades_data.length > 0);

    return (
      <div className="clima-container">
        <div className="search-bar">
          <Search size={20} color="#64748b"/>
          <input type="text" placeholder="Búsqueda indexada por ciudad o departamento..." value={busquedaClima} onChange={e => setBusquedaClima(e.target.value)} />
        </div>
        
        {filtrados.map((depto) => (
          <div key={depto.departamento} className="admin-card mb-20">
            <div className="admin-card-header"><h3>{depto.departamento}</h3></div>
            <div className="admin-card-body grid-3-cols">
              {depto.ciudades_data.map((ciudad) => {
                const realCityIdx = data.colombia_clima[depto.deptoIdx].ciudades_data.findIndex(c => c.nombre === ciudad.nombre);
                const pathBase = `colombia_clima.${depto.deptoIdx}.ciudades_data.${realCityIdx}`;
                return (
                  <div key={ciudad.nombre} className="tarifa-box">
                    <h5>{ciudad.nombre}</h5>
                    <div className="tarifa-input">
                      <span>Temp. (°C)</span>
                      <input type="number" step="0.1" value={ciudad.temperatura_promedio} onChange={e => handleCambio(`${pathBase}.temperatura_promedio`, Number(e.target.value))} />
                    </div>
                    <div className="tarifa-input mt-10">
                      <span>Hum. (%)</span>
                      <input type="number" value={ciudad.humedad_actual} onChange={e => handleCambio(`${pathBase}.humedad_actual`, Number(e.target.value))} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="admin-login-wrapper">
        <form onSubmit={handleAuth} className="admin-login-box">
          <ShieldCheck size={48} color="#0055c5" />
          <h2>Acceso Restringido</h2>
          {error && <div className="error-alert">{error}</div>}
          <input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary">Validar Credenciales</button>
        </form>
      </div>
    );
  }

  if (!data) return <div className="admin-loader">Interconectando nodos...</div>;

  return (
    <div className="admin-layout">
      {/* HEADER MOBILE */}
      <div className="mobile-header">
        <div className="admin-brand"><ShieldCheck size={24} /><span>Panel Master</span></div>
        <button className="btn-icon" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="admin-brand desktop-only"><ShieldCheck size={24} /><span>Panel Master</span></div>
        <nav className="admin-nav">
          <button className={activeTab === 'constantes' ? 'active' : ''} onClick={() => { setActiveTab('constantes'); setMenuOpen(false); }}>CONSTANTES</button>
          <button className={activeTab === 'default' ? 'active' : ''} onClick={() => { setActiveTab('default'); setMenuOpen(false); }}>VALORES INICIALES</button>
          <button className={activeTab === 'tarifas' ? 'active' : ''} onClick={() => { setActiveTab('tarifas'); setMenuOpen(false); }}>TARIFAS</button>
          <button className={activeTab === 'catalogo' ? 'active' : ''} onClick={() => { setActiveTab('catalogo'); setMenuOpen(false); }}>CATÁLOGO (Equipos)</button>
          <button className={activeTab === 'colombia_clima' ? 'active' : ''} onClick={() => { setActiveTab('colombia_clima'); setMenuOpen(false); }}>CLIMA Y CIUDADES</button>
          <div className="divider"></div>
          <button className={activeTab === 'administradores' ? 'active' : ''} onClick={() => { setActiveTab('administradores'); setMenuOpen(false); }}>🛡️ CONTROL DE ACCESO</button>
        </nav>
        <div className="admin-user-info">
          <span>{user.email}</span>
          <button onClick={() => signOut(auth)}><LogOut size={18} /></button>
        </div>
      </aside>
      
      <main className="admin-main">
        <header className="admin-topbar">
          <h2>{activeTab.replace('_', ' ').toUpperCase()}</h2>
          {activeTab !== 'administradores' && (
            <button className="btn-primary btn-icon-text" onClick={handleGuardar} disabled={saving}>
              <Save size={18} /> {saving ? 'Subiendo...' : 'Publicar'}
            </button>
          )}
        </header>

        <div className="admin-content-scroll">
          {activeTab === 'constantes' && renderConstantes()}
          {activeTab === 'default' && renderDefault()}
          {activeTab === 'tarifas' && renderTarifas()}
          {activeTab === 'catalogo' && renderCatalogo()}
          {activeTab === 'colombia_clima' && renderClima()}
          
          {activeTab === 'administradores' && (
            <div className="admin-card p-20">
              <h3>Directorio Administrativo</h3>
              <p className="hint">Mapeo de accesos I/O.</p>
              <div className="add-admin-bar">
                <input type="email" placeholder="usuario@dominio.com" value={nuevoAdmin} onChange={e => setNuevoAdmin(e.target.value)} />
                <button className="btn-primary" onClick={agregarAdmin}>Inyectar</button>
              </div>
              <div className="admin-list">
                {Object.keys(admins).map(key => (
                  <div key={key} className="admin-list-item">
                    <span>{key.replace(/,/g, '.')}</span>
                    <button className="btn-icon btn-danger" onClick={() => eliminarAdmin(key)}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {modalDelete.open && (
        <div className="modal-overlay">
          <div className="modal-security">
            <AlertTriangle size={40} color="#ef4444" />
            <h3>Validación de Seguridad</h3>
            {deleteError && <span className="error-text">{deleteError}</span>}
            <form onSubmit={confirmarEliminacion}>
              <input type="password" placeholder="Clave maestra..." value={deletePass} onChange={e => setDeletePass(e.target.value)} autoFocus required />
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalDelete({open:false, path:'', array:[], index:null})}>Abortar</button>
                <button type="submit" className="btn-danger-solid">Purgar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}