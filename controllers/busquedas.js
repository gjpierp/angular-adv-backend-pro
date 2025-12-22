const { response } = require("express");
const Usuario = require("../models/usuario");
const {
  obtenerMensaje: obtenerMensajeTraduccido,
} = require("../helpers/traducciones");

const getTodo = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  try {
    const busqueda = req.params.busqueda;
    const regex = new RegExp(busqueda, "i");
    const usuarios = await Usuario.listar(1, 100);
    // Filtrar usuarios por el término de búsqueda
    const usuariosFiltrados = usuarios.filter(
      (u) =>
        (u.nombre_usuario && u.nombre_usuario.match(regex)) ||
        (u.nombres && u.nombres.match(regex)) ||
        (u.correo_electronico && u.correo_electronico.match(regex))
    );
    res.json({
      ok: true,
      usuarios: usuariosFiltrados,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido("SEARCH_ERROR", idioma);
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al realizar la búsqueda",
    });
  }
};

const getDocumentosColeccion = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  try {
    const tabla = req.params.tabla;
    const busqueda = req.params.busqueda;
    const regex = new RegExp(busqueda, "i");
    let data = [];
    switch (tabla) {
      case "usuarios":
        const usuarios = await Usuario.listar(1, 100);
        data = usuarios.filter(
          (u) =>
            (u.nombre_usuario && u.nombre_usuario.match(regex)) ||
            (u.nombres && u.nombres.match(regex)) ||
            (u.correo_electronico && u.correo_electronico.match(regex))
        );
        break;
      default:
        const msgError = await obtenerMensajeTraduccido(
          "SEARCH_TABLE_INVALID",
          idioma
        );
        return res.status(400).json({
          ok: false,
          msg: msgError || "La tabla tiene que ser usuarios",
        });
    }
    res.json({
      ok: true,
      resultados: data,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido("SEARCH_ERROR", idioma);
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al realizar la búsqueda",
    });
  }
};

module.exports = {
  getTodo,
  getDocumentosColeccion,
};
