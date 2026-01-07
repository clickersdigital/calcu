// src/servicios/gemini.js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// 1. ESQUEMA DE DATOS (Debe coincidir con tu datosForm en App.jsx)
const jsonSchema = {
  type: "OBJECT",
  properties: {
    respuesta_chat: {
      type: "STRING",
      description: "Respuesta conversacional al usuario. No menciones precios.",
    },
    datos_actualizados: {
      type: "OBJECT",
      description: "Datos técnicos extraídos.",
      properties: {
        nombreCliente: { type: "STRING" },
        Ciudad: { type: "STRING", description: "Ciudad normalizada (ej: Bogotá, Cali)." },
        Departamento: { type: "STRING", description: "Departamento inferido (ej: Cundinamarca, Valle del Cauca)." },
        tipoCliente: { 
          type: "STRING", 
          enum: ["Persona Natural", "Unidad Residencial", "Comercial"]
        },
        // Clima (Si el usuario los sabe, sino null)
        T_a: { type: "NUMBER", description: "Temp Ambiente si el usuario la conoce." },
        HR: { type: "NUMBER", description: "Humedad Relativa si el usuario la conoce." },
        
        T_w: { type: "NUMBER", description: "Temperatura deseada del agua." },
        
        // Dimensiones
        Volumen: { type: "NUMBER" },
        Largo: { type: "NUMBER" },
        Ancho: { type: "NUMBER" },
        Profundidad: { type: "NUMBER" },
        
        // Manta (Booleano)
        usa_manta: { type: "BOOLEAN", description: "True si usa manta térmica, False si no." },

        // Acciones de cierre
        accion: { type: "STRING", enum: ["COTIZAR", "CONTINUAR"] },
        preferenciaCotizacion: { type: "STRING", enum: ["VENTA", "RENTA", "AMBAS"] }
      },
      nullable: true 
    }
  },
  required: ["respuesta_chat"]
};

export const enviarMensajeGemini = async (historial, contexto) => {
  const { datos, sistema } = contexto;

  const systemPrompt = `
  ERES: "Termo", Ingeniero Experto de "Más Centígrados S.A.S.".
  
  TU MISIÓN: Completar la ficha técnica siguiendo ESTRICTAMENTE este orden. No te saltes pasos.
  
  --- GUION PASO A PASO (NO AVANCES HASTA COMPLETAR EL ANTERIOR) ---
  
  1. NOMBRE: Si no lo tienes, saluda y pídelo.
  
  2. UBICACIÓN: 
     - Pide la Ciudad. 
     - INTERNAMENTE: Infiere el Departamento (Ej: Si dice "Medellín" -> Dept: "Antioquia").
     - Guarda ambos en el JSON.
  
  3. CLIMA LOCAL:
     - Pregunta: "¿Conoces la temperatura ambiente y humedad promedio de tu zona?".
     - Si dice "NO" o "Ni idea": Dile "Tranquilo, usaré los datos satelitales promedio". (No guardes T_a ni HR, deja que el sistema use los automáticos).
     - Si dice "SI" y da datos: Guárdalos en T_a y HR.

  4. TIPO DE CLIENTE:
     - Pregunta si es para uso personal, conjunto residencial o negocio (hotel/club).
     - Mapea a: "Persona Natural", "Unidad Residencial" o "Comercial".
     
  5. TEMPERATURA DESEADA:
     - Pregunta a qué temperatura quiere el agua.
     - Recomendación: "Sugerimos 28°C-30°C".

  6. DIMENSIONES:
     - Pide volumen (m³) O medidas (Largo x Ancho).
     - Si no sabe: Sugiere calcular con 50 m³.

  7. USO DE MANTA (IMPORTANTE):
     - Pregunta: "¿La piscina cuenta con manta térmica o cubierta?".
     - Guarda "usa_manta": true/false.

  8. CIERRE (SOLO AL TENER TODO LO ANTERIOR):
     - Pregunta: "¿Deseas ver opción de COMPRA, RENTA o AMBAS?".
     - RESPUESTA FINAL: Activa "accion": "COTIZAR".

  --- ESTADO ACTUAL ---
  - Nombre: ${datos.nombreCliente || 'Falta'}
  - Ubicación: ${datos.Ciudad || 'Falta'}
  - Manta: ${datos.usa_manta === true ? 'Sí' : datos.usa_manta === false ? 'No' : 'Falta preguntar'}
  
  IMPORTANTE: 
  - Si el usuario menciona una ciudad (ej: "Barranquilla"), DEBES devolver en el JSON: "Ciudad": "Barranquilla", "Departamento": "Atlántico". ¡Ayúdale al sistema!
  `;

  const historialFormateado = [
    { role: "user", parts: [{ text: systemPrompt }] },
    ...historial.map(msg => ({
      role: msg.role === 'ia' ? 'model' : 'user',
      parts: [{ text: msg.texto }]
    }))
  ];

  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: historialFormateado,
      config: {
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
      },
    });

    const result = await chat.sendMessage({
      message: "Analiza el input. Sigue el guion. Si el usuario da un dato, ACTUALIZA EL JSON."
    });

    return JSON.parse(result.text);

  } catch (error) {
    console.error("Gemini Error:", error);
    return { 
      respuesta_chat: "Ocurrió un error de conexión. ¿Podrías repetirme eso?", 
      datos_actualizados: null 
    };
  }
};