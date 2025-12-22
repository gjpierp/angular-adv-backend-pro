const { response } = require("express");
const Usuario = require("../models/usuario");

const validarPermiso = (...permisosRequeridos) => {
  return async (req, res = response, next) => {
    const uid = req.uid;

    if (!uid) {
      return res.status(401).json({
        ok: false,
        msg: "No hay token en la petición",
      });
    }

    try {
      // Obtener permisos del usuario
      const permisos = await Usuario.obtenerPermisos(uid);
      const codigosPermisos = permisos.map((p) => p.codigo);

      // Verificar si el usuario tiene alguno de los permisos requeridos
      const tienePermiso = permisosRequeridos.some((permiso) =>
        codigosPermisos.includes(permiso)
      );

      if (!tienePermiso) {
        return res.status(403).json({
          ok: false,
          msg: "No tiene permisos suficientes para realizar esta acción",
        });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({
        ok: false,
        msg: "Error al validar permisos",
      });
    }
  };
};

const validarRol = (...rolesRequeridos) => {
  return async (req, res = response, next) => {
    const uid = req.uid;

    if (!uid) {
      return res.status(401).json({
        ok: false,
        msg: "No hay token en la petición",
      });
    }

    try {
      // Obtener roles del usuario
      const roles = await Usuario.obtenerRoles(uid);
      const nombresRoles = roles.map((r) => r.nombre);

      // Verificar si el usuario tiene alguno de los roles requeridos
      const tieneRol = rolesRequeridos.some((rol) =>
        nombresRoles.includes(rol)
      );

      if (!tieneRol) {
        return res.status(403).json({
          ok: false,
          msg: "No tiene el rol necesario para realizar esta acción",
        });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({
        ok: false,
        msg: "Error al validar rol",
      });
    }
  };
};

const validarPermisoOAdmin = (...permisosRequeridos) => {
  return async (req, res = response, next) => {
    const uid = req.uid;

    if (!uid) {
      return res.status(401).json({
        ok: false,
        msg: "No hay token en la petición",
      });
    }

    try {
      // Verificar si es administrador
      const esAdmin = await Usuario.tieneRol(uid, "ADMIN");
      if (esAdmin) {
        return next();
      }

      // Si no es admin, verificar permisos
      const permisos = await Usuario.obtenerPermisos(uid);
      const codigosPermisos = permisos.map((p) => p.codigo);

      const tienePermiso = permisosRequeridos.some((permiso) =>
        codigosPermisos.includes(permiso)
      );

      if (!tienePermiso) {
        return res.status(403).json({
          ok: false,
          msg: "No tiene permisos suficientes para realizar esta acción",
        });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({
        ok: false,
        msg: "Error al validar permisos",
      });
    }
  };
};

module.exports = {
  validarPermiso,
  validarRol,
  validarPermisoOAdmin,
};
