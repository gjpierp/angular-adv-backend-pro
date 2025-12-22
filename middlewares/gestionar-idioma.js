/**
 * Middleware para gestionar el idioma solicitado desde el frontend
 * Lee el idioma de diferentes fuentes: header, query param o cookie
 */

const pool = require("../database/config");

/**
 * Extrae el código de idioma del request
 * Prioridad:
 * 1. Header 'Accept-Language' o 'X-Language'
 * 2. Query parameter 'lang' o 'idioma'
 * 3. Cookie 'idioma'
 * 4. Idioma por defecto: 'es'
 */
const extraerIdioma = (req) => {
  // Intentar desde headers
  let idioma = req.get("X-Language") || req.get("Accept-Language");

  // Si viene Accept-Language con formato 'es-CL,es;q=0.9,en;q=0.8'
  if (idioma && idioma.includes(",")) {
    idioma = idioma.split(",")[0].split("-")[0].toLowerCase();
  } else if (idioma) {
    idioma = idioma.split("-")[0].toLowerCase();
  }

  // Intentar desde query params
  if (!idioma) {
    idioma = req.query.lang || req.query.idioma;
  }

  // Intentar desde cookies
  if (!idioma && req.cookies) {
    idioma = req.cookies.idioma;
  }

  // Idioma por defecto
  return idioma || "es";
};

/**
 * Valida que el idioma existe en la base de datos
 */
const validarIdioma = async (codigoIdioma) => {
  try {
    const [rows] = await pool.query(
      "SELECT id_idioma, codigo_iso, nombre_nativo FROM idiomas WHERE codigo_iso = ? AND activo = TRUE",
      [codigoIdioma]
    );

    if (rows.length > 0) {
      return rows[0];
    }

    // Si no existe, retornar el idioma por defecto
    const [defaultLang] = await pool.query(
      "SELECT id_idioma, codigo_iso, nombre_nativo FROM idiomas WHERE por_defecto = TRUE LIMIT 1"
    );

    return (
      defaultLang[0] || {
        id_idioma: 1,
        codigo_iso: "es",
        nombre_nativo: "Español",
      }
    );
  } catch (error) {
    console.error("Error validando idioma:", error);
    return { id_idioma: 1, codigo_iso: "es", nombre_nativo: "Español" };
  }
};

/**
 * Middleware principal que captura y valida el idioma
 */
const capturarIdioma = async (req, res, next) => {
  try {
    // Extraer código de idioma del request
    const codigoIdioma = extraerIdioma(req);

    // Validar y obtener datos del idioma
    const idioma = await validarIdioma(codigoIdioma);

    // Agregar información de idioma al request
    req.idioma = {
      id: idioma.id_idioma,
      codigo: idioma.codigo_iso,
      nombre: idioma.nombre_nativo,
    };

    // Agregar función helper para obtener traducciones
    req.traducir = (clave) => {
      return obtenerMensajeTraducido(clave, idioma.codigo_iso);
    };

    next();
  } catch (error) {
    console.error("Error en middleware de idioma:", error);
    // Continuar con idioma por defecto en caso de error
    req.idioma = { id: 1, codigo: "es", nombre: "Español" };
    next();
  }
};

/**
 * Helper para obtener mensajes del sistema traducidos
 */
const obtenerMensajeTraducido = async (clave, codigoIdioma = "es") => {
  try {
    const [rows] = await pool.query(
      `SELECT fn_mensaje_traducido(?, ?) as mensaje`,
      [clave, codigoIdioma]
    );

    return rows[0]?.mensaje || clave;
  } catch (error) {
    console.error("Error obteniendo mensaje traducido:", error);
    return clave;
  }
};

/**
 * Helper para agregar traducciones a un objeto
 * Busca traducciones en las tablas específicas según la tabla de origen
 */
const agregarTraducciones = async (
  objeto,
  tablaOrigen,
  idCampo,
  idiomaCodigo
) => {
  try {
    // Determinar qué tabla de traducciones usar
    let consultaTraduccion = "";
    const idRegistro = objeto[idCampo];

    switch (tablaOrigen) {
      case "paises":
        consultaTraduccion = `
                    SELECT nombre_pais, nombre_oficial, capital, gentilicio
                    FROM traducciones_paises
                    WHERE id_pais = ? AND id_idioma = (
                        SELECT id_idioma FROM idiomas WHERE codigo_iso = ? AND activo = TRUE LIMIT 1
                    )
                `;
        break;

      case "continentes":
        consultaTraduccion = `
                    SELECT nombre_continente
                    FROM traducciones_continentes
                    WHERE id_continente = ? AND id_idioma = (
                        SELECT id_idioma FROM idiomas WHERE codigo_iso = ? AND activo = TRUE LIMIT 1
                    )
                `;
        break;

      case "divisiones_administrativas":
        consultaTraduccion = `
                    SELECT nombre_division, descripcion
                    FROM traducciones_divisiones
                    WHERE id_division = ? AND id_idioma = (
                        SELECT id_idioma FROM idiomas WHERE codigo_iso = ? AND activo = TRUE LIMIT 1
                    )
                `;
        break;

      case "roles":
        consultaTraduccion = `
                    SELECT descripcion
                    FROM traducciones_roles
                    WHERE id_rol = ? AND id_idioma = (
                        SELECT id_idioma FROM idiomas WHERE codigo_iso = ? AND activo = TRUE LIMIT 1
                    )
                `;
        break;

      case "permisos":
        consultaTraduccion = `
                    SELECT descripcion
                    FROM traducciones_permisos
                    WHERE id_permiso = ? AND id_idioma = (
                        SELECT id_idioma FROM idiomas WHERE codigo_iso = ? AND activo = TRUE LIMIT 1
                    )
                `;
        break;

      case "menus":
        consultaTraduccion = `
                    SELECT nombre, descripcion
                    FROM traducciones_menus
                    WHERE id_menu = ? AND id_idioma = (
                        SELECT id_idioma FROM idiomas WHERE codigo_iso = ? AND activo = TRUE LIMIT 1
                    )
                `;
        break;

      default:
        // Para tablas no específicas, usar la tabla genérica
        consultaTraduccion = `
                    SELECT campo, valor_traducido
                    FROM traducciones
                    WHERE tabla_origen = ? AND id_registro = ? AND id_idioma = (
                        SELECT id_idioma FROM idiomas WHERE codigo_iso = ? AND activo = TRUE LIMIT 1
                    )
                `;
    }

    if (consultaTraduccion) {
      const parametros =
        tablaOrigen === "traducciones"
          ? [tablaOrigen, idRegistro, idiomaCodigo]
          : [idRegistro, idiomaCodigo];

      const [traducciones] = await pool.query(consultaTraduccion, parametros);

      if (traducciones.length > 0) {
        // Agregar traducciones al objeto
        if (tablaOrigen === "traducciones") {
          // Traducciones genéricas
          traducciones.forEach((trad) => {
            objeto[trad.campo] = trad.valor_traducido;
          });
        } else {
          // Traducciones específicas
          Object.keys(traducciones[0]).forEach((campo) => {
            if (traducciones[0][campo] !== null) {
              objeto[campo] = traducciones[0][campo];
            }
          });
        }
      }
    }

    return objeto;
  } catch (error) {
    console.error("Error agregando traducciones:", error);
    return objeto; // Retornar objeto original en caso de error
  }
};

/**
 * Helper para traducir un array de objetos
 */
const traducirArray = async (array, tablaOrigen, idCampo, idiomaCodigo) => {
  try {
    const promesas = array.map((objeto) =>
      agregarTraducciones(objeto, tablaOrigen, idCampo, idiomaCodigo)
    );

    return await Promise.all(promesas);
  } catch (error) {
    console.error("Error traduciendo array:", error);
    return array;
  }
};

/**
 * Middleware para aplicar traducciones automáticamente a las respuestas
 * Uso: router.get('/paises', validarCampos, aplicarTraduccionesRespuesta('paises', 'id_pais'), obtenerPaises);
 */
const aplicarTraduccionesRespuesta = (tablaOrigen, idCampo) => {
  return async (req, res, next) => {
    // Guardar el método json original
    const jsonOriginal = res.json.bind(res);

    // Sobrescribir el método json
    res.json = async function (data) {
      try {
        // Solo traducir si hay idioma diferente al español
        if (req.idioma && req.idioma.codigo !== "es" && data) {
          // Si data tiene una propiedad 'data' (respuesta paginada)
          if (data.data && Array.isArray(data.data)) {
            data.data = await traducirArray(
              data.data,
              tablaOrigen,
              idCampo,
              req.idioma.codigo
            );
          }
          // Si data es un array directamente
          else if (Array.isArray(data)) {
            data = await traducirArray(
              data,
              tablaOrigen,
              idCampo,
              req.idioma.codigo
            );
          }
          // Si data es un objeto individual
          else if (typeof data === "object" && data[idCampo]) {
            data = await agregarTraducciones(
              data,
              tablaOrigen,
              idCampo,
              req.idioma.codigo
            );
          }
        }

        // Llamar al json original con los datos traducidos
        return jsonOriginal(data);
      } catch (error) {
        console.error("Error aplicando traducciones a respuesta:", error);
        // En caso de error, retornar datos sin traducir
        return jsonOriginal(data);
      }
    };

    next();
  };
};

module.exports = {
  capturarIdioma,
  extraerIdioma,
  validarIdioma,
  obtenerMensajeTraducido,
  agregarTraducciones,
  traducirArray,
  aplicarTraduccionesRespuesta,
};
