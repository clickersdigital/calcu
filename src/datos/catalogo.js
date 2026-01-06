// src/datos/catalogo.js

export const CATALOGO = {
  // RENTA (Alquiler) - On/Off
  ON_OFF: [
    // Agregamos la propiedad 'btu' a cada objeto
    { sku: "BCAH-96-410-XEF", potencia: 27, btu: 96000, precio: 12000000, tipo: "RENTA" },
    { sku: "BCAH-140-410-3EF", potencia: 42, btu: 140000, precio: 16000000, tipo: "RENTA" },
  ],
  // VENTA (Compra) - Inverter
  INVERTER: [
    { sku: "BCAH-I-80-32-2EF", potencia: 20, btu: 80000, precio: 10833333, tipo: "VENTA" },
    { sku: "BCAH-I-112-32-XEF", potencia: 30, btu: 112000, precio: 14250000, tipo: "VENTA" },
    { sku: "BCAH-I-150-32-XEF", potencia: 40, btu: 150000, precio: 18250000, tipo: "VENTA" },
  ],
};