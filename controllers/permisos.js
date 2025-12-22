const { response } = require("express");
const Permiso = require("../models/permiso");
const {
  obtenerMensaje: obtenerMensajeTraduccido,
} = require("../helpers/traducciones");

const obtenerPermisos = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const desde = Number(req.query.desde) || 0;
    const limite = Number(req.query.limite) || 5;

    const [permisos, total] = await Promise.all([
      Permiso.listar(desde, limite),
      Permiso.contar(),
    ]);

    res.json({
      ok: true,
      permisos,
      total,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "PERMISSION_GET_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener permisos",
    });
  }
};

const obtenerPermiso = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const { id } = req.params;
    const permiso = await Permiso.obtenerPorId(id);

    if (!permiso) {
      const msgError = await obtenerMensajeTraduccido(
        "PERMISSION_NOT_FOUND",
        idioma
      );
      return res.status(404).json({
        ok: false,
        msg: msgError || "Permiso no encontrado",
      });
    }

    // Obtener roles que tienen este permiso
    const roles = await Permiso.obtenerRoles(id);

    res.json({
      ok: true,
      permiso: {
        ...permiso,
        roles,
      },
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "PERMISSION_GET_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener permiso",
    });
  }
};

const crearPermiso = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const { codigo, descripcion } = req.body;

    // Verificar si ya existe un permiso con ese código
    const permisoExiste = await Permiso.obtenerPorCodigo(codigo);
    if (permisoExiste) {
      const msgError = await obtenerMensajeTraduccido(
        "PERMISSION_CODE_EXISTS",
        idioma
      );
      return res.status(400).json({
        ok: false,
        msg: msgError || "Ya existe un permiso con ese código",
      });
    }

    const idPermiso = await Permiso.crear(codigo, descripcion);

    const msgSuccess = await obtenerMensajeTraduccido(
      "PERMISSION_CREATED",
      idioma
    );

    res.status(201).json({
      ok: true,
      id_permiso: idPermiso,
      msg: msgSuccess || "Permiso creado exitosamente",
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "PERMISSION_CREATE_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al crear permiso",
    });
  }
};

const actualizarPermiso = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const { id } = req.params;
    const { codigo, descripcion } = req.body;

    // Verificar que el permiso existe
    const permiso = await Permiso.obtenerPorId(id);
    if (!permiso) {
      const msgError = await obtenerMensajeTraduccido(
        "PERMISSION_NOT_FOUND",
        idioma
      );
      return res.status(404).json({
        ok: false,
        msg: msgError || "Permiso no encontrado",
      });
    }

    // Verificar si el nuevo código ya está en uso por otro permiso
    if (codigo !== permiso.codigo) {
      const permisoExiste = await Permiso.obtenerPorCodigo(codigo);
      if (permisoExiste && permisoExiste.id_permiso !== parseInt(id)) {
        const msgError = await obtenerMensajeTraduccido(
          "PERMISSION_CODE_EXISTS",
          idioma
        );
        return res.status(400).json({
          ok: false,
          msg: msgError || "Ya existe otro permiso con ese código",
        });
      }
    }

    await Permiso.actualizar(id, codigo, descripcion);

    const msgSuccess = await obtenerMensajeTraduccido(
      "PERMISSION_UPDATED",
      idioma
    );

    res.json({
      ok: true,
      msg: msgSuccess || "Permiso actualizado exitosamente",
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "PERMISSION_UPDATE_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al actualizar permiso",
    });
  }
};

const eliminarPermiso = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const { id } = req.params;

    // Verificar que el permiso existe
    const permiso = await Permiso.obtenerPorId(id);
    if (!permiso) {
      const msgError = await obtenerMensajeTraduccido(
        "PERMISSION_NOT_FOUND",
        idioma
      );
      return res.status(404).json({
        ok: false,
        msg: msgError || "Permiso no encontrado",
      });
    }

    await Permiso.eliminar(id);

    const msgSuccess = await obtenerMensajeTraduccido(
      "PERMISSION_DELETED",
      idioma
    );

    res.json({
      ok: true,
      msg: msgSuccess || "Permiso eliminado exitosamente",
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "PERMISSION_DELETE_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al eliminar permiso",
    });
  }
};

const obtenerRolesPermiso = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const { id } = req.params;

    // Verificar que el permiso existe
    const permiso = await Permiso.obtenerPorId(id);
    if (!permiso) {
      const msgError = await obtenerMensajeTraduccido(
        "PERMISSION_NOT_FOUND",
        idioma
      );
      return res.status(404).json({
        ok: false,
        msg: msgError || "Permiso no encontrado",
      });
    }

    const roles = await Permiso.obtenerRoles(id);

    res.json({
      ok: true,
      roles,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "PERMISSION_ROLES_GET_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener roles del permiso",
    });
  }
};

const obtenerMenusPermiso = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const { id } = req.params;

    // Verificar que el permiso existe
    const permiso = await Permiso.obtenerPorId(id);
    if (!permiso) {
      const msgError = await obtenerMensajeTraduccido(
        "PERMISSION_NOT_FOUND",
        idioma
      );
      return res.status(404).json({
        ok: false,
        msg: msgError || "Permiso no encontrado",
      });
    }

    const menus = await Permiso.obtenerMenus(id);

    res.json({
      ok: true,
      menus,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "PERMISSION_MENUS_GET_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener menús del permiso",
    });
  }
};

module.exports = {
  obtenerPermisos,
  obtenerPermiso,
  crearPermiso,
  actualizarPermiso,
  eliminarPermiso,
  obtenerRolesPermiso,
  obtenerMenusPermiso,
};
