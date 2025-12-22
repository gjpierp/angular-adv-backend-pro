/*
    Ruta: /api/usuarios
*/
const { Router } = require("express");
const { check } = require("express-validator");
const { validarCampos } = require("../middlewares/validar-campos");
const { validarPaginacion } = require("../middlewares/validar-inputs");

const {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  borrarUsuario,
  cambiarContrasena,
  resetearContrasena,
} = require("../controllers/usuarios");
const {
  asignarRoles,
  obtenerRolesUsuario,
  obtenerPermisosUsuario,
} = require("../controllers/usuarios-roles");
const {
  validarJWT,
  validarAdminRole,
  validarAdminRole_O_MismoUsuario,
} = require("../middlewares/validar-jwt");

const router = Router();

router.get("/", [validarJWT, validarPaginacion], getUsuarios);

router.post(
  "/",
  [
    check("nombre_usuario", "El nombre de usuario es obligatorio")
      .not()
      .isEmpty(),
    check(
      "nombre_usuario",
      "El nombre de usuario debe tener entre 3 y 50 caracteres"
    ).isLength({ min: 3, max: 50 }),
    check("contrasena", "La contraseña es obligatoria").not().isEmpty(),
    check(
      "contrasena",
      "La contraseña debe tener al menos 6 caracteres"
    ).isLength({ min: 6 }),
    check("correo_electronico", "El correo electrónico es obligatorio")
      .not()
      .isEmpty(),
    check(
      "correo_electronico",
      "El correo electrónico debe ser válido"
    ).isEmail(),
    check("nombres", "Los nombres son obligatorios").not().isEmpty(),
    check(
      "nombres",
      "Los nombres deben tener entre 2 y 100 caracteres"
    ).isLength({ min: 2, max: 100 }),
    check("apellidos", "Los apellidos son obligatorios").not().isEmpty(),
    check(
      "apellidos",
      "Los apellidos deben tener entre 2 y 100 caracteres"
    ).isLength({ min: 2, max: 100 }),
    validarCampos,
  ],
  crearUsuario
);

router.put(
  "/:id",
  [
    validarJWT,
    validarAdminRole_O_MismoUsuario,
    check("id", "No es un ID válido").isNumeric(),
    check(
      "nombre_usuario",
      "El nombre de usuario debe tener entre 3 y 50 caracteres"
    )
      .optional()
      .isLength({ min: 3, max: 50 }),
    check("correo_electronico", "El correo electrónico debe ser válido")
      .optional()
      .isEmail(),
    check("nombres", "Los nombres deben tener entre 2 y 100 caracteres")
      .optional()
      .isLength({ min: 2, max: 100 }),
    check("apellidos", "Los apellidos deben tener entre 2 y 100 caracteres")
      .optional()
      .isLength({ min: 2, max: 100 }),
    validarCampos,
  ],
  actualizarUsuario
);

router.delete(
  "/:id",
  [
    validarJWT,
    validarAdminRole,
    check("id", "No es un ID válido").isNumeric(),
    validarCampos,
  ],
  borrarUsuario
);

// Rutas para gestión de roles de usuario
router.post(
  "/:id/roles",
  [
    validarJWT,
    validarAdminRole,
    check("id", "No es un ID válido").isNumeric(),
    check("roles", "Los roles deben ser un array").isArray(),
    validarCampos,
  ],
  asignarRoles
);

router.get(
  "/:id/roles",
  [validarJWT, check("id", "No es un ID válido").isNumeric(), validarCampos],
  obtenerRolesUsuario
);

router.get(
  "/:id/permisos",
  [validarJWT, check("id", "No es un ID válido").isNumeric(), validarCampos],
  obtenerPermisosUsuario
);

// PUT /api/usuarios/:id/cambiar-contrasena - Cambiar contraseña
router.put(
  "/:id/cambiar-contrasena",
  [
    validarJWT,
    validarAdminRole_O_MismoUsuario,
    check("id", "No es un ID válido").isNumeric(),
    check("contrasena_actual", "La contraseña actual es obligatoria")
      .not()
      .isEmpty(),
    check("contrasena_nueva", "La contraseña nueva es obligatoria")
      .not()
      .isEmpty(),
    check(
      "contrasena_nueva",
      "La contraseña nueva debe tener al menos 6 caracteres"
    ).isLength({ min: 6 }),
    validarCampos,
  ],
  cambiarContrasena
);

// PUT /api/usuarios/:id/resetear-contrasena - Resetear contraseña (solo admin)
router.put(
  "/:id/resetear-contrasena",
  [
    validarJWT,
    validarAdminRole,
    check("id", "No es un ID válido").isNumeric(),
    check("contrasena_nueva", "La contraseña nueva es obligatoria")
      .not()
      .isEmpty(),
    check(
      "contrasena_nueva",
      "La contraseña nueva debe tener al menos 6 caracteres"
    ).isLength({ min: 6 }),
    validarCampos,
  ],
  resetearContrasena
);

module.exports = router;
