// src/logica/selector.js
import { CATALOGO } from '../datos/catalogo';

/**
 * Función auxiliar para encontrar la mejor combinación de equipos
 * Estrategia: Llenar con el más grande posible y cubrir el remanente con el más ajustado.
 */
function buscarCombinacion(Q_requerido, catalogoDisponible) {
  // Ordenar de menor a mayor potencia
  const listaOrdenada = [...catalogoDisponible].sort((a, b) => a.potencia - b.potencia);
  const equipoMasGrande = listaOrdenada[listaOrdenada.length - 1];

  let equiposSeleccionados = [];
  let potenciaAcumulada = 0;
  let btuAcumulados = 0;
  let precioAcumulado = 0;
  let cargaRestante = Q_requerido;

  // 1. Si la carga es muy grande, usamos múltiplos del equipo mayor
  if (cargaRestante > equipoMasGrande.potencia) {
    const cantidadGrandes = Math.floor(cargaRestante / equipoMasGrande.potencia);
    
    equiposSeleccionados.push({
      ...equipoMasGrande,
      cantidad: cantidadGrandes
    });

    const potenciaAportada = cantidadGrandes * equipoMasGrande.potencia;
    potenciaAcumulada += potenciaAportada;
    btuAcumulados += cantidadGrandes * equipoMasGrande.btu; //<<<--- nueva variable
    precioAcumulado += cantidadGrandes * equipoMasGrande.precio;
    cargaRestante -= potenciaAportada;
  }

  // 2. Si todavía falta cubrir (o si era pequeña desde el principio)
  if (cargaRestante > 0) {
    // Buscamos el equipo más pequeño que cubra lo que falta
    const equipoRemanente = listaOrdenada.find(e => e.potencia >= cargaRestante);
    
    // Si no encontramos uno (caso raro donde el remanente es mayor al más grande, no debería pasar por el paso 1)
    // Usamos otro grande, o el que encontramos.
    const equipoFinal = equipoRemanente || equipoMasGrande;

    // Verificamos si este equipo ya estaba en la lista para sumar cantidad, o lo agregamos nuevo
    const existente = equiposSeleccionados.find(e => e.sku === equipoFinal.sku);
    if (existente) {
      existente.cantidad += 1;
    } else {
      equiposSeleccionados.push({
        ...equipoFinal,
        cantidad: 1
      });
    }

    potenciaAcumulada += equipoFinal.potencia;
    btuAcumulados += equipoFinal.btu;
    precioAcumulado += equipoFinal.precio;
  }

  return {
    equipos: equiposSeleccionados, // Array de objetos {sku, cantidad...}
    P_cal: potenciaAcumulada,      // Potencia Total Instalada
    P_cal_btu: btuAcumulados, // <<---- Enviamos BTU
    precioBase: precioAcumulado    // Precio Total Base
  };
}

export function seleccionarEquipos(Q_total_requerido) {
  
  // 1. Calcular combinación para VENTA
  const comboVenta = buscarCombinacion(Q_total_requerido, CATALOGO.INVERTER);
  const seleccionVenta = {
    tipo: "VENTA (Inverter)",
    ...comboVenta // trae equipos, P_cal, precioBase
  };

  // 2. Calcular combinación para RENTA
  const comboRenta = buscarCombinacion(Q_total_requerido, CATALOGO.ON_OFF);
  const seleccionRenta = {
    tipo: "RENTA (On/Off)",
    ...comboRenta // trae equipos, P_cal, precioBase
  };

  return { seleccionVenta, seleccionRenta };
}