const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos } = require("../middlewares/validar-campos");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarPermiso } = require("../middlewares/validar-permisos");
const { middlewareRegistrarAccion } = require("../helpers/registrar-accion");

const {
  obtenerMenus,
  obtenerArbolMenus,
  obtenerMenu,
  crearMenu,
  actualizarMenu,
  eliminarMenu,
  obtenerMenusUsuario,
  asignarPermisos,
  obtenerPermisosMenu,
} = require("../controllers/menus");

const router = Router();

// Todas las rutas requieren autenticación
router.use(validarJWT);

// GET /api/menus/usuario - Obtener menús del usuario autenticado
router.get("/usuario", obtenerMenusUsuario);

// GET /api/menus/arbol - Obtener menús en estructura de árbol
router.get("/arbol", validarPermiso("MENUS_VER"), obtenerArbolMenus);

// GET /api/menus - Obtener todos los menús
router.get("/", validarPermiso("MENUS_VER"), obtenerMenus);

// GET /api/menus/:id - Obtener un menú por ID
router.get(
  "/:id",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    validarCampos,
    validarPermiso("MENUS_VER"),
  ],
  obtenerMenu
);

// POST /api/menus - Crear un nuevo menú
router.post(
  "/",
  [
    check("nombre", "El nombre es obligatorio").not().isEmpty(),
    check("nombre", "El nombre debe tener máximo 50 caracteres").isLength({
      max: 50,
    }),
    check("nivel", "El nivel es obligatorio").isNumeric(),
    validarCampos,
    validarPermiso("MENUS_CREAR"),
    middlewareRegistrarAccion("CREAR", "menus"),
  ],
  crearMenu
);

// PUT /api/menus/:id - Actualizar un menú
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
    check("ruta", "La ruta debe tener máximo 100 caracteres")
      .optional()
      .isLength({ max: 100 }),
    check("icono", "El icono debe tener máximo 50 caracteres")
      .optional()
      .isLength({ max: 50 }),
    check("nivel", "El nivel debe ser numérico").optional().isNumeric(),
    check("orden", "El orden debe ser numérico").optional().isNumeric(),
    check("visible", "El campo visible debe ser un booleano")
      .optional()
      .isBoolean(),
    check("id_menu_padre", "El id del menú padre debe ser numérico")
      .optional()
      .isNumeric(),
    validarCampos,
    validarPermiso("MENUS_EDITAR"),
    middlewareRegistrarAccion("ACTUALIZAR", "menus"),
  ],
  actualizarMenu
);

// DELETE /api/menus/:id - Eliminar un menú
router.delete(
  "/:id",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    validarCampos,
    validarPermiso("MENUS_ELIMINAR"),
    middlewareRegistrarAccion("ELIMINAR", "menus"),
  ],
  eliminarMenu
);

// POST /api/menus/:id/permisos - Asignar permisos a un menú
router.post(
  "/:id/permisos",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    check("permisos", "Los permisos deben ser un array").isArray(),
    validarCampos,
    validarPermiso("MENUS_EDITAR"),
    middlewareRegistrarAccion("ASIGNAR_PERMISOS", "menus"),
  ],
  asignarPermisos
);

// GET /api/menus/:id/permisos - Obtener permisos de un menú
router.get(
  "/:id/permisos",
  [
    check("id", "El id debe ser numérico").isNumeric(),
    validarCampos,
    validarPermiso("MENUS_VER"),
  ],
  obtenerPermisosMenu
);

module.exports = router;
