const { response } = require("express");
const Rol = require("../models/rol");
const {
  obtenerMensaje: obtenerMensajeTraduccido,
} = require("../helpers/traducciones");

const obtenerRoles = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const desde = Number(req.query.desde) || 0;
    const limite = Number(req.query.limite) || 5;

    const [roles, total] = await Promise.all([
      Rol.listar(desde, limite),
      Rol.contar(),
    ]);

    res.json({
      ok: true,
      roles,
      total,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido("ROLE_GET_ERROR", idioma);
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener roles",
    });
  }
};

const obtenerRol = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const { id } = req.params;
    const rol = await Rol.obtenerPorId(id);

    if (!rol) {
      const msgError = await obtenerMensajeTraduccido("ROLE_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "Rol no encontrado",
      });
    }

    // Obtener permisos del rol
    const permisos = await Rol.obtenerPermisos(id);

    res.json({
      ok: true,
      rol: {
        ...rol,
        permisos,
      },
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido("ROLE_GET_ERROR", idioma);
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener rol",
    });
  }
};

const crearRol = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const { nombre, descripcion } = req.body;

    // Verificar si ya existe un rol con ese nombre
    const rolExiste = await Rol.obtenerPorNombre(nombre);
    if (rolExiste) {
      const msgError = await obtenerMensajeTraduccido(
        "ROLE_NAME_EXISTS",
        idioma
      );
      return res.status(400).json({
        ok: false,
        msg: msgError || "Ya existe un rol con ese nombre",
      });
    }

    const idRol = await Rol.crear(nombre, descripcion);

    const msgSuccess = await obtenerMensajeTraduccido("ROLE_CREATED", idioma);

    res.status(201).json({
      ok: true,
      id_rol: idRol,
      msg: msgSuccess || "Rol creado exitosamente",
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "ROLE_CREATE_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al crear rol",
    });
  }
};

const actualizarRol = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    // Verificar que el rol existe
    const rol = await Rol.obtenerPorId(id);
    if (!rol) {
      const msgError = await obtenerMensajeTraduccido("ROLE_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "Rol no encontrado",
      });
    }

    // Verificar si el nuevo nombre ya está en uso por otro rol
    if (nombre !== rol.nombre) {
      const rolExiste = await Rol.obtenerPorNombre(nombre);
      if (rolExiste && rolExiste.id_rol !== parseInt(id)) {
        const msgError = await obtenerMensajeTraduccido(
          "ROLE_NAME_EXISTS",
          idioma
        );
        return res.status(400).json({
          ok: false,
          msg: msgError || "Ya existe otro rol con ese nombre",
        });
      }
    }

    await Rol.actualizar(id, nombre, descripcion);

    const msgSuccess = await obtenerMensajeTraduccido("ROLE_UPDATED", idioma);

    res.json({
      ok: true,
      msg: msgSuccess || "Rol actualizado exitosamente",
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "ROLE_UPDATE_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al actualizar rol",
    });
  }
};

const eliminarRol = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const { id } = req.params;

    // Verificar que el rol existe
    const rol = await Rol.obtenerPorId(id);
    if (!rol) {
      const msgError = await obtenerMensajeTraduccido("ROLE_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "Rol no encontrado",
      });
    }

    // Verificar si hay usuarios con este rol
    const usuarios = await Rol.obtenerUsuarios(id);
    if (usuarios.length > 0) {
      const msgError = await obtenerMensajeTraduccido("ROLE_HAS_USERS", idioma);
      return res.status(400).json({
        ok: false,
        msg:
          msgError ||
          "No se puede eliminar el rol porque tiene usuarios asignados",
      });
    }

    await Rol.eliminar(id);

    const msgSuccess = await obtenerMensajeTraduccido("ROLE_DELETED", idioma);

    res.json({
      ok: true,
      msg: msgSuccess || "Rol eliminado exitosamente",
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "ROLE_DELETE_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al eliminar rol",
    });
  }
};

const asignarPermisos = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const { id } = req.params;
    const { permisos } = req.body; // Array de IDs de permisos

    // Verificar que el rol existe
    const rol = await Rol.obtenerPorId(id);
    if (!rol) {
      const msgError = await obtenerMensajeTraduccido("ROLE_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "Rol no encontrado",
      });
    }

    await Rol.sincronizarPermisos(id, permisos);

    const msgSuccess = await obtenerMensajeTraduccido(
      "ROLE_PERMISSIONS_ASSIGNED",
      idioma
    );

    res.json({
      ok: true,
      msg: msgSuccess || "Permisos asignados exitosamente",
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "ROLE_PERMISSIONS_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al asignar permisos",
    });
  }
};

const obtenerPermisosRol = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const { id } = req.params;

    // Verificar que el rol existe
    const rol = await Rol.obtenerPorId(id);
    if (!rol) {
      const msgError = await obtenerMensajeTraduccido("ROLE_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "Rol no encontrado",
      });
    }

    const permisos = await Rol.obtenerPermisos(id);

    res.json({
      ok: true,
      permisos,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "ROLE_PERMISSIONS_GET_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener permisos del rol",
    });
  }
};

const obtenerUsuariosRol = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";

  try {
    const { id } = req.params;

    // Verificar que el rol existe
    const rol = await Rol.obtenerPorId(id);
    if (!rol) {
      const msgError = await obtenerMensajeTraduccido("ROLE_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "Rol no encontrado",
      });
    }

    const usuarios = await Rol.obtenerUsuarios(id);

    res.json({
      ok: true,
      usuarios,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "ROLE_USERS_GET_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener usuarios del rol",
    });
  }
};

module.exports = {
  obtenerRoles,
  obtenerRol,
  crearRol,
  actualizarRol,
  eliminarRol,
  asignarPermisos,
  obtenerPermisosRol,
  obtenerUsuariosRol,
};
