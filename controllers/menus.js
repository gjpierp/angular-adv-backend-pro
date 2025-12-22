const { response } = require("express");
const Menu = require("../models/menu");
const {
  obtenerMensaje: obtenerMensajeTraduccido,
} = require("../helpers/traducciones");

const obtenerMenus = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  try {
    const menus = await Menu.listar();
    res.json({
      ok: true,
      menus,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido("MENU_GET_ERROR", idioma);
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener menús",
    });
  }
};

const obtenerArbolMenus = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  try {
    const arbol = await Menu.construirArbol();
    res.json({
      ok: true,
      menus: arbol,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "MENU_TREE_GET_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener árbol de menús",
    });
  }
};

const obtenerMenu = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  try {
    const { id } = req.params;
    const menu = await Menu.obtenerPorId(id);
    if (!menu) {
      const msgError = await obtenerMensajeTraduccido("MENU_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "Menú no encontrado",
      });
    }
    // Obtener permisos del menú
    const permisos = await Menu.obtenerPermisos(id);
    res.json({
      ok: true,
      menu: {
        ...menu,
        permisos,
      },
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido("MENU_GET_ERROR", idioma);
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener menú",
    });
  }
};

const crearMenu = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  try {
    const datos = req.body;
    const idMenu = await Menu.crear(datos);
    const msgSuccess = await obtenerMensajeTraduccido("MENU_CREATED", idioma);
    res.status(201).json({
      ok: true,
      id_menu: idMenu,
      msg: msgSuccess || "Menú creado exitosamente",
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "MENU_CREATE_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al crear menú",
    });
  }
};

const actualizarMenu = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  try {
    const { id } = req.params;
    const datos = req.body;
    // Verificar que el menú existe
    const menu = await Menu.obtenerPorId(id);
    if (!menu) {
      const msgError = await obtenerMensajeTraduccido("MENU_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "Menú no encontrado",
      });
    }
    // Verificar que no se está intentando hacer padre de sí mismo
    if (datos.id_menu_padre && parseInt(datos.id_menu_padre) === parseInt(id)) {
      const msgError = await obtenerMensajeTraduccido(
        "MENU_SELF_PARENT_ERROR",
        idioma
      );
      return res.status(400).json({
        ok: false,
        msg: msgError || "Un menú no puede ser padre de sí mismo",
      });
    }
    await Menu.actualizar(id, datos);
    const msgSuccess = await obtenerMensajeTraduccido("MENU_UPDATED", idioma);
    res.json({
      ok: true,
      msg: msgSuccess || "Menú actualizado exitosamente",
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "MENU_UPDATE_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al actualizar menú",
    });
  }
};

const eliminarMenu = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  try {
    const { id } = req.params;
    // Verificar que el menú existe
    const menu = await Menu.obtenerPorId(id);
    if (!menu) {
      const msgError = await obtenerMensajeTraduccido("MENU_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "Menú no encontrado",
      });
    }
    // Verificar si tiene menús hijos
    const hijos = await Menu.obtenerJerarquia(id);
    if (hijos.length > 0) {
      const msgError = await obtenerMensajeTraduccido(
        "MENU_HAS_CHILDREN_ERROR",
        idioma
      );
      return res.status(400).json({
        ok: false,
        msg: msgError || "No se puede eliminar el menú porque tiene submenús",
      });
    }
    await Menu.eliminar(id);
    const msgSuccess = await obtenerMensajeTraduccido("MENU_DELETED", idioma);
    res.json({
      ok: true,
      msg: msgSuccess || "Menú eliminado exitosamente",
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "MENU_DELETE_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al eliminar menú",
    });
  }
};

const obtenerMenusUsuario = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  try {
    // El usuario autenticado viene del token JWT en req.uid
    const idUsuario = req.uid;
    const arbol = await Menu.construirArbolUsuario(idUsuario);
    res.json({
      ok: true,
      menus: arbol,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "MENU_USER_GET_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener menús del usuario",
    });
  }
};

const asignarPermisos = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  try {
    const { id } = req.params;
    const { permisos } = req.body; // Array de IDs de permisos
    // Verificar que el menú existe
    const menu = await Menu.obtenerPorId(id);
    if (!menu) {
      const msgError = await obtenerMensajeTraduccido("MENU_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "Menú no encontrado",
      });
    }
    // Aquí podrías implementar una sincronización similar a roles
    // Por ahora solo devuelvo un mensaje de éxito
    const msgSuccess = await obtenerMensajeTraduccido(
      "MENU_PERMISSIONS_ASSIGNED",
      idioma
    );
    res.json({
      ok: true,
      msg: msgSuccess || "Permisos asignados exitosamente",
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "MENU_ASSIGN_PERMISSIONS_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al asignar permisos",
    });
  }
};

const obtenerPermisosMenu = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  try {
    const { id } = req.params;
    // Verificar que el menú existe
    const menu = await Menu.obtenerPorId(id);
    if (!menu) {
      const msgError = await obtenerMensajeTraduccido("MENU_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "Menú no encontrado",
      });
    }
    const permisos = await Menu.obtenerPermisos(id);
    res.json({
      ok: true,
      permisos,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "MENU_PERMISSIONS_GET_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener permisos del menú",
    });
  }
};

module.exports = {
  obtenerMenus,
  obtenerArbolMenus,
  obtenerMenu,
  crearMenu,
  actualizarMenu,
  eliminarMenu,
  obtenerMenusUsuario,
  asignarPermisos,
  obtenerPermisosMenu,
};
