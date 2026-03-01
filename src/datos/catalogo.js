// src/datos/catalogo.js

export let CATALOGO = { ON_OFF: [], INVERTER: [] };

export const initCatalogo = (data) => {
  if (!data) return;
  CATALOGO = data;
};