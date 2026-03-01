// src/datos/tarifas.js

export let TIPOS_CLIENTE = ["Persona Natural", "Unidad Residencial", "Comercial"];
export let TASA_INSTALACION = { VENTA: {}, RENTA: {} };
export let TARIFA_RENTA_M3 = { "Persona Natural": {}, "Unidad Residencial": {}, "Comercial": {} };

export const initTarifas = (data) => {
  if (!data) return;
  TIPOS_CLIENTE = data.TIPOS_CLIENTE ?? TIPOS_CLIENTE;
  TASA_INSTALACION = data.TASA_INSTALACION ?? TASA_INSTALACION;
  TARIFA_RENTA_M3 = data.TARIFA_RENTA_M3 ?? TARIFA_RENTA_M3;
};

export const getRegion = (departamento) => {
  if (!departamento) return "Resto";
  const dep = departamento.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (dep.includes("antioquia")) return "Antioquia";
  if (dep.includes("quindio")) return "Quindío";
  if (dep.includes("cundinamarca") || dep.includes("bogota")) return "Cundinamarca";
  const costa = ["atlantico", "bolivar", "magdalena", "cesar", "cordoba", "sucre", "la guajira", "san andres"];
  if (costa.some(c => dep.includes(c))) return "Costa";
  return "Resto";
};