// src/datos/clima.js
// Importamos el JSON directamente. Vite/React permite esto automáticamente.
import DATOS_CLIMA_RAW from './colombia_clima.json';

// Función para obtener la lista de departamentos
export const getDepartamentos = () => {
    // Mapeamos y ordenamos alfabéticamente
    return DATOS_CLIMA_RAW.map(d => d.departamento).sort();
};

// Función para obtener ciudades de un departamento específico
export const getCiudadesPorDepartamento = (nombreDepartamento) => {
    const dep = DATOS_CLIMA_RAW.find(d => d.departamento === nombreDepartamento);
    // Retornamos las ciudades ordenadas o un array vacío si no encuentra el departamento
    return dep ? dep.ciudades.sort() : [];
};

// Modificamos getClima para buscar en la estructura importada
export const getClima = (departamento, ciudad) => {
    // Valores por defecto si no encuentra nada o no se ha seleccionado
    const climaDefault = { T_a: 15, HR: 70 }; 

    if (!departamento || !ciudad) return climaDefault;

    // 1. Buscamos el departamento
    const depData = DATOS_CLIMA_RAW.find(d => d.departamento === departamento);
    if (!depData) return climaDefault;

    // 2. Buscamos la ciudad dentro de 'ciudades_data'
    const ciudadData = depData.ciudades_data.find(c => c.nombre === ciudad);
    if (!ciudadData) return climaDefault;

    // 3. Retornamos mapeando las variables a lo que espera la calculadora (T_a y HR)
    return {
        T_a: ciudadData.temperatura_promedio,
        HR: ciudadData.humedad_actual
    };
};

//Variable de sobre tasa de instalación (Factor de instalación) fiv

