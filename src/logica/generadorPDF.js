// src/logica/generadorPDF.js
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

// Helper para formatear dinero
const formatCOP = (num) => {
  return `$ ${new Intl.NumberFormat('es-CO').format(num.toFixed(0))}`;
};
const formatNumber = (num) => new Intl.NumberFormat('es-CO').format(num); //<<- helper sugerido

export const generarPDF = (r, modo) => {
  const doc = new jsPDF();
  const datos = r.datosUsados;
  
  // Seleccionamos los datos según el modo (VENTA o RENTA)
  const dataEco = modo === "VENTA" ? r.escenarioVenta : r.escenarioRenta;
  
  // Títulos y Lógica de Línea
  const titulo = modo === "VENTA" ? "COTIZACIÓN DE VENTA" : "PLAN DE RENTA MENSUAL";
  const lineaEquipo = modo === "VENTA" ? "Inverter" : "On/Off"; 

  if (!dataEco) {
    alert(`No hay opción disponible para ${modo}`);
    return;
  }

  // --- ENCABEZADO ---
  doc.setFontSize(18);
  doc.text(`${titulo} - Más Centígrados S.A.S.`, 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Servicio: ${datos.tipoCliente}`, 14, 30);
  doc.text(`Región: ${dataEco.region}`, 14, 35);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 40);

  // --- A. CONDICIONES DE DISEÑO ---
  doc.setFontSize(12);
  doc.text("Cotización indicativa", 14, 50);
  autoTable(doc, {
    startY: 55,
    head: [['Parámetro', 'Valor']],
    body: [
      ['Ubicación', `${datos.Ciudad}, ${datos.Departamento}`],
      ['Temp. Ambiente / Humedad', `${datos.T_a} °C / ${datos.HR}%`],
      ['Volumen', `${datos.V.toFixed(2)} m³`],
      ['Temperatura Objetivo', `${datos.T_w} °C`],
    ],
    theme: 'grid', 
    headStyles: { fillColor: [66, 66, 66] }
  });

  // --- B. EQUIPOS SELECCIONADOS ---
  let finalY = doc.lastAutoTable.finalY || 70;
  doc.text("Equipos", 14, finalY + 10);

  const columnas = modo === "VENTA"
    ? [['Cant.', 'Referencia', 'Capacidad', 'Línea', 'Precio Unit.']]
    : [['Cant.', 'Referencia', 'Capacidad', 'Línea']];

  // Preparamos las filas dinámicamente
  const filasEquipos = dataEco.equipo.equipos.map(eq => {
      // Datos base que siempre van
      const fila = [
        eq.cantidad,
        eq.sku,
        `${formatNumber(eq.btu)} BTU/h`, // Usando tu nueva variable de BTU
        lineaEquipo
      ];

      // SOLO si es VENTA agregamos el precio al final del array
      if (modo === "VENTA") {
        fila.push(formatCOP(eq.precio));
      }

      return fila;
    });

  
  autoTable(doc, {
    startY: finalY + 15,
    head: columnas, // <--- Aquí pasamos la variable dinámica
    body: filasEquipos,
    theme: 'striped',
    headStyles: { fillColor: modo === "VENTA" ? [5, 150, 105] : [217, 119, 6] }
  });

  // --- C. PROPUESTA ECONÓMICA ---
  finalY = doc.lastAutoTable.finalY;
  doc.text("Valor estimado (COP)", 14, finalY + 10);

  let cuerpoTabla = [];
  let pieTabla = [];

  if (modo === "VENTA") {
    // Estructura para VENTA
    cuerpoTabla = [
      ['Valor Equipos (Subtotal)', formatCOP(dataEco.subtotal)],
      ['Instalación (Mano de obra y materiales)', formatCOP(dataEco.instalacion)],
      ['IVA (19% sobre equipos)', formatCOP(dataEco.iva)],
    ];
    pieTabla = [['TOTAL A PAGAR', formatCOP(dataEco.total)]];
  } else {
    // --- AQUÍ ESTÁ EL CAMBIO PARA RENTA ---
    cuerpoTabla = [
      ['Instalación Inicial (Pago Único)', formatCOP(dataEco.instalacionInicial)],
      ['Canon Mensual (Subtotal)', formatCOP(dataEco.mensualidadSubtotal)], // Usamos la variable de subtotal
      ['IVA Mensual (19%)', formatCOP(dataEco.ivaMensual)],                // Usamos la variable de IVA
      ['Incluye', 'Mantenimiento preventivo y correctivo'],
    ];
    // En renta destacamos la mensualidad TOTAL (con IVA)
    pieTabla = [['MENSUALIDAD', formatCOP(dataEco.mensualidad)]];
  }

  autoTable(doc, {
    startY: finalY + 15,
    head: [['Concepto', 'Valor']],
    body: cuerpoTabla,
    foot: pieTabla,
    footStyles: { 
        fillColor: [220, 220, 220], 
        textColor: 0, 
        fontStyle: 'bold', 
        halign: 'right' 
    },
    columnStyles: {
        1: { halign: 'right' } 
    }
  });

  // Pie de página simple
  finalY = doc.lastAutoTable.finalY;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`
  Esta cotización es de carácter informativo y preliminar. No genera obligación alguna para las partes y está sujeta a cambios técnicos,
  logísticos, regulatorios, económicos y de importación. El precio final, alcance definitivo y cronograma serán definidos únicamente en
  la propuesta comercial final, una vez realizadas las validaciones técnicas, logísticas y comerciales correspondiente.
  `, 14, finalY + 10);

  doc.save(`Cotizacion_${modo}_${datos.Ciudad}.pdf`);
};