// src/datos/constantes.js


export let PR_M_DEFAULT = 1.8;
export let VV = 0.8;
export let HFG = 2400;
export let EPS = 5.67e-8;
export let CP = 4.186;
export let RO = 998;
export let PCT_INSTALACION = 0.20;
export let PCT_IVA = 0.19;
export let HORAS_DIARIAS_TRABAJO = 24;
export let FACTOR_SEGURIDAD_QTOTAL = 1.2;

export const initConstantes = (data, defecto) => {
  if (!data || !defecto) return;
  // 1. Extracción segura: Convertimos a número y validamos que sea mayor a 0
  const profExtraida = parseFloat(defecto.Profundidad);
  // 2. Asignación: Si es un número válido, lo usa. Si viene vacío, texto o cero, clava el 1.8.
  PR_M_DEFAULT = (!isNaN(profExtraida) && profExtraida > 0) ? profExtraida : 1.8;
  console.log("defoult despues: " + PR_M_DEFAULT)
  VV = data.VV ?? VV;
  HFG = data.HFG ?? HFG;
  EPS = data.EPS ?? EPS;
  CP = data.CP ?? CP;
  RO = data.RO ?? RO;
  PCT_INSTALACION = data.PCT_INSTALACION ?? PCT_INSTALACION;
  PCT_IVA = data.PCT_IVA ?? PCT_IVA;
  HORAS_DIARIAS_TRABAJO = data.HORAS_DIARIAS_TRABAJO ?? HORAS_DIARIAS_TRABAJO;
  FACTOR_SEGURIDAD_QTOTAL = data.FACTOR_SEGURIDAD_QTOTAL ?? FACTOR_SEGURIDAD_QTOTAL;
};