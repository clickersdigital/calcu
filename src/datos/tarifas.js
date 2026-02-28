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
    "Persona Natural": { Antioquia: 0.10, Quindío: 0.15, Cundinamarca: 0.15, Costa: 0.20, Resto: 0.20 },
    "Unidad Residencial": { Antioquia: 0.12, Quindío: 0.15, Cundinamarca: 0.15, Costa: 0.20, Resto: 0.20 },
    "Comercial": { Antioquia: 0.14, Quindío: 0.19, Cundinamarca: 0.19, Costa: 0.19, Resto: 0.24 }
  },
  RENTA: {
    "Persona Natural": { Antioquia: 0.13, Quindío: 0.18, Cundinamarca: 0.18, Costa: 0.22, Resto: 0.18 },
    "Unidad Residencial": { Antioquia: 0.15, Quindío: 0.20, Cundinamarca: 0.20, Costa: 0.24, Resto: 0.20 },
    "Comercial": { Antioquia: 0.17, Quindío: 0.22, Cundinamarca: 0.22, Costa: 0.26, Resto: 0.22 }
  }
};

// Tarifa de alquiler mensual ($/m3 de piscina)
export const TARIFA_RENTA_M3 = {
  "Persona Natural": {
    Antioquia: 7330,
    Quindío: 6963,
    Cundinamarca: 8050,
    Costa: 8512,
    Resto: 8200
  },
  "Unidad Residencial": {
    Antioquia: 7696,
    Quindío: 7310,
    Cundinamarca: 8288,
    Costa: 8736,
    Resto: 8400
  },
  "Comercial": {
    Antioquia: 8050, 
    Quindío: 7676,
    Cundinamarca: 8624,
    Costa: 8960,
    Resto: 8680
  }
};