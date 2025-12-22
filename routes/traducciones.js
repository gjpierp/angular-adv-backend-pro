/**
 * Ruta: /api/traducciones
 */
const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos } = require("../middlewares/validar-campos");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarPermiso } = require("../middlewares/validar-permisos");

const {
  obtenerIdiomas,
  obtenerIdiomaPorCodigo,
  obtenerMensajes,
  obtenerPaisesTraducidos,
  obtenerDivisionesTraducidas,
  obtenerContinentesTraducidos,
  obtenerRolesTraducidos,
  obtenerPermisosTraducidos,
  obtenerMenusTraducidos,
  guardarTraduccionPais,
  guardarTraduccionDivision,
  guardarTraduccionRol,
  guardarTraduccionPermiso,
  guardarTraduccionMenu,
  eliminarTraduccion,
  obtenerTraduccionesRegistro,
} = require("../controllers/traducciones");

const router = Router();

// =====================================================
// RUTAS PÚBLICAS - CONSULTA DE IDIOMAS Y TRADUCCIONES
// =====================================================

/**
 * GET /api/traducciones/idiomas
 * Obtener todos los idiomas disponibles
 */
router.get("/idiomas", obtenerIdiomas);

/**
 * GET /api/traducciones/idioma/:codigo
 * Obtener idioma por código ISO (es, en, pt, etc.)
 */
router.get(
  "/idioma/:codigo",
  [
    check("codigo", "El código de idioma es obligatorio").not().isEmpty(),
    check("codigo", "El código debe tener entre 2 y 5 caracteres").isLength({
      min: 2,
      max: 5,
    }),
    validarCampos,
  ],
  obtenerIdiomaPorCodigo
);

/**
 * GET /api/traducciones/mensajes
 * Obtener todos los mensajes del sistema traducidos
 * Query params: ?idioma=es
 */
router.get("/mensajes", obtenerMensajes);

/**
 * GET /api/traducciones/paises
 * Obtener países con traducciones
 * Query params: ?idioma=es&id_continente=5
 */
router.get("/paises", obtenerPaisesTraducidos);

/**
 * GET /api/traducciones/divisiones
 * Obtener divisiones administrativas con traducciones
 * Query params: ?idioma=es&id_pais=1&nivel=1
 */
router.get("/divisiones", obtenerDivisionesTraducidas);

/**
 * GET /api/traducciones/continentes
 * Obtener continentes con traducciones
 * Query params: ?idioma=es
 */
router.get("/continentes", obtenerContinentesTraducidos);

/**
 * GET /api/traducciones/roles
 * Obtener roles con traducciones
 * Query params: ?idioma=es
 */
router.get("/roles", obtenerRolesTraducidos);

/**
 * GET /api/traducciones/permisos
 * Obtener permisos con traducciones
 * Query params: ?idioma=es
 */
router.get("/permisos", obtenerPermisosTraducidos);

/**
 * GET /api/traducciones/menus
 * Obtener menús con traducciones
 * Query params: ?idioma=es
 */
router.get("/menus", obtenerMenusTraducidos);

/**
 * GET /api/traducciones/:tabla/:id
 * Obtener todas las traducciones de un registro específico
 */
router.get(
  "/:tabla/:id",
  [
    check("tabla", "La tabla es obligatoria")
      .not()
      .isEmpty()
      .isIn([
        "paises",
        "divisiones",
        "roles",
        "permisos",
        "menus",
        "continentes",
      ])
      .withMessage("Tabla no válida"),
    check("id", "El ID debe ser numérico").isNumeric(),
    validarCampos,
  ],
  obtenerTraduccionesRegistro
);

// =====================================================
// RUTAS PROTEGIDAS - REQUIEREN AUTENTICACIÓN Y PERMISOS
// =====================================================

/**
 * POST /api/traducciones/paises/:id
 * Crear o actualizar traducción de país
 */
router.post(
  "/paises/:id",
  [
    validarJWT,
    validarPermiso("TRADUCCIONES_EDITAR", "ADMIN"),
    check("id", "El ID debe ser numérico").isNumeric(),
    check("idioma", "El código de idioma es obligatorio").not().isEmpty(),
    check("idioma", "El código debe tener entre 2 y 5 caracteres").isLength({
      min: 2,
      max: 5,
    }),
    check("nombre_pais", "El nombre del país es obligatorio").not().isEmpty(),
    check("nombre_pais", "El nombre debe tener máximo 100 caracteres").isLength(
      { max: 100 }
    ),
    check(
      "nombre_oficial",
      "El nombre oficial debe tener máximo 255 caracteres"
    )
      .optional()
      .isLength({ max: 255 }),
    check("capital", "La capital debe tener máximo 100 caracteres")
      .optional()
      .isLength({ max: 100 }),
    check("gentilicio", "El gentilicio debe tener máximo 100 caracteres")
      .optional()
      .isLength({ max: 100 }),
    validarCampos,
  ],
  guardarTraduccionPais
);

/**
 * POST /api/traducciones/divisiones/:id
 * Crear o actualizar traducción de división administrativa
 */
router.post(
  "/divisiones/:id",
  [
    validarJWT,
    validarPermiso("TRADUCCIONES_EDITAR", "ADMIN"),
    check("id", "El ID debe ser numérico").isNumeric(),
    check("idioma", "El código de idioma es obligatorio").not().isEmpty(),
    check("idioma", "El código debe tener entre 2 y 5 caracteres").isLength({
      min: 2,
      max: 5,
    }),
    check("nombre_division", "El nombre de la división es obligatorio")
      .not()
      .isEmpty(),
    check(
      "nombre_division",
      "El nombre debe tener máximo 100 caracteres"
    ).isLength({ max: 100 }),
    check("descripcion", "La descripción debe tener máximo 500 caracteres")
      .optional()
      .isLength({ max: 500 }),
    validarCampos,
  ],
  guardarTraduccionDivision
);

/**
 * POST /api/traducciones/roles/:id
 * Crear o actualizar traducción de rol
 */
router.post(
  "/roles/:id",
  [
    validarJWT,
    validarPermiso("TRADUCCIONES_EDITAR", "ADMIN"),
    check("id", "El ID debe ser numérico").isNumeric(),
    check("idioma", "El código de idioma es obligatorio").not().isEmpty(),
    check("idioma", "El código debe tener entre 2 y 5 caracteres").isLength({
      min: 2,
      max: 5,
    }),
    check("descripcion", "La descripción es obligatoria").not().isEmpty(),
    check("descripcion", "La descripción debe tener máximo 255 caracteres")
      .optional()
      .isLength({ max: 255 }),
    validarCampos,
  ],
  guardarTraduccionRol
);

/**
 * POST /api/traducciones/permisos/:id
 * Crear o actualizar traducción de permiso
 */
router.post(
  "/permisos/:id",
  [
    validarJWT,
    validarPermiso("TRADUCCIONES_EDITAR", "ADMIN"),
    check("id", "El ID debe ser numérico").isNumeric(),
    check("idioma", "El código de idioma es obligatorio").not().isEmpty(),
    check("idioma", "El código debe tener entre 2 y 5 caracteres").isLength({
      min: 2,
      max: 5,
    }),
    check("descripcion", "La descripción es obligatoria").not().isEmpty(),
    check("descripcion", "La descripción debe tener máximo 255 caracteres")
      .optional()
      .isLength({ max: 255 }),
    validarCampos,
  ],
  guardarTraduccionPermiso
);

/**
 * POST /api/traducciones/menus/:id
 * Crear o actualizar traducción de menú
 */
router.post(
  "/menus/:id",
  [
    validarJWT,
    validarPermiso("TRADUCCIONES_EDITAR", "ADMIN"),
    check("id", "El ID debe ser numérico").isNumeric(),
    check("idioma", "El código de idioma es obligatorio").not().isEmpty(),
    check("idioma", "El código debe tener entre 2 y 5 caracteres").isLength({
      min: 2,
      max: 5,
    }),
    check("nombre", "El nombre es obligatorio").not().isEmpty(),
    check("nombre", "El nombre debe tener máximo 100 caracteres").isLength({
      max: 100,
    }),
    check("descripcion", "La descripción debe tener máximo 255 caracteres")
      .optional()
      .isLength({ max: 255 }),
    validarCampos,
  ],
  guardarTraduccionMenu
);

/**
 * DELETE /api/traducciones/:tabla/:id/:idioma
 * Eliminar traducción de un registro
 */
router.delete(
  "/:tabla/:id/:idioma",
  [
    validarJWT,
    validarPermiso("TRADUCCIONES_ELIMINAR", "ADMIN"),
    check("tabla", "La tabla es obligatoria")
      .not()
      .isEmpty()
      .isIn([
        "paises",
        "divisiones",
        "roles",
        "permisos",
        "menus",
        "continentes",
      ])
      .withMessage("Tabla no válida"),
    check("id", "El ID debe ser numérico").isNumeric(),
    check("idioma", "El código de idioma es obligatorio").not().isEmpty(),
    check("idioma", "El código debe tener entre 2 y 5 caracteres").isLength({
      min: 2,
      max: 5,
    }),
    validarCampos,
  ],
  eliminarTraduccion
);

module.exports = router;
