//datos/clima.js

export let DATOS_CLIMA_RAW = [];

export const initClima = (data) => {
  if (!data) return;
  DATOS_CLIMA_RAW = data;
};

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
  if (depData.ciudades_data) {
      const ciudadData = depData.ciudades_data.find(c => normalizar(c.nombre) === normalizar(ciudad));
      if (ciudadData) {
        return { T_a: ciudadData.temperatura_promedio, HR: ciudadData.humedad_actual };
      }
  }
  return climaDefault;
};

export const validarUbicacion = (ciudadIA, deptoIA) => {
    if (!ciudadIA && !deptoIA) return { Ciudad: '', Departamento: '' };
    let deptoEncontrado = null;
    let ciudadEncontrada = null;

    if (ciudadIA) {
        const busqueda = normalizar(ciudadIA);
        for (const dep of DATOS_CLIMA_RAW) {
            const matchSimple = dep.ciudades.find(c => normalizar(c) === busqueda);
            if (matchSimple) {
                deptoEncontrado = dep.departamento; 
                ciudadEncontrada = matchSimple;    
                break; 
            }
        }
    }

    if (!deptoEncontrado && deptoIA) {
        const depMatch = DATOS_CLIMA_RAW.find(d => normalizar(d.departamento) === normalizar(deptoIA));
        if (depMatch) deptoEncontrado = depMatch.departamento;
    }

    return { Ciudad: ciudadEncontrada || ciudadIA, Departamento: deptoEncontrado || deptoIA };
};