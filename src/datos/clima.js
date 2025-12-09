// src/datos/clima.js

export const DATOS_CLIMA = {
  // Datos de ejemplo, debes completarlos
  //HAY QUE AÑADIR UNA NUEVA VARIABLE QUE ES UN VALOR SEGÚN EL MUNICIPIO fiv
  Bogotá: { T_a: 14, HR: 75 }, 
  Medellín: { T_a: 22, HR: 70 },
  Cartagena: { T_a: 28, HR: 80 },
  "Por defecto": { T_a: 20, HR: 65 }, // Si no se encuentra la ciudad
};

export const getClima = (ciudad) => {
  return DATOS_CLIMA[ciudad] || DATOS_CLIMA["Por defecto"];
};


//Variable de sobre tasa de instalación (Factor de instalación) fiv

