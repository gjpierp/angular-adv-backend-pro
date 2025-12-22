/*
    Path: '/api/login'
*/
const { Router } = require("express");
const {
  login,
  googleSignIn,
  facebookSignIn,
  renewToken,
} = require("../controllers/auth");
const { check } = require("express-validator");
const { validarCampos } = require("../middlewares/validar-campos");
const { validarJWT } = require("../middlewares/validar-jwt");

const router = Router();

router.post(
  "/",
  [
    check(
      "correo_electronico",
      "El correo electrónico es obligatorio"
    ).isEmail(),
    check("contrasena", "La contraseña es obligatoria").not().isEmpty(),
    validarCampos,
  ],
  login
);

router.post(
  "/google",
  [
    check("token", "El token de Google es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  googleSignIn
);

router.post(
  "/facebook",
  [
    check("accessToken", "El token de acceso de Facebook es obligatorio")
      .not()
      .isEmpty(),
    validarCampos,
  ],
  facebookSignIn
);

router.get("/renew", validarJWT, renewToken);

module.exports = router;
