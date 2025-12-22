const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos } = require("../middlewares/validar-campos");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarPermiso } = require("../middlewares/validar-permisos");
const { middlewareRegistrarAccion } = require("../helpers/registrar-accion");

const {
  obtenerPermisos,
  obtenerPermiso,
  crearPermiso,
  actualizarPermiso,
  eliminarPermiso,
  obtenerRolesPermiso,
  obtenerMenusPermiso,
} = require("../controllers/permisos");

const router = Router();

// Todas las rutas requieren autenticación
router.use(validarJWT);

// GET /api/permisos - Obtener todos los permisos
router.get("/", validarPermiso("PERMISOS_VER"), obtenerPermisos);

// GET /api/permisos/:id - Obtener un permiso por ID
router.get(
  "/:id",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    validarCampos,
    validarPermiso("PERMISOS_VER"),
  ],
  obtenerPermiso
);

// POST /api/permisos - Crear un nuevo permiso
router.post(
  "/",
  [
    check("codigo", "El código es obligatorio").not().isEmpty(),
    check("codigo", "El código debe tener máximo 50 caracteres").isLength({
      max: 50,
    }),
    validarCampos,
    validarPermiso("PERMISOS_CREAR"),
    middlewareRegistrarAccion("CREAR", "permisos"),
  ],
  crearPermiso
);

// PUT /api/permisos/:id - Actualizar un permiso
router.put(
  "/:id",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    check("codigo", "El código debe tener máximo 50 caracteres")
      .optional()
      .isLength({ max: 50 }),
    check("descripcion", "La descripción debe tener máximo 255 caracteres")
      .optional()
      .isLength({ max: 255 }),
    validarCampos,
    validarPermiso("PERMISOS_EDITAR"),
    middlewareRegistrarAccion("ACTUALIZAR", "permisos"),
  ],
  actualizarPermiso
);

// DELETE /api/permisos/:id - Eliminar un permiso
router.delete(
  "/:id",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    validarCampos,
    validarPermiso("PERMISOS_ELIMINAR"),
    middlewareRegistrarAccion("ELIMINAR", "permisos"),
  ],
  eliminarPermiso
);

// GET /api/permisos/:id/roles - Obtener roles que tienen este permiso
router.get(
  "/:id/roles",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    validarCampos,
    validarPermiso("PERMISOS_VER"),
  ],
  obtenerRolesPermiso
);

// GET /api/permisos/:id/menus - Obtener menús que requieren este permiso
router.get(
  "/:id/menus",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    validarCampos,
    validarPermiso("PERMISOS_VER"),
  ],
  obtenerMenusPermiso
);

module.exports = router;
