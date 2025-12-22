const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos } = require("../middlewares/validar-campos");
const { validarJWT } = require("../middlewares/validar-jwt");

const {
  // Continentes
  obtenerContinentes,
  obtenerContinente,

  // Países
  obtenerPaises,
  obtenerPais,
  obtenerPaisPorCodigo,
  obtenerEstructuraPais,
  crearPais,
  actualizarPais,

  // Divisiones
  obtenerDivisiones,
  obtenerDivision,
  obtenerDivisionConHijos,
  obtenerJerarquiaDivision,
  obtenerRutaDivision,
  buscarDivisiones,
  crearDivision,
  actualizarDivision,
  eliminarDivision,
} = require("../controllers/territorios");

const router = Router();

// =====================================================
// RUTAS PÚBLICAS - CONTINENTES
// =====================================================

router.get("/continentes", obtenerContinentes);

router.get(
  "/continentes/:id",
  [check("id", "El ID debe ser numérico").isNumeric(), validarCampos],
  obtenerContinente
);

// =====================================================
// RUTAS PÚBLICAS - PAÍSES
// =====================================================

router.get("/paises", obtenerPaises);

router.get(
  "/paises/:id",
  [check("id", "El ID debe ser numérico").isNumeric(), validarCampos],
  obtenerPais
);

router.get(
  "/paises/codigo/:codigo",
  [
    check("codigo", "El código ISO es obligatorio").not().isEmpty(),
    check("codigo", "El código debe tener entre 2 y 3 caracteres").isLength({
      min: 2,
      max: 3,
    }),
    validarCampos,
  ],
  obtenerPaisPorCodigo
);

router.get(
  "/paises/:id/estructura",
  [check("id", "El ID debe ser numérico").isNumeric(), validarCampos],
  obtenerEstructuraPais
);

// =====================================================
// RUTAS PÚBLICAS - DIVISIONES ADMINISTRATIVAS
// =====================================================

router.get("/divisiones", obtenerDivisiones);

router.get(
  "/divisiones/buscar",
  [
    check("q", "El término de búsqueda es obligatorio").not().isEmpty(),
    check("q", "El término debe tener al menos 2 caracteres").isLength({
      min: 2,
    }),
    validarCampos,
  ],
  buscarDivisiones
);

router.get(
  "/divisiones/:id",
  [check("id", "El ID debe ser numérico").isNumeric(), validarCampos],
  obtenerDivision
);

router.get(
  "/divisiones/:id/completo",
  [check("id", "El ID debe ser numérico").isNumeric(), validarCampos],
  obtenerDivisionConHijos
);

router.get(
  "/divisiones/:id/jerarquia",
  [check("id", "El ID debe ser numérico").isNumeric(), validarCampos],
  obtenerJerarquiaDivision
);

router.get(
  "/divisiones/:id/ruta",
  [check("id", "El ID debe ser numérico").isNumeric(), validarCampos],
  obtenerRutaDivision
);

// =====================================================
// RUTAS PROTEGIDAS - REQUIEREN AUTENTICACIÓN
// =====================================================

// Crear país
router.post(
  "/paises",
  [
    validarJWT,
    check("id_continente", "El continente es obligatorio").isNumeric(),
    check("nombre_pais", "El nombre del país es obligatorio").not().isEmpty(),
    check("nombre_pais", "El nombre debe tener máximo 100 caracteres").isLength(
      { max: 100 }
    ),
    check("codigo_iso_alpha2", "El código ISO alpha-2 es obligatorio")
      .not()
      .isEmpty(),
    check(
      "codigo_iso_alpha2",
      "El código alpha-2 debe tener 2 caracteres"
    ).isLength({ min: 2, max: 2 }),
    check("codigo_iso_alpha3", "El código ISO alpha-3 es obligatorio")
      .not()
      .isEmpty(),
    check(
      "codigo_iso_alpha3",
      "El código alpha-3 debe tener 3 caracteres"
    ).isLength({ min: 3, max: 3 }),
    validarCampos,
  ],
  crearPais
);

// Actualizar país
router.put(
  "/paises/:id",
  [
    validarJWT,
    check("id", "El ID debe ser numérico").isNumeric(),
    check("nombre_pais", "El nombre del país es obligatorio").not().isEmpty(),
    check("nombre_pais", "El nombre debe tener máximo 100 caracteres").isLength(
      { max: 100 }
    ),
    validarCampos,
  ],
  actualizarPais
);

// Crear división administrativa
router.post(
  "/divisiones",
  [
    validarJWT,
    check("id_pais", "El país es obligatorio").isNumeric(),
    check("id_tipo_division", "El tipo de división es obligatorio").isNumeric(),
    check("nombre_division", "El nombre de la división es obligatorio")
      .not()
      .isEmpty(),
    check(
      "nombre_division",
      "El nombre debe tener máximo 100 caracteres"
    ).isLength({ max: 100 }),
    check("nivel", "El nivel es obligatorio").isNumeric(),
    check("nivel", "El nivel debe ser mayor a 0").isInt({ min: 1 }),
    check("id_division_padre", "El ID de división padre debe ser numérico")
      .optional()
      .isNumeric(),
    check("codigo_division", "El código debe tener máximo 20 caracteres")
      .optional()
      .isLength({ max: 20 }),
    validarCampos,
  ],
  crearDivision
);

// Actualizar división administrativa
router.put(
  "/divisiones/:id",
  [
    validarJWT,
    check("id", "El ID debe ser numérico").isNumeric(),
    check("nombre_division", "El nombre de la división es obligatorio")
      .not()
      .isEmpty(),
    check(
      "nombre_division",
      "El nombre debe tener máximo 100 caracteres"
    ).isLength({ max: 100 }),
    validarCampos,
  ],
  actualizarDivision
);

// Eliminar división administrativa
router.delete(
  "/divisiones/:id",
  [
    validarJWT,
    check("id", "El ID debe ser numérico").isNumeric(),
    validarCampos,
  ],
  eliminarDivision
);

module.exports = router;
