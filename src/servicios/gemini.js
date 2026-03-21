//servicios/gemini.js

import { GoogleGenAI } from "@google/genai";
import { validarUbicacion, getClima } from '../datos/clima';
import { CATALOGO } from '../datos/catalogo';

const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY 
});

// Esquema puro nativo de Gemini (OpenAPI 3.0 simplificado)
const geminiSchema = {
  type: "object",
  properties: {
    respuesta_chat: {
      type: "string",
      description: "Tu respuesta verbal al cliente. DEBE SER RICA, EMPÁTICA Y EXPERTA. Usa emojis. "
    },
    datos_actualizados: {
      type: "object",
      description: "Datos técnicos extraídos.",
      properties: {
        nombreCliente: { type: ["string", "null"] },
        Ciudad: { type: ["string", "null"] },
        Departamento: { type: ["string", "null"] },
        tipoCliente: { type: ["string", "null"], description: "Persona Natural, Unidad Residencial o Comercial" },
        T_w: { type: ["number", "null"] },
        T_a: { type: ["number", "null"] },
        HR: { type: ["number", "null"] },
        Largo: { type: ["number", "null"] },
        Ancho: { type: ["number", "null"] },
        Profundidad: { type: ["number", "null"] },
        Volumen: { type: ["number", "null"] },
        usa_manta: { type: ["boolean", "null"] },
        accion: { type: ["string", "null"], description: "COTIZAR o CONTINUAR" },
        preferenciaCotizacion: { type: ["string", "null"], description: "VENTA, RENTA o AMBAS" }
      },
      required: [
        "nombreCliente", "Ciudad", "Departamento", "tipoCliente", 
        "T_w", "T_a", "HR", "Largo", "Ancho", "Profundidad", 
        "Volumen", "usa_manta", "accion", "preferenciaCotizacion"
      ]
    }
  },
  required: ["respuesta_chat", "datos_actualizados"]
};

export const enviarMensajeGemini = async (historial, contexto) => {
  const { datos } = contexto;

  let climaContexto = "donde te encuentras";
  if (datos.Ciudad) {
      const info = getClima(datos.Departamento, datos.Ciudad);
      if (info.found || info.T_a) {
          climaContexto = `DETECTADO EN SISTEMA: ${info.T_a}°C / ${info.HR}% (Ya cargado en formulario)`;
      }
  }

  const contextoCatalogo = `
  - VENTA (Inverter): ${CATALOGO.INVERTER.map(eq => `${eq.sku} (${eq.btu} BTU)`).join(', ')}
  - RENTA (On/Off): ${CATALOGO.ON_OFF.map(eq => `${eq.sku} (${eq.btu} BTU)`).join(', ')}
  `;

  const systemPrompt = `
    --- REGLAS DE NEGOCIO INNEGOCIABLES --- Siempre que el usuario pregunte por ahorro de energia con mantas termicas, responde EXACTAMENTE: El ahorro estimado es de entre un 15% y 25%
  ERES: "Sol", Ingeniero Senior en Climatización de Más Centígrados S.A.S.
  UBICACIÓN: Tú Estás en un chat dentro de nuestra Web App mascentigrados.com

  --- TUS CUALIDADES ---
  1. 🧠 **Experto Técnico:** Sabes que usamos Bombas de Calor (Aerotermia). Temp ideal piscina o jacuzzi: 28-30°C.
  2. 🤝 **Empático:** Saludas por el nombre, usas emojis (🌊, ☀️), entiendes las dudas.
  3. ⚡ **Resolutivo:** Si falta un dato y el usuario no sabe, sugiere el estándar.
  4. Nunca respondes con más de 50 palabras. 
 
  --- ESTADO ACTUAL ---
  - Cliente: ${datos.nombreCliente || '...'}
  - Ubicación: ${datos.Ciudad || '...'}
  - Clima Base: ${climaContexto}
  - Profundidad: ${datos.Profundidad || '...'}
  
  --- GUION MAESTRO ---
  1. **SALUDO Y NOMBRE:** Si no lo tienes, pídelo.
  2. **UBICACIÓN:** Pide la Ciudad. 
  3. **CLIMA (Temp y Humedad):** Dile: "He cargado los datos climáticos de tu zona, en ${climaContexto}. ¿Conoces la temperatura o humedad aproximada de tu sector?". Si dice "No", usa los datos satelitales.
  4. **TIPO DE CLIENTE:** Pregunta si es para Casa, Conjunto, Hotel, etc.
  5. **TEMPERATURA DESEADA:** Sugiere 28-30°C si es piscina y 36-39°C si jacuzzi.
  6. **MEDIDAS:** Pide Volumen (m³) o medidas. 
  7. **MANTA TÉRMICA:** ¿Usan cubierta en la noche?
  8. **CIERRE:** Pregunta: "¿Te gustaría ver la propuesta de COMPRA, RENTA o AMBAS?". Al elegir, ACTIVA "accion": "COTIZAR".

  Nunca des información que no sepas de la empresa. Sé siempre cálido y compórtate como lo haría un Colombiano decente.
  Solo si te preguntan que cuanto se ahora con manta termica o cubriendo la piscina di que aporx. entre un 15 y 25 %

  Contexto Importante: Estás Haciendo una cotización para vender o rentar bombas de calefacción para Piscinas o Jacuzzis. No se venden más servicos ni productos diferentes a los equipos de calefacción
  Nunca mencionar a menos que te lo pregunten: dirección: Cl. 49 # 78A-52 Medellín, Laureles.
  Telefono o Celular: 317 713 84 53
  Pagina web: mascentigrados.com
  equipos en venta y renta: ${contextoCatalogo}
  `;

  const contents = historial
    .filter(msg => msg && msg.texto) 
    .map(msg => ({
      role: msg.role === 'ia' ? 'model' : 'user',
      parts: [{ text: String(msg.texto) }] 
    }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
        responseMimeType: "application/json",
        responseJsonSchema: geminiSchema,
      }
    });

    // Filtro para extraer el JSON puro y evadir alucinaciones de formato Markdown
    let rawText = response.text;
    if (rawText.includes('```')) {
      rawText = rawText.replace(/```json\n?|```\n?/g, '').trim();
    }

    const respuestaJSON = JSON.parse(rawText);
    let datosIA = respuestaJSON.datos_actualizados || {};

    // INYECCIÓN POST-PROCESAMIENTO
    const ciudadParaBuscar = datosIA.Ciudad || datos.Ciudad;
    const deptoParaBuscar = datosIA.Departamento || datos.Departamento;

    if (ciudadParaBuscar) {
        const ubiOficial = validarUbicacion(ciudadParaBuscar, deptoParaBuscar);
        
        if (ubiOficial.Ciudad) {
            datosIA.Ciudad = ubiOficial.Ciudad;
            datosIA.Departamento = ubiOficial.Departamento;

            const climaReal = getClima(ubiOficial.Departamento, ubiOficial.Ciudad);

            if (climaReal.T_a) {
                if (!datosIA.T_a && !datos.T_a) datosIA.T_a = climaReal.T_a;
                if (!datosIA.HR && !datos.HR) datosIA.HR = climaReal.HR;
            }
        }
    }

    return {
        respuesta_chat: respuestaJSON.respuesta_chat,
        datos_actualizados: datosIA
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return { 
      respuesta_chat: "Disculpa, para confirmar. ¿Me podrías repetir ese último dato? 🙏", 
      datos_actualizados: null 
    };
  }
};