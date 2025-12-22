const { response } = require("express");
const Traduccion = require("../models/traduccion");

/**
 * Obtener todos los idiomas disponibles
 */
const obtenerIdiomas = async (req, res = response) => {
  try {
    const idiomas = await Traduccion.obtenerIdiomas();

    res.json({
      ok: true,
      idiomas,
      total: idiomas.length,
    });
  } catch (error) {
    console.error("Error obteniendo idiomas:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener idiomas",
    });
  }
};

/**
 * Obtener idioma por código ISO
 */
const obtenerIdiomaPorCodigo = async (req, res = response) => {
  const { codigo } = req.params;

  try {
    const idioma = await Traduccion.obtenerIdiomaPorCodigo(codigo);

    if (!idioma) {
      return res.status(404).json({
        ok: false,
        msg: `No se encontró el idioma con código: ${codigo}`,
      });
    }

    res.json({
      ok: true,
      idioma,
    });
  } catch (error) {
    console.error("Error obteniendo idioma:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener idioma",
    });
  }
};

/**
 * Obtener mensajes del sistema traducidos
 */
const obtenerMensajes = async (req, res = response) => {
  const idioma = req.query.idioma || req.idioma?.codigo || "es";

  try {
    const mensajes = await Traduccion.obtenerMensajes(idioma);

    // Convertir array a objeto para facilitar uso
    const mensajesObj = {};
    mensajes.forEach((mensaje) => {
      mensajesObj[mensaje.clave] = mensaje.texto;
    });

    res.json({
      ok: true,
      idioma,
      mensajes: mensajesObj,
      mensajesArray: mensajes,
      total: mensajes.length,
    });
  } catch (error) {
    console.error("Error obteniendo mensajes:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener mensajes traducidos",
    });
  }
};

/**
 * Obtener países traducidos
 */
const obtenerPaisesTraducidos = async (req, res = response) => {
  const idioma = req.query.idioma || req.idioma?.codigo || "es";
  const { id_continente } = req.query;

  try {
    const filtros = {};
    if (id_continente) filtros.id_continente = id_continente;

    const paises = await Traduccion.obtenerPaisesTraducidos(idioma, filtros);

    res.json({
      ok: true,
      idioma,
      paises,
      total: paises.length,
    });
  } catch (error) {
    console.error("Error obteniendo países traducidos:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener países traducidos",
    });
  }
};

/**
 * Obtener divisiones administrativas traducidas
 */
const obtenerDivisionesTraducidas = async (req, res = response) => {
  const idioma = req.query.idioma || req.idioma?.codigo || "es";
  const { id_pais, nivel, id_division_padre } = req.query;

  try {
    const filtros = {};
    if (id_pais) filtros.id_pais = id_pais;
    if (nivel) filtros.nivel = nivel;
    if (id_division_padre) filtros.id_division_padre = id_division_padre;

    const divisiones = await Traduccion.obtenerDivisionesTraducidas(
      idioma,
      filtros
    );

    res.json({
      ok: true,
      idioma,
      divisiones,
      total: divisiones.length,
    });
  } catch (error) {
    console.error("Error obteniendo divisiones traducidas:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener divisiones traducidas",
    });
  }
};

/**
 * Obtener continentes traducidos
 */
const obtenerContinentesTraducidos = async (req, res = response) => {
  const idioma = req.query.idioma || req.idioma?.codigo || "es";

  try {
    const continentes = await Traduccion.obtenerContinentesTraducidos(idioma);

    res.json({
      ok: true,
      idioma,
      continentes,
      total: continentes.length,
    });
  } catch (error) {
    console.error("Error obteniendo continentes traducidos:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener continentes traducidos",
    });
  }
};

/**
 * Obtener roles traducidos
 */
const obtenerRolesTraducidos = async (req, res = response) => {
  const idioma = req.query.idioma || req.idioma?.codigo || "es";

  try {
    const roles = await Traduccion.obtenerRolesTraducidos(idioma);

    res.json({
      ok: true,
      idioma,
      roles,
      total: roles.length,
    });
  } catch (error) {
    console.error("Error obteniendo roles traducidos:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener roles traducidos",
    });
  }
};

/**
 * Obtener permisos traducidos
 */
const obtenerPermisosTraducidos = async (req, res = response) => {
  const idioma = req.query.idioma || req.idioma?.codigo || "es";

  try {
    const permisos = await Traduccion.obtenerPermisosTraducidos(idioma);

    res.json({
      ok: true,
      idioma,
      permisos,
      total: permisos.length,
    });
  } catch (error) {
    console.error("Error obteniendo permisos traducidos:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener permisos traducidos",
    });
  }
};

/**
 * Obtener menús traducidos
 */
const obtenerMenusTraducidos = async (req, res = response) => {
  const idioma = req.query.idioma || req.idioma?.codigo || "es";

  try {
    const menus = await Traduccion.obtenerMenusTraducidos(idioma);

    res.json({
      ok: true,
      idioma,
      menus,
      total: menus.length,
    });
  } catch (error) {
    console.error("Error obteniendo menús traducidos:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener menús traducidos",
    });
  }
};

/**
 * Guardar traducción de país
 */
const guardarTraduccionPais = async (req, res = response) => {
  const { id } = req.params;
  const { idioma, nombre_pais, nombre_oficial, capital, gentilicio } = req.body;

  try {
    // Obtener ID del idioma
    const idiomaData = await Traduccion.obtenerIdiomaPorCodigo(idioma);
    if (!idiomaData) {
      return res.status(400).json({
        ok: false,
        msg: `El idioma '${idioma}' no es válido`,
      });
    }

    await Traduccion.guardarTraduccionPais(
      id,
      idiomaData.id_idioma,
      nombre_pais,
      nombre_oficial,
      capital,
      gentilicio
    );

    res.json({
      ok: true,
      msg: "Traducción de país guardada exitosamente",
    });
  } catch (error) {
    console.error("Error guardando traducción de país:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al guardar traducción de país",
    });
  }
};

/**
 * Guardar traducción de división administrativa
 */
const guardarTraduccionDivision = async (req, res = response) => {
  const { id } = req.params;
  const { idioma, nombre_division, descripcion } = req.body;

  try {
    // Obtener ID del idioma
    const idiomaData = await Traduccion.obtenerIdiomaPorCodigo(idioma);
    if (!idiomaData) {
      return res.status(400).json({
        ok: false,
        msg: `El idioma '${idioma}' no es válido`,
      });
    }

    await Traduccion.guardarTraduccionDivision(
      id,
      idiomaData.id_idioma,
      nombre_division,
      descripcion
    );

    res.json({
      ok: true,
      msg: "Traducción de división guardada exitosamente",
    });
  } catch (error) {
    console.error("Error guardando traducción de división:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al guardar traducción de división",
    });
  }
};

/**
 * Guardar traducción de rol
 */
const guardarTraduccionRol = async (req, res = response) => {
  const { id } = req.params;
  const { idioma, descripcion } = req.body;

  try {
    // Obtener ID del idioma
    const idiomaData = await Traduccion.obtenerIdiomaPorCodigo(idioma);
    if (!idiomaData) {
      return res.status(400).json({
        ok: false,
        msg: `El idioma '${idioma}' no es válido`,
      });
    }

    await Traduccion.guardarTraduccionRol(
      id,
      idiomaData.id_idioma,
      descripcion
    );

    res.json({
      ok: true,
      msg: "Traducción de rol guardada exitosamente",
    });
  } catch (error) {
    console.error("Error guardando traducción de rol:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al guardar traducción de rol",
    });
  }
};

/**
 * Guardar traducción de permiso
 */
const guardarTraduccionPermiso = async (req, res = response) => {
  const { id } = req.params;
  const { idioma, descripcion } = req.body;

  try {
    // Obtener ID del idioma
    const idiomaData = await Traduccion.obtenerIdiomaPorCodigo(idioma);
    if (!idiomaData) {
      return res.status(400).json({
        ok: false,
        msg: `El idioma '${idioma}' no es válido`,
      });
    }

    await Traduccion.guardarTraduccionPermiso(
      id,
      idiomaData.id_idioma,
      descripcion
    );

    res.json({
      ok: true,
      msg: "Traducción de permiso guardada exitosamente",
    });
  } catch (error) {
    console.error("Error guardando traducción de permiso:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al guardar traducción de permiso",
    });
  }
};

/**
 * Guardar traducción de menú
 */
const guardarTraduccionMenu = async (req, res = response) => {
  const { id } = req.params;
  const { idioma, nombre, descripcion } = req.body;

  try {
    // Obtener ID del idioma
    const idiomaData = await Traduccion.obtenerIdiomaPorCodigo(idioma);
    if (!idiomaData) {
      return res.status(400).json({
        ok: false,
        msg: `El idioma '${idioma}' no es válido`,
      });
    }

    await Traduccion.guardarTraduccionMenu(
      id,
      idiomaData.id_idioma,
      nombre,
      descripcion
    );

    res.json({
      ok: true,
      msg: "Traducción de menú guardada exitosamente",
    });
  } catch (error) {
    console.error("Error guardando traducción de menú:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al guardar traducción de menú",
    });
  }
};

/**
 * Eliminar traducción
 */
const eliminarTraduccion = async (req, res = response) => {
  const { tabla, id, idioma } = req.params;

  try {
    const result = await Traduccion.eliminarTraduccion(tabla, id, idioma);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        msg: "No se encontró la traducción para eliminar",
      });
    }

    res.json({
      ok: true,
      msg: "Traducción eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error eliminando traducción:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al eliminar traducción",
    });
  }
};

/**
 * Obtener todas las traducciones de un registro
 */
const obtenerTraduccionesRegistro = async (req, res = response) => {
  const { tabla, id } = req.params;

  try {
    const traducciones = await Traduccion.obtenerTraduccionesRegistro(
      tabla,
      id
    );

    res.json({
      ok: true,
      tabla,
      id_registro: id,
      traducciones,
      total: traducciones.length,
    });
  } catch (error) {
    console.error("Error obteniendo traducciones del registro:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener traducciones del registro",
    });
  }
};

module.exports = {
  obtenerIdiomas,
  obtenerIdiomaPorCodigo,
  obtenerMensajes,
  obtenerPaisesTraducidos,
  obtenerDivisionesTraducidas,
  obtenerContinentesTraducidos,
  obtenerRolesTraducidos,
  obtenerPermisosTraducidos,
  obtenerMenusTraducidos,
  guardarTraduccionPais,
  guardarTraduccionDivision,
  guardarTraduccionRol,
  guardarTraduccionPermiso,
  guardarTraduccionMenu,
  eliminarTraduccion,
  obtenerTraduccionesRegistro,
};
