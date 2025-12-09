// /datos/tarifas.js

// Tasas de instalación y factores regionales basados en la imagen

export const REGIONES = [
  "Antioquia",
  "Quindío",
  "Cundinamarca",
  "Costa",
  "Resto"
];

export const TIPOS_CLIENTE = [
  "Persona Natural",
  "Unidad Residencial",
  "Comercial"
];

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
// Estructura: TARIFA_RENTA[TipoCliente][Region]
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