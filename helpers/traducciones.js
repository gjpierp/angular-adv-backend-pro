/**
 * Helpers para manejo de traducciones en toda la aplicación
 */

const pool = require("../database/config");

/**
 * Obtiene un país con sus traducciones
 * @param {number} idPais - ID del país
 * @param {string} idioma - Código ISO del idioma (es, en, pt, fr)
 * @returns {Object} País con datos traducidos
 */
const obtenerPaisTraducido = async (idPais, idioma = "es") => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM v_paises_traducidos 
             WHERE id_pais = ? AND idioma = ?`,
      [idPais, idioma]
    );

    return rows[0] || null;
  } catch (error) {
    console.error("Error obteniendo país traducido:", error);
    throw error;
  }
};

/**
 * Obtiene todos los países traducidos
 * @param {string} idioma - Código ISO del idioma
 * @param {Object} filtros - Filtros opcionales (continente, activo)
 * @returns {Array} Lista de países traducidos
 */
const obtenerPaisesTraducidos = async (idioma = "es", filtros = {}) => {
  try {
    let consulta = "SELECT * FROM v_paises_traducidos WHERE idioma = ?";
    const parametros = [idioma];

    if (filtros.continente) {
      consulta += " AND id_continente = ?";
      parametros.push(filtros.continente);
    }

    if (filtros.activo !== undefined) {
      consulta += " AND activo = ?";
      parametros.push(filtros.activo);
    }

    consulta += " ORDER BY nombre_traducido";

    const [rows] = await pool.query(consulta, parametros);
    return rows;
  } catch (error) {
    console.error("Error obteniendo países traducidos:", error);
    throw error;
  }
};

/**
 * Obtiene divisiones administrativas traducidas
 * @param {string} idioma - Código ISO del idioma
 * @param {Object} filtros - Filtros (pais, nivel, padre)
 * @returns {Array} Lista de divisiones traducidas
 */
const obtenerDivisionesTraducidas = async (idioma = "es", filtros = {}) => {
  try {
    let consulta = "SELECT * FROM v_divisiones_traducidas WHERE idioma = ?";
    const parametros = [idioma];

    if (filtros.pais) {
      consulta += " AND id_pais = ?";
      parametros.push(filtros.pais);
    }

    if (filtros.nivel) {
      consulta += " AND nivel = ?";
      parametros.push(filtros.nivel);
    }

    if (filtros.padre) {
      consulta += " AND id_division_padre = ?";
      parametros.push(filtros.padre);
    }

    if (filtros.activo !== undefined) {
      consulta += " AND activo = ?";
      parametros.push(filtros.activo);
    }

    consulta += " ORDER BY nombre_traducido";

    const [rows] = await pool.query(consulta, parametros);
    return rows;
  } catch (error) {
    console.error("Error obteniendo divisiones traducidas:", error);
    throw error;
  }
};

/**
 * Obtiene continentes traducidos
 * @param {string} idioma - Código ISO del idioma
 * @returns {Array} Lista de continentes traducidos
 */
const obtenerContinentesTraducidos = async (idioma = "es") => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM v_continentes_traducidos WHERE idioma = ? ORDER BY nombre_traducido",
      [idioma]
    );

    return rows;
  } catch (error) {
    console.error("Error obteniendo continentes traducidos:", error);
    throw error;
  }
};

/**
 * Busca divisiones con traducciones (para autocomplete)
 * @param {string} termino - Término de búsqueda
 * @param {string} idioma - Código ISO del idioma
 * @param {number} limite - Límite de resultados
 * @returns {Array} Lista de divisiones que coinciden
 */
const buscarDivisionesTraducidas = async (
  termino,
  idioma = "es",
  limite = 20
) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM v_divisiones_traducidas 
             WHERE idioma = ? 
             AND nombre_traducido LIKE ? 
             AND activo = TRUE
             ORDER BY nombre_traducido
             LIMIT ?`,
      [idioma, `%${termino}%`, limite]
    );

    return rows;
  } catch (error) {
    console.error("Error buscando divisiones traducidas:", error);
    throw error;
  }
};

/**
 * Guarda o actualiza una traducción
 * @param {Object} datos - { tabla, idRegistro, campo, valor, idioma }
 * @returns {Object} Resultado de la operación
 */
const guardarTraduccion = async ({
  tabla,
  idRegistro,
  campo,
  valor,
  idioma,
}) => {
  try {
    // Obtener ID del idioma
    const [idiomaRows] = await pool.query(
      "SELECT id_idioma FROM idiomas WHERE codigo_iso = ? AND activo = TRUE",
      [idioma]
    );

    if (idiomaRows.length === 0) {
      throw new Error(`Idioma ${idioma} no encontrado o inactivo`);
    }

    const idIdioma = idiomaRows[0].id_idioma;

    // Insertar o actualizar traducción
    const [resultado] = await pool.query(
      `INSERT INTO traducciones (id_idioma, tabla_origen, id_registro, campo, valor_traducido)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE valor_traducido = VALUES(valor_traducido)`,
      [idIdioma, tabla, idRegistro, campo, valor]
    );

    return {
      ok: true,
      mensaje: "Traducción guardada exitosamente",
      id: resultado.insertId || null,
    };
  } catch (error) {
    console.error("Error guardando traducción:", error);
    throw error;
  }
};

/**
 * Guarda traducción específica para países
 * @param {Object} datos - { idPais, idioma, nombrePais, nombreOficial, capital, gentilicio }
 * @returns {Object} Resultado de la operación
 */
const guardarTraduccionPais = async ({
  idPais,
  idioma,
  nombrePais,
  nombreOficial,
  capital,
  gentilicio,
}) => {
  try {
    const [idiomaRows] = await pool.query(
      "SELECT id_idioma FROM idiomas WHERE codigo_iso = ? AND activo = TRUE",
      [idioma]
    );

    if (idiomaRows.length === 0) {
      throw new Error(`Idioma ${idioma} no encontrado`);
    }

    const idIdioma = idiomaRows[0].id_idioma;

    const [resultado] = await pool.query(
      `INSERT INTO traducciones_paises (id_pais, id_idioma, nombre_pais, nombre_oficial, capital, gentilicio)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                nombre_pais = VALUES(nombre_pais),
                nombre_oficial = VALUES(nombre_oficial),
                capital = VALUES(capital),
                gentilicio = VALUES(gentilicio)`,
      [idPais, idIdioma, nombrePais, nombreOficial, capital, gentilicio]
    );

    return {
      ok: true,
      mensaje: "Traducción de país guardada exitosamente",
      id: resultado.insertId || null,
    };
  } catch (error) {
    console.error("Error guardando traducción de país:", error);
    throw error;
  }
};

/**
 * Guarda traducción específica para divisiones
 * @param {Object} datos - { idDivision, idioma, nombreDivision, descripcion }
 * @returns {Object} Resultado de la operación
 */
const guardarTraduccionDivision = async ({
  idDivision,
  idioma,
  nombreDivision,
  descripcion,
}) => {
  try {
    const [idiomaRows] = await pool.query(
      "SELECT id_idioma FROM idiomas WHERE codigo_iso = ? AND activo = TRUE",
      [idioma]
    );

    if (idiomaRows.length === 0) {
      throw new Error(`Idioma ${idioma} no encontrado`);
    }

    const idIdioma = idiomaRows[0].id_idioma;

    const [resultado] = await pool.query(
      `INSERT INTO traducciones_divisiones (id_division, id_idioma, nombre_division, descripcion)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                nombre_division = VALUES(nombre_division),
                descripcion = VALUES(descripcion)`,
      [idDivision, idIdioma, nombreDivision, descripcion]
    );

    return {
      ok: true,
      mensaje: "Traducción de división guardada exitosamente",
      id: resultado.insertId || null,
    };
  } catch (error) {
    console.error("Error guardando traducción de división:", error);
    throw error;
  }
};

/**
 * Obtiene todos los idiomas disponibles
 * @param {boolean} soloActivos - Si es true, solo retorna idiomas activos
 * @returns {Array} Lista de idiomas
 */
const obtenerIdiomasDisponibles = async (soloActivos = true) => {
  try {
    let consulta = "SELECT * FROM idiomas";

    if (soloActivos) {
      consulta += " WHERE activo = TRUE";
    }

    consulta += " ORDER BY orden, nombre_nativo";

    const [rows] = await pool.query(consulta);
    return rows;
  } catch (error) {
    console.error("Error obteniendo idiomas disponibles:", error);
    throw error;
  }
};

/**
 * Obtiene el idioma por defecto del sistema
 * @returns {Object} Idioma por defecto
 */
const obtenerIdiomaDefecto = async () => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM idiomas WHERE por_defecto = TRUE LIMIT 1"
    );

    return (
      rows[0] || { id_idioma: 1, codigo_iso: "es", nombre_nativo: "Español" }
    );
  } catch (error) {
    console.error("Error obteniendo idioma por defecto:", error);
    return { id_idioma: 1, codigo_iso: "es", nombre_nativo: "Español" };
  }
};

/**
 * Obtiene un mensaje del sistema traducido
 * @param {string} clave - Clave del mensaje (error.not_found, success.created)
 * @param {string} idioma - Código ISO del idioma
 * @returns {string} Mensaje traducido
 */
const obtenerMensaje = async (clave, idioma = "es") => {
  try {
    const [rows] = await pool.query(
      `SELECT fn_mensaje_traducido(?, ?) as mensaje`,
      [clave, idioma]
    );

    return rows[0]?.mensaje || clave;
  } catch (error) {
    console.error("Error obteniendo mensaje:", error);
    return clave;
  }
};

/**
 * Verifica si existen traducciones para un registro
 * @param {string} tabla - Nombre de la tabla
 * @param {number} idRegistro - ID del registro
 * @param {string} idioma - Código ISO del idioma
 * @returns {boolean} True si existen traducciones
 */
const existenTraducciones = async (tabla, idRegistro, idioma) => {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as total 
             FROM traducciones 
             WHERE tabla_origen = ? 
             AND id_registro = ? 
             AND id_idioma = (SELECT id_idioma FROM idiomas WHERE codigo_iso = ?)`,
      [tabla, idRegistro, idioma]
    );

    return rows[0].total > 0;
  } catch (error) {
    console.error("Error verificando traducciones:", error);
    return false;
  }
};

/**
 * Elimina todas las traducciones de un registro
 * @param {string} tabla - Nombre de la tabla
 * @param {number} idRegistro - ID del registro
 * @returns {Object} Resultado de la operación
 */
const eliminarTraducciones = async (tabla, idRegistro) => {
  try {
    const [resultado] = await pool.query(
      "DELETE FROM traducciones WHERE tabla_origen = ? AND id_registro = ?",
      [tabla, idRegistro]
    );

    return {
      ok: true,
      mensaje: "Traducciones eliminadas exitosamente",
      eliminados: resultado.affectedRows,
    };
  } catch (error) {
    console.error("Error eliminando traducciones:", error);
    throw error;
  }
};

module.exports = {
  obtenerPaisTraducido,
  obtenerPaisesTraducidos,
  obtenerDivisionesTraducidas,
  obtenerContinentesTraducidos,
  buscarDivisionesTraducidas,
  guardarTraduccion,
  guardarTraduccionPais,
  guardarTraduccionDivision,
  obtenerIdiomasDisponibles,
  obtenerIdiomaDefecto,
  obtenerMensaje,
  existenTraducciones,
  eliminarTraducciones,
};
