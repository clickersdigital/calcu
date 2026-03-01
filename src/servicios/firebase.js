import { initConstantes } from '../datos/constantes';
import { initTarifas } from '../datos/tarifas';
import { initCatalogo } from '../datos/catalogo';
import { initClima } from '../datos/clima';

export const cargarEcosistema = async () => {
  const db = "https://aplicaciones-pro-default-rtdb.firebaseio.com/calcu";
  
  try {
    const [resConstantes, resTarifas, resCatalogo, resClima, resDefault] = await Promise.all([
      fetch(`${db}/constantes.json`),
      fetch(`${db}/tarifas.json`),
      fetch(`${db}/catalogo.json`),
      fetch(`${db}/colombia_clima.json`),
      fetch(`${db}/default.json`)
    ]);

    const [constantes, tarifas, catalogo, clima, defaults] = await Promise.all([
      resConstantes.json(), resTarifas.json(), resCatalogo.json(), resClima.json(), resDefault.json()
    ]);

    // Hidratación en RAM de los módulos
    initConstantes(constantes, defaults);
    initTarifas(tarifas);
    initCatalogo(catalogo);
    initClima(clima);

    return defaults;
  } catch (error) {
    console.error("Falla crítica en Firebase. Se requiere fallback local.", error);
    throw error;
  }
};