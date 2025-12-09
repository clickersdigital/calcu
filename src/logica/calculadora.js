// src/logica/calculadora.js
import * as C from '../datos/constantes';
import { getClima } from '../datos/clima';
import { seleccionarEquipos } from './selector'; 
import { getRegion, TASA_INSTALACION, TARIFA_RENTA_M3 } from '../datos/tarifas';

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

  console.log('Q Total ', + Q_total)

  return { Q_total, A_p };
}

// --- PASO 2: FINANCIERA ---
function calcularEscenarios(datosEntrada, Q_total, seleccionVenta, seleccionRenta) {
  const { Departamento, tipoCliente, V, Precio_kWh, T_a, T_w } = datosEntrada;
  const region = getRegion(Departamento);
  const tasaInstVenta = TASA_INSTALACION.VENTA[region];
  const tasaInstRenta = TASA_INSTALACION.RENTA[region];
  const tarifaM3 = TARIFA_RENTA_M3[tipoCliente][region];

  let COP_val = 5; 
  if (T_a >= 26) COP_val = 6;
  else if (T_a >= 21) COP_val = 5;
  else if (T_a >= 13) COP_val = 4;
  
  // ESCENARIO VENTA
  let escenarioVenta = null;
  if (seleccionVenta) {
    const p_elec = seleccionVenta.P_cal / COP_val;
    const costo_dia = p_elec * C.HORAS_DIARIAS_TRABAJO * Precio_kWh;
    const subtotal = seleccionVenta.precioBase;
    const instalacion = subtotal * tasaInstVenta;
    const iva = subtotal * C.PCT_IVA; 
    const total = subtotal + instalacion + iva;

    escenarioVenta = {
      equipo: seleccionVenta,
      costo_dia,
      subtotal,
      instalacion,
      iva,
      total,
      region
    };
  }

  // ESCENARIO RENTA (Aquí calculamos el IVA)
  let escenarioRenta = null;
  if (seleccionRenta) {
    const p_elec = seleccionRenta.P_cal / COP_val;
    const costo_dia_energia = p_elec * C.HORAS_DIARIAS_TRABAJO * Precio_kWh;
    const precioBaseCalculo = seleccionRenta.precioBase;
    const instalacionInicial = precioBaseCalculo * tasaInstRenta; 

    // --- CÁLCULO DESGLOSADO ---
    const mensualidadSubtotal = V * tarifaM3;     // Valor antes de IVA
    const ivaMensual = mensualidadSubtotal * 0.19; // El IVA
    const mensualidadTotal = mensualidadSubtotal + ivaMensual; // El Total

    escenarioRenta = {
      equipo: seleccionRenta,
      costo_dia_energia,
      instalacionInicial,
      mensualidadSubtotal, // Enviamos Subtotal
      ivaMensual,          // Enviamos IVA
      mensualidad: mensualidadTotal, // Enviamos Total
      tarifaM3,
      region
    };
  }

  return { escenarioVenta, escenarioRenta };
}

export function calcularCotizacionCompleta(datosEntrada) {
  let V = datosEntrada.Volumen;
  let Pr_m_usada = C.PR_M_DEFAULT;
  
  // Calcular Volumen si no existe
  if (!V && datosEntrada.Largo && datosEntrada.Ancho) {
    Pr_m_usada = datosEntrada.Profundidad || C.PR_M_DEFAULT;
    V = datosEntrada.Largo * datosEntrada.Ancho * Pr_m_usada;
  }
  
  // LÓGICA DE CLIMA:
  // 1. Obtenemos datos del JSON por si acaso
  const climaJSON = getClima(datosEntrada.Departamento, datosEntrada.Ciudad);

  // 2. Priorizamos los datos que vienen del FORMULARIO (editados), si no hay, usamos JSON
  const T_a_final = datosEntrada.T_a !== "" ? parseFloat(datosEntrada.T_a) : climaJSON.T_a;
  const HR_final = datosEntrada.HR !== "" ? parseFloat(datosEntrada.HR) : climaJSON.HR;

  const fs = datosEntrada.usa_manta ? 0.5 : 1.0;

  const datosCalculo = {
    ...datosEntrada,
    V,
    Pr_m_usada,
    fs,
    T_a: T_a_final, // Usamos el valor final
    HR: HR_final,   // Usamos el valor final
  };

  // 2. Calcular Q_total (Física)
  // Asegúrate de tener la función calcularPerdidas importada o definida arriba
  // Aquí la llamo asumiendo que está en el mismo archivo como te pasé antes
  const { Q_total, A_p } = calcularPerdidas(datosCalculo); 

  // 3. Seleccionar equipos
  const { seleccionVenta, seleccionRenta } = seleccionarEquipos(Q_total);

  if (!seleccionVenta && !seleccionRenta) {
    return { error: "No se encontró equipo adecuado para la potencia requerida." };
  }

  // 4. Calcular Escenarios
  // Asumiendo que calcularEscenarios está definida arriba
  const resultados = calcularEscenarios(
    datosCalculo,
    Q_total,
    seleccionVenta,
    seleccionRenta
  );

  return { 
    ...resultados, 
    Q_total,
    datosUsados: datosCalculo 
  };
}