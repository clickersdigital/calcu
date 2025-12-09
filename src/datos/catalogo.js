// src/datos/catalogo.js

export const CATALOGO = {
  // RENTA (Alquiler)
  ON_OFF: [
    { sku: "BCAH-96-410-XEF", potencia: 27, precio: 12000000, tipo: "RENTA" },
    { sku: "BCAH-140-410-3EF", potencia: 42, precio: 16000000, tipo: "RENTA" },
  ],
  // VENTA (Compra)
  INVERTER: [
    { sku: "BCAH-I-80-32-2EF", potencia: 20, precio: 10833333, tipo: "VENTA" },
    { sku: "BCAH-I-112-32-XEF", potencia: 30, precio: 14250000, tipo: "VENTA" },
    { sku: "BCAH-I-150-32-XEF", potencia: 40, precio: 18250000, tipo: "VENTA" },
  ],
};