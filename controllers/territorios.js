const { response } = require("express");
const Continente = require("../models/continente");
const Pais = require("../models/pais");
const DivisionAdministrativa = require("../models/division-administrativa");
const {
  obtenerMensaje: obtenerMensajeTraduccido,
} = require("../helpers/traducciones");

// =====================================================
// CONTINENTES
// =====================================================

const obtenerContinentes = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  try {
    const continentes = await Continente.obtenerTodos();
    res.json({
      ok: true,
      continentes,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "CONTINENT_GET_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener continentes",
    });
  }
};

const obtenerContinente = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  const { id } = req.params;
  try {
    const continente = await Continente.obtenerPorId(id);
    if (!continente) {
      const msgError = await obtenerMensajeTraduccido(
        "CONTINENT_NOT_FOUND",
        idioma
      );
      return res.status(404).json({
        ok: false,
        msg: msgError || "Continente no encontrado",
      });
    }
    const paises = await Continente.obtenerPaisesDelContinente(id);
    res.json({
      ok: true,
      continente,
      paises,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "CONTINENT_GET_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener continente",
    });
  }
};

// =====================================================
// PAÍSES
// =====================================================

const obtenerPaises = async (req, res = response) => {
  const { activo, continente } = req.query;
  try {
    let paises;

    if (continente) {
      paises = await Pais.obtenerPorContinente(continente);
    } else {
      paises = await Pais.obtenerTodos(
        activo !== undefined ? activo === "true" : null
      );
    }

    res.json({
      ok: true,
      paises,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener países",
    });
  }
};

const obtenerPais = async (req, res = response) => {
  const { id } = req.params;
  try {
    const pais = await Pais.obtenerPorId(id);
    if (!pais) {
      return res.status(404).json({
        ok: false,
        msg: "País no encontrado",
      });
    }

    res.json({
      ok: true,
      pais,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener país",
    });
  }
};

const obtenerPaisPorCodigo = async (req, res = response) => {
  const { codigo } = req.params;
  try {
    const pais = await Pais.obtenerPorCodigo(codigo.toUpperCase());
    if (!pais) {
      return res.status(404).json({
        ok: false,
        msg: "País no encontrado",
      });
    }

    res.json({
      ok: true,
      pais,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener país",
    });
  }
};

const obtenerEstructuraPais = async (req, res = response) => {
  const { id } = req.params;
  try {
    const pais = await Pais.obtenerPorId(id);
    if (!pais) {
      return res.status(404).json({
        ok: false,
        msg: "País no encontrado",
      });
    }

    const tiposDivision = await Pais.obtenerTiposDivision(id);
    const divisiones = await Pais.obtenerDivisiones(id);

    res.json({
      ok: true,
      pais,
      tiposDivision,
      divisiones,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener estructura del país",
    });
  }
};

const crearPais = async (req, res = response) => {
  try {
    const result = await Pais.crear(req.body);
    res.status(201).json({
      ok: true,
      msg: "País creado exitosamente",
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al crear país",
    });
  }
};

const actualizarPais = async (req, res = response) => {
  const { id } = req.params;
  try {
    const pais = await Pais.obtenerPorId(id);
    if (!pais) {
      return res.status(404).json({
        ok: false,
        msg: "País no encontrado",
      });
    }

    await Pais.actualizar(id, req.body);
    res.json({
      ok: true,
      msg: "País actualizado exitosamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al actualizar país",
    });
  }
};

// =====================================================
// DIVISIONES ADMINISTRATIVAS
// =====================================================

const obtenerDivisiones = async (req, res = response) => {
  const { pais, nivel, padre, activo } = req.query;

  try {
    const filtros = {};

    if (pais) filtros.id_pais = pais;
    if (nivel) filtros.nivel = nivel;
    if (padre !== undefined) {
      filtros.id_division_padre = padre === "null" ? null : padre;
    }
    if (activo !== undefined) filtros.activo = activo === "true";

    const divisiones = await DivisionAdministrativa.obtenerTodos(filtros);

    res.json({
      ok: true,
      divisiones,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener divisiones",
    });
  }
};

const obtenerDivision = async (req, res = response) => {
  const { id } = req.params;
  try {
    const division = await DivisionAdministrativa.obtenerPorId(id);
    if (!division) {
      return res.status(404).json({
        ok: false,
        msg: "División administrativa no encontrada",
      });
    }

    res.json({
      ok: true,
      division,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener división",
    });
  }
};

const obtenerDivisionConHijos = async (req, res = response) => {
  const { id } = req.params;
  try {
    const division = await DivisionAdministrativa.obtenerPorId(id);
    if (!division) {
      return res.status(404).json({
        ok: false,
        msg: "División administrativa no encontrada",
      });
    }

    const hijos = await DivisionAdministrativa.obtenerHijos(id);
    const estadisticas = await DivisionAdministrativa.obtenerEstadisticas(id);

    res.json({
      ok: true,
      division,
      subdivisiones: hijos,
      estadisticas,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener división",
    });
  }
};

const obtenerJerarquiaDivision = async (req, res = response) => {
  const { id } = req.params;
  try {
    const jerarquia = await DivisionAdministrativa.obtenerJerarquia(id);
    res.json({
      ok: true,
      jerarquia,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener jerarquía",
    });
  }
};

const obtenerRutaDivision = async (req, res = response) => {
  const { id } = req.params;
  try {
    const ruta = await DivisionAdministrativa.obtenerRutaCompleta(id);
    res.json({
      ok: true,
      ruta,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener ruta",
    });
  }
};

const buscarDivisiones = async (req, res = response) => {
  const { q, pais } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      ok: false,
      msg: "El término de búsqueda debe tener al menos 2 caracteres",
    });
  }

  try {
    const divisiones = await DivisionAdministrativa.buscarPorNombre(q, pais);
    res.json({
      ok: true,
      divisiones,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al buscar divisiones",
    });
  }
};

const crearDivision = async (req, res = response) => {
  try {
    const result = await DivisionAdministrativa.crear(req.body);
    res.status(201).json({
      ok: true,
      msg: "División creada exitosamente",
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al crear división",
    });
  }
};

const actualizarDivision = async (req, res = response) => {
  const { id } = req.params;
  try {
    const division = await DivisionAdministrativa.obtenerPorId(id);
    if (!division) {
      return res.status(404).json({
        ok: false,
        msg: "División administrativa no encontrada",
      });
    }

    await DivisionAdministrativa.actualizar(id, req.body);
    res.json({
      ok: true,
      msg: "División actualizada exitosamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al actualizar división",
    });
  }
};

const eliminarDivision = async (req, res = response) => {
  const { id } = req.params;
  try {
    const division = await DivisionAdministrativa.obtenerPorId(id);
    if (!division) {
      return res.status(404).json({
        ok: false,
        msg: "División administrativa no encontrada",
      });
    }

    // Verificar si tiene subdivisiones
    const hijos = await DivisionAdministrativa.obtenerHijos(id);
    if (hijos.length > 0) {
      return res.status(400).json({
        ok: false,
        msg: "No se puede eliminar una división que tiene subdivisiones",
      });
    }

    await DivisionAdministrativa.eliminar(id);
    res.json({
      ok: true,
      msg: "División eliminada exitosamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al eliminar división",
    });
  }
};

module.exports = {
  // Continentes
  obtenerContinentes,
  obtenerContinente,

  // Países
  obtenerPaises,
  obtenerPais,
  obtenerPaisPorCodigo,
  obtenerEstructuraPais,
  crearPais,
  actualizarPais,

  // Divisiones
  obtenerDivisiones,
  obtenerDivision,
  obtenerDivisionConHijos,
  obtenerJerarquiaDivision,
  obtenerRutaDivision,
  buscarDivisiones,
  crearDivision,
  actualizarDivision,
  eliminarDivision,
};
