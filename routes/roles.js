const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos } = require("../middlewares/validar-campos");
const { validarJWT } = require("../middlewares/validar-jwt");
const {
  validarPermiso,
  validarRol,
} = require("../middlewares/validar-permisos");
const { middlewareRegistrarAccion } = require("../helpers/registrar-accion");

const {
  obtenerRoles,
  obtenerRol,
  crearRol,
  actualizarRol,
  eliminarRol,
  asignarPermisos,
  obtenerPermisosRol,
  obtenerUsuariosRol,
} = require("../controllers/roles");

const router = Router();

// Todas las rutas requieren autenticación
router.use(validarJWT);

// GET /api/roles - Obtener todos los roles
router.get("/", validarPermiso("ROLES_VER"), obtenerRoles);

// GET /api/roles/:id - Obtener un rol por ID
router.get(
  "/:id",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    validarCampos,
    validarPermiso("ROLES_VER"),
  ],
  obtenerRol
);

// POST /api/roles - Crear un nuevo rol
router.post(
  "/",
  [
    check("nombre", "El nombre es obligatorio").not().isEmpty(),
    check("nombre", "El nombre debe tener máximo 50 caracteres").isLength({
      max: 50,
    }),
    validarCampos,
    validarPermiso("ROLES_CREAR"),
    middlewareRegistrarAccion("CREAR", "roles"),
  ],
  crearRol
);

// PUT /api/roles/:id - Actualizar un rol
router.put(
  "/:id",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    check("nombre", "El nombre debe tener máximo 50 caracteres")
      .optional()
      .isLength({ max: 50 }),
    check("descripcion", "La descripción debe tener máximo 255 caracteres")
      .optional()
      .isLength({ max: 255 }),
    validarCampos,
    validarPermiso("ROLES_EDITAR"),
    middlewareRegistrarAccion("ACTUALIZAR", "roles"),
  ],
  actualizarRol
);

// DELETE /api/roles/:id - Eliminar un rol
router.delete(
  "/:id",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    validarCampos,
    validarPermiso("ROLES_ELIMINAR"),
    middlewareRegistrarAccion("ELIMINAR", "roles"),
  ],
  eliminarRol
);

// POST /api/roles/:id/permisos - Asignar permisos a un rol
router.post(
  "/:id/permisos",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    check("permisos", "Los permisos deben ser un array").isArray(),
    validarCampos,
    validarPermiso("ROLES_EDITAR"),
    middlewareRegistrarAccion("ASIGNAR_PERMISOS", "roles"),
  ],
  asignarPermisos
);

// GET /api/roles/:id/permisos - Obtener permisos de un rol
router.get(
  "/:id/permisos",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    validarCampos,
    validarPermiso("ROLES_VER"),
  ],
  obtenerPermisosRol
);

// GET /api/roles/:id/usuarios - Obtener usuarios de un rol
router.get(
  "/:id/usuarios",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    validarCampos,
    validarPermiso("ROLES_VER"),
  ],
  obtenerUsuariosRol
);

module.exports = router;
