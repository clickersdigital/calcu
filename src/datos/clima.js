// src/datos/clima.js

import DATOS_CLIMA_RAW from './colombia_clima.json';

// Helper privado para comparar texto relajado (sin tildes, minúsculas)
const normalizar = (txt) => {
  if (!txt) return "";
  return txt.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

export const getDepartamentos = () => {
  return DATOS_CLIMA_RAW.map(d => d.departamento).sort();
};

export const getCiudadesPorDepartamento = (nombreDepartamento) => {
  const dep = DATOS_CLIMA_RAW.find(d => normalizar(d.departamento) === normalizar(nombreDepartamento));
  return dep ? dep.ciudades.sort() : [];
};

export const getClima = (departamento, ciudad) => {
  const climaDefault = { T_a: 26, HR: 70 }; 
  
  if (!departamento || !ciudad) return climaDefault;

  const depData = DATOS_CLIMA_RAW.find(d => normalizar(d.departamento) === normalizar(departamento));
  if (!depData) return climaDefault;

  // Buscar en la data detallada si existe
  if (depData.ciudades_data) {
      const ciudadData = depData.ciudades_data.find(c => normalizar(c.nombre) === normalizar(ciudad));
      if (ciudadData) {
        return {
            T_a: ciudadData.temperatura_promedio,
            HR: ciudadData.humedad_actual
        };
      }
  }
  return climaDefault;
};

// --- NUEVA FUNCIÓN: EL SALVAVIDAS ---
// Recibe la basura de la IA y devuelve ORO (Datos oficiales del JSON)
export const validarUbicacion = (ciudadIA, deptoIA) => {
    // 1. Si no hay nada, no hacemos nada
    if (!ciudadIA && !deptoIA) return { Ciudad: '', Departamento: '' };

    let deptoEncontrado = null;
    let ciudadEncontrada = null;

    // A. Intentamos buscar la ciudad en TODO el JSON (Es lo más efectivo)
    // Esto arregla si la IA dice "Medellin" pero no envía departamento, o envía el depto mal.
    if (ciudadIA) {
        const busqueda = normalizar(ciudadIA);
        
        for (const dep of DATOS_CLIMA_RAW) {
            // Buscamos en el array simple de ciudades
            const matchSimple = dep.ciudades.find(c => normalizar(c) === busqueda);
            
            if (matchSimple) {
                deptoEncontrado = dep.departamento; // El nombre OFICIAL del depto
                ciudadEncontrada = matchSimple;     // El nombre OFICIAL de la ciudad
                break; // Ya lo encontramos, salimos
            }
        }
    }

    // B. Si no encontramos la ciudad globalmente, intentamos por el departamento que dio la IA
    if (!deptoEncontrado && deptoIA) {
        const depMatch = DATOS_CLIMA_RAW.find(d => normalizar(d.departamento) === normalizar(deptoIA));
        if (depMatch) {
            deptoEncontrado = depMatch.departamento;
        }
    }

    // Retornamos lo oficial si lo encontramos, o lo que dijo la IA si no (para que el usuario corrija)
    return {
        Ciudad: ciudadEncontrada || ciudadIA, 
        Departamento: deptoEncontrado || deptoIA 
    };
};