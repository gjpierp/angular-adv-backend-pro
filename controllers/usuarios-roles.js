const { response } = require("express");
const Usuario = require("../models/usuario");

const asignarRoles = async (req, res = response) => {
  try {
    const { id } = req.params;
    const { roles } = req.body; // Array de IDs de roles

    // Verificar que el usuario existe
    const usuarioDB = await Usuario.obtenerPorId(id);
    if (!usuarioDB || usuarioDB.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Usuario no encontrado",
      });
    }

    await Usuario.sincronizarRoles(id, roles);

    res.json({
      ok: true,
      msg: "Roles asignados exitosamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al asignar roles",
    });
  }
};

const obtenerRolesUsuario = async (req, res = response) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const usuarioDB = await Usuario.obtenerPorId(id);
    if (!usuarioDB || usuarioDB.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Usuario no encontrado",
      });
    }

    const roles = await Usuario.obtenerRoles(id);

    res.json({
      ok: true,
      roles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener roles del usuario",
    });
  }
};

const obtenerPermisosUsuario = async (req, res = response) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const usuarioDB = await Usuario.obtenerPorId(id);
    if (!usuarioDB || usuarioDB.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Usuario no encontrado",
      });
    }

    const permisos = await Usuario.obtenerPermisos(id);

    res.json({
      ok: true,
      permisos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener permisos del usuario",
    });
  }
};

module.exports = {
  asignarRoles,
  obtenerRolesUsuario,
  obtenerPermisosUsuario,
};
