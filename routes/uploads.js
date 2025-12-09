/**
 * Ruta: /api/uploads/
 */
const { Router, express } = require("express");
const expressfileUpload = require("express-fileupload");

const { validarJWT } = require("../middlewares/validar-jwt");

const { fileUpload, retornaImagen } = require("../controllers/uploads");

const router = Router();

router.use(expressfileUpload());

router.put("/:tipo/:id", validarJWT, fileUpload);
router.get("/:tipo/:foto", validarJWT, retornaImagen);

module.exports = router;
