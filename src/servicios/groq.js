// src/servicios/groq.js

import Groq from "groq-sdk";
// Importamos tus herramientas de datos
import { validarUbicacion, getClima } from '../datos/clima';

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true 
});

// --- ESQUEMA STRICTO (Tu esquema original intacto) ---
const schemaRespuesta = {
  name: "respuesta_asistente_ventas",
  description: "Estructura de datos y respuesta verbal.",
  strict: true, 
  schema: {
    type: "object",
    properties: {
      respuesta_chat: {
        type: "string",
        description: "Tu respuesta verbal al cliente. DEBE SER RICA, EMPÁTICA Y EXPERTA. Usa emojis."
      },
      datos_actualizados: {
        type: "object",
        description: "Datos técnicos extraídos.",
        properties: {
          nombreCliente: { type: ["string", "null"] },
          Ciudad: { type: ["string", "null"] },
          Departamento: { type: ["string", "null"] },
          tipoCliente: {
            anyOf: [
              { type: "string", enum: ["Persona Natural", "Unidad Residencial", "Comercial"] },
              { type: "null" }
            ]
          },
          T_w: { type: ["number", "null"] },
          T_a: { type: ["number", "null"] },
          HR: { type: ["number", "null"] },
          Largo: { type: ["number", "null"] },
          Ancho: { type: ["number", "null"] },
          Profundidad: { type: ["number", "null"] },
          Volumen: { type: ["number", "null"] },
          usa_manta: { type: ["boolean", "null"] },
          accion: {
            anyOf: [
              { type: "string", enum: ["COTIZAR", "CONTINUAR"] },
              { type: "null" }
            ]
          },
          preferenciaCotizacion: {
            anyOf: [
              { type: "string", enum: ["VENTA", "RENTA", "AMBAS"] },
              { type: "null" }
            ]
          }
        },
        required: [
          "nombreCliente", "Ciudad", "Departamento", "tipoCliente", 
          "T_w", "T_a", "HR", "Largo", "Ancho", "Profundidad", 
          "Volumen", "usa_manta", "accion", "preferenciaCotizacion"
        ],
        additionalProperties: false
      }
    },
    required: ["respuesta_chat", "datos_actualizados"],
    additionalProperties: false
  }
};

export const enviarMensajeGroq = async (historial, contexto) => {
  const { datos, sistema } = contexto;

  // 1. PRE-CÁLCULO: Si ya tenemos ciudad en memoria, buscamos clima para darle contexto a la IA
  let climaContexto = "donde te encuentras";
  if (datos.Ciudad) {
      const info = getClima(datos.Departamento, datos.Ciudad);
      if (info.found || info.T_a) {
          climaContexto = `DETECTADO EN SISTEMA: ${info.T_a}°C / ${info.HR}% (Ya cargado en formulario)`;
      }
  }

  const systemPrompt = `
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
  
  --- GUION MAESTRO (Respeta el orden estrictamente) ---
  1. **SALUDO Y NOMBRE:** Si no lo tienes, pídelo.
  
  2. **UBICACIÓN:** Pide la Ciudad. 
     (Nota interna: Apenas el usuario diga la ciudad, yo la buscaré en la temperatura promedio y llenaré el clima automáticamente).
  
  3. **CLIMA (Temp y Humedad):** - Si acabas de recibir la ciudad (o ya la tienes), dile: "He cargado los datos climáticos de tu zona, en ${climaContexto}. Pero, para ser más preciso ¿De casualidad conoces la temperatura o humedad aproximada de tu sector?".
     - Si te dice "No", responde "Perfecto, usaré los datos satelitales" y sigue.
  
  4. **TIPO DE CLIENTE:**  Preguntale para quien es el servicio, si para una Casa, Conjunto, Hotel, Etc.
  
  5. **TEMPERATURA DESEADA:** Sugiere 28-30°C si es para una piscina y entre 36 a 39°C si para Jacuzzi
  
  6. **MEDIDAS:** Pide Volumen (m³) o medidas. Si no sabe, sugiere 50m³ si es piscina y 2m³ si es Jacuzzi.
  
  7. **MANTA TÉRMICA:** ¿Usan cubierta en la noche?
  
  8.  8. **CIERRE (El momento de la verdad):**
     - Pregunta: "¿Te gustaría ver la propuesta de COMPRA, RENTA o AMBAS?".
     - CUANDO ELIJA: Despídete confirmando y ACTIVA "accion": "COTIZAR".

  REGLA DE SALIDA: JSON estricto.

  ---INSTRUCCIÓN INNEGOCIABLE---
  Nunca des información que no sepas acerca de la empresa del servicio o equipos.
  Sé siempre calido y comportate como lo haría un Colombiano decente.

  --- CONTEXTO DE LA APP (TUS HERRAMIENTAS) ---
    - Arriba a la derecha el usuario tiene:
      ⚙️ ENGRANAJE: Para corregir datos manualmente si se equivoca.
      🗑️ PAPELERA: Para reiniciar el chat desde cero.
    - Úsalos como sugerencia si el usuario se nota bloqueado o quiere cambiar algo drástico.
  `;

  const mensajesAPI = [
    { role: "system", content: systemPrompt },
    ...historial.map(msg => ({
      role: msg.role === 'ia' ? 'assistant' : 'user',
      content: msg.texto
    }))
  ];

  try {
    const completion = await groq.chat.completions.create({
      messages: mensajesAPI,
      model: "openai/gpt-oss-120b", 
      temperature: 0.5,
      max_completion_tokens: 1200,
      top_p: 1,
      stream: false,
      response_format: {
        type: "json_schema",
        json_schema: schemaRespuesta
      }
    });

    const respuestaJSON = JSON.parse(completion.choices[0].message.content);
    let datosIA = respuestaJSON.datos_actualizados || {};

    // =================================================================================
    // EL TRUCO MAESTRO: INYECCIÓN DE DATOS REALES (POST-PROCESAMIENTO)
    // Aquí garantizamos que si la IA detectó la ciudad, el clima se guarde INMEDIATAMENTE
    // =================================================================================
    
    // 1. ¿Hay una ciudad nueva detectada por la IA o ya teníamos una?
    const ciudadParaBuscar = datosIA.Ciudad || datos.Ciudad;
    const deptoParaBuscar = datosIA.Departamento || datos.Departamento;

    if (ciudadParaBuscar) {
        // A. Validamos nombre oficial (quita tildes, mayúsculas, etc.)
        const ubiOficial = validarUbicacion(ciudadParaBuscar, deptoParaBuscar);
        
        // Si la IA escribió mal la ciudad, la corregimos en el vuelo
        if (ubiOficial.Ciudad) {
            datosIA.Ciudad = ubiOficial.Ciudad;
            datosIA.Departamento = ubiOficial.Departamento;

            // B. Buscamos el CLIMA en tu JSON local
            const climaReal = getClima(ubiOficial.Departamento, ubiOficial.Ciudad);

            // C. Si encontramos clima Y el usuario NO dio uno manual en este turno:
            // ¡LO FORZAMOS EN EL FORMULARIO AHORA MISMO!
            if (climaReal.T_a) {
                // Solo sobreescribimos si viene null o vacío, para no borrar un dato manual del usuario
                if (!datosIA.T_a && !datos.T_a) datosIA.T_a = climaReal.T_a;
                if (!datosIA.HR && !datos.HR) datosIA.HR = climaReal.HR;
            }
        }
    }

    // Devolvemos el JSON enriquecido. 
    // App.jsx recibirá { Ciudad: "Sopó", T_a: 14, HR: 82 } TODO EN UNO.
    return {
        respuesta_chat: respuestaJSON.respuesta_chat,
        datos_actualizados: datosIA
    };

  } catch (error) {
    console.error("Groq Error:", error);
    
    // Fallback de rescate
    const failedContent = error.error?.failed_generation;
    if (failedContent && !failedContent.trim().startsWith('{')) {
         return { respuesta_chat: failedContent, datos_actualizados: null };
    }

    return { 
      respuesta_chat: "Disculpa, para confirmar. ¿Me podrías repetir ese último dato? 🙏", 
      datos_actualizados: null 
    };
  }
};