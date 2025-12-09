// src/logica/generadorPDF.js
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable'; // <--- CAMBIO 1: Importar la función

// Helper para formatear números
const formatCOP = (num) => {
  return `$ ${new Intl.NumberFormat('es-CO').format(num.toFixed(0))}`;
};

export const generarPDF = (r) => { // r = resultado
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text("Cotización Preliminar - Más Centígrados S.A.S.", 14, 22);

  // A. CONDICIONES DE DISEÑO
  doc.setFontSize(12);
  doc.text("A. Condiciones de Diseño", 14, 40);
  //                              <--- CAMBIO 2: Llamar como función
  autoTable(doc, {
    startY: 45,
    head: [['Parámetro', 'Valor']],
    body: [
      ['Ciudad', r.datosUsados.Ciudad],
      ['Temp. Ambiente (T_a)', `${r.datosUsados.T_a} °C`],
      ['Humedad Relativa (HR)', `${r.datosUsados.HR} %`],
      ['Volumen Piscina', `${r.datosUsados.V.toFixed(2)} m³`],
      ['Temp. Objetivo (T_w)', `${r.datosUsados.T_w} °C`],
      ['Usa Manta', r.datosUsados.usa_manta ? 'Sí' : 'No'],
    ],
  });

  // B. SELECCIÓN DE EQUIPOS
  let finalY = doc.lastAutoTable.finalY || 70; // (Esto sigue funcionando igual)
  doc.text("B. Selección de Equipos", 14, finalY + 10);
  //                              <--- CAMBIO 3: Llamar como función
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Cantidad', 'Referencia', 'Potencia (kW)', 'Línea']],
    body: [
      [
        r.seleccion.equipos[0].cantidad,
        r.seleccion.equipos[0].sku,
        `${r.seleccion.equipos[0].potencia} kW c/u`,
        r.seleccion.tipo,
      ],
    ],
  });

  // C. VALORES COMERCIALES
  finalY = doc.lastAutoTable.finalY;
  doc.text("C. Valores Comerciales (COP)", 14, finalY + 10);
  //                              <--- CAMBIO 4: Llamar como función
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Concepto', 'Valor']],
    body: [
      ['Valor base equipos', formatCOP(r.subtotal)],
      ['Instalación', formatCOP(r.instalacion)],
      ['IVA (19% sobre equipos)', formatCOP(r.iva)],
    ],
    foot: [
      ['TOTAL PRELIMINAR', formatCOP(r.total)]
    ],
    footStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' },
  });

  // ... Añadir observaciones ...
  finalY = doc.lastAutoTable.finalY;
  doc.setFontSize(8);
  doc.text("Observaciones: Sujeto a visita técnica e inventario.", 14, finalY + 10);

  doc.save(`Cotizacion_Más_Centigrados_${r.datosUsados.Ciudad}.pdf`);
};