// src/logica/selector.js
import { CATALOGO } from '../datos/catalogo';

/**
 * Selecciona el equipo adecuado basándose en la potencia requerida.
 * @param {number} Q_total_requerido - Potencia total necesaria en kW.
 * @returns {object} Objeto con las selecciones (Inverter, On/Off, etc.)
 */
export function seleccionarEquipos(Q_total_requerido) {
  // --- Lógica de Selección ---
  
  // 1. Selección INVERTER
  // Buscamos el primer equipo cuya potencia sea mayor o igual a la requerida
  let seleccionInverter = null;
  
  // Ordenamos por potencia ascendente para asegurar que elegimos el más pequeño posible
  // (Asumiendo que el catálogo podría venir desordenado, es buena práctica)
  const inverterOrdenados = [...CATALOGO.INVERTER].sort((a, b) => a.potencia - b.potencia);

  for (const eq of inverterOrdenados) {
    if (eq.potencia >= Q_total_requerido) {
      seleccionInverter = {
        tipo: "INVERTER",
        equipos: [{ ...eq, cantidad: 1 }],
        P_cal: eq.potencia, // P_cal es la potencia total instalada
      };
      break; // Encontramos el más pequeño que sirve
    }
  }

  // TODO: Implementar lógica ON/OFF (Bloque 4.2)
  // TODO: Implementar lógica de MÚLTIPLES equipos (ej. si Q_total > 40)

  return { seleccionInverter };
}