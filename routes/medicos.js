/**
 * Rutas: /api/hospitales
 */
const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos } = require("../middlewares/validar-campos");
const { validarJWT } = require("../middlewares/validar-jwt");

const {
  getMedicos: getMedicos,
  crearMedico: crearMedico,
  actualizarMedico: actualizarMedico,
  borrarMedico: borrarMedico,
} = require("../controllers/medicos");

const router = Router();

router.get("/", validarJWT, getMedicos);

router.post(
  "/",
  [
    validarJWT,
    check("nombre", "El nombre del medico es obligatorio").not().isEmpty(),
    check("hospital", "El hospital id debe ser válido").not().isMongoId(),
    validarCampos,
  ],
  crearMedico
);

router.put("/:id", [], actualizarMedico);

router.delete("/:id", validarJWT, borrarMedico);

module.exports = router;
