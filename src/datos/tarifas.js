// src/datos/tarifas.js

export const TIPOS_CLIENTE = [
  "Persona Natural",
  "Unidad Residencial",
  "Comercial"
];

// Mapeo de Departamentos a Regiones de Tarifas
export const getRegion = (departamento) => {
  if (!departamento) return "Resto";
  
  const dep = departamento.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); // Normalizar texto

  if (dep.includes("antioquia")) return "Antioquia";
  if (dep.includes("quindio")) return "Quindío";
  if (dep.includes("cundinamarca") || dep.includes("bogota")) return "Cundinamarca";
  
  // Lista de departamentos Costa
  const costa = ["atlantico", "bolivar", "magdalena", "cesar", "cordoba", "sucre", "la guajira", "san andres"];
  if (costa.some(c => dep.includes(c))) return "Costa";

  return "Resto";
};

// Porcentaje de instalación sobre el valor del equipo
export const TASA_INSTALACION = {
  VENTA: {
    Antioquia: 0.10,
    Quindío: 0.15,
    Cundinamarca: 0.15,
    Costa: 0.20,
    Resto: 0.20
  },
  RENTA: {
    Antioquia: 0.13,
    Quindío: 0.18,
    Cundinamarca: 0.18,
    Costa: 0.22,
    Resto: 0.18
  }
};

// Tarifa de alquiler mensual ($/m3 de piscina)
export const TARIFA_RENTA_M3 = {
  "Persona Natural": {
    Antioquia: 6545,
    Quindío: 6217,
    Cundinamarca: 7200,
    Costa: 6545,
    Resto: 7600
  },
  "Unidad Residencial": {
    Antioquia: 6872,
    Quindío: 6527,
    Cundinamarca: 7400,
    Costa: 7800,
    Resto: 7500
  },
  "Comercial": {
    Antioquia: 8872, 
    Quindío: 6527,
    Cundinamarca: 7400,
    Costa: 7800,
    Resto: 7500
  }
};