// src/logica/calculadora.js
import * as C from '../datos/constantes';
import { getClima } from '../datos/clima';
import { seleccionarEquipos } from './selector'; 

// --- PASO 1: CALCULAR Q_TOTAL (Física) ---

function calcularPerdidas(datos) {
  const { V, T_w, T_a, HR, fs, Pr_m_usada } = datos;
  
  // 1. Área (A_p)
  const A_p = datos.Largo && datos.Ancho 
    ? datos.Largo * datos.Ancho 
    : V / Pr_m_usada;

  // 2. Evaporación (Q_evap)
  const pws = 610.78 * Math.exp((17.269 * T_w) / (T_w + 237.3));
  const pws_a = 610.78 * Math.exp((17.269 * T_a) / (T_a + 237.3));
  const Dp = (pws - pws_a) / 1000;
  const h_evap = (0.089 + 0.078 * C.VV) * Dp * A_p;
  const Q_evap = (C.HFG * h_evap * 1000) / 3600; // en W

  // 3. Convección (Q_conv)
  const h_c = 5.8 + 4.1 * C.VV;
  const DT = T_w - T_a;
  const Q_conv = A_p * h_c * DT * fs; // en W

  // 4. Radiación (Q_rad)
  const T_wa = T_w + 273;
  const T_aa = T_a + 273;
  const DTC = Math.pow(T_wa, 4) - 0.8 * Math.pow(T_aa, 4);
  const Q_rad = A_p * C.EPS * 0.96 * DTC; // en W
  
  // 5. Q_total (en kW)
  const Q_total_W = (Q_evap + Q_conv + Q_rad) * C.FACTOR_SEGURIDAD_QTOTAL;
  const Q_total = Q_total_W / 1000;

  return { Q_total, A_p };
}

// --- PASO 2: CALCULAR RESTO DE VARIABLES (Financiera/Operativa) ---

function calcularResultados(datosEntrada, Q_total, seleccion) {
  const { V, T_w, T_a, Precio_kWh } = datosEntrada;
  const { P_cal } = seleccion; 

  // 1. Energía Térmica (q_ter)
  const Dtt = T_w - (T_a - 2);
  const q_ter = V * C.CP * C.RO * Dtt * 0.0002777; // en kWh

  // 2. Tiempo Calentamiento (t_ob)
  const Q_BC_efectiva = P_cal - Q_total;
  const t_ob = Q_BC_efectiva > 0 ? q_ter / Q_BC_efectiva : -1; // en horas

  // 3. Costo Operativo (COP)
  let COP = 5; 
  if (T_a >= 26) COP = 6;
  else if (T_a >= 21) COP = 5;
  else if (T_a >= 13) COP = 4;

  const P_elec = P_cal / COP;
  const E_dia = P_elec * C.HORAS_DIARIAS_TRABAJO;
  const Costo_dia = E_dia * Precio_kWh;
  const Costo_mes = Costo_dia * 30;

  // 4. Cotización (Valores Comerciales)
  const subtotal = seleccion.equipos[0].precio; // Asumiendo 1 equipo
  const instalacion = subtotal * C.PCT_INSTALACION;
  const iva = subtotal * C.PCT_IVA;
  const total = subtotal + instalacion + iva;

  return {
    Q_total,
    q_ter,
    P_cal,
    t_ob,
    Costo_dia,
    Costo_mes,
    subtotal,
    instalacion,
    iva,
    total,
    seleccion,
  };
}

// --- FUNCIÓN PRINCIPAL (Orquestador) ---

export function calcularCotizacionCompleta(datosEntrada) {
  // 1. Preparar datos (Resolver Volumen, Clima, etc.)
  let V = datosEntrada.Volumen;
  let Pr_m_usada = C.PR_M_DEFAULT;
  
  if (!V && datosEntrada.Largo && datosEntrada.Ancho) {
    Pr_m_usada = datosEntrada.Profundidad || C.PR_M_DEFAULT;
    V = datosEntrada.Largo * datosEntrada.Ancho * Pr_m_usada;
  }
  
  const clima = getClima(datosEntrada.Ciudad);
  const fs = datosEntrada.usa_manta ? 0.5 : 1.0;

  const datosCalculo = {
    ...datosEntrada,
    V,
    Pr_m_usada,
    fs,
    ...clima, // Añade T_a y HR
  };

  // 2. Calcular Q_total (Física)
  const { Q_total, A_p } = calcularPerdidas(datosCalculo);

  // 3. Seleccionar Equipos (Lógica externa en selector.js)
  const { seleccionInverter } = seleccionarEquipos(Q_total);

  if (!seleccionInverter) {
    return { error: "No se encontró equipo para la potencia requerida." };
  }

  // 4. Calcular costos y tiempo
  const resultados = calcularResultados(
    datosCalculo,
    Q_total,
    seleccionInverter
  );

  return { ...resultados, datosUsados: datosCalculo, A_p };
}