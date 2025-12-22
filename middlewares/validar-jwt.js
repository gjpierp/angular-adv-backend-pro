const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");

const validarJWT = (req, res, next) => {
  const token = req.header("x-token");

  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({
      ok: false,
      msg: "No hay token en la petición",
    });
  }

  try {
    const { uid, email } = jwt.verify(token, process.env.JWT_SECRET);
    req.uid = uid;
    req.email = email;

    next();
  } catch (error) {
    console.log("Error validando JWT:", error.message);
    return res.status(401).json({
      ok: false,
      msg: "Token no válido",
    });
  }
};

const validarAdminRole = async (req, res, next) => {
  const uid = req.uid;
  try {
    const usuarioResult = await Usuario.obtenerPorId(uid);

    if (!usuarioResult || usuarioResult.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Usuario no existe",
      });
    }

    const usuarioDB = usuarioResult[0];

    if (usuarioDB.role !== "ADMIN_ROLE") {
      return res.status(403).json({
        ok: false,
        msg: "No tiene privilegios para hacer eso",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: "Hable con el administrador",
    });
  }
};

const validarAdminRole_O_MismoUsuario = async (req, res, next) => {
  const uid = req.uid;
  const id = req.params.id;
  try {
    const usuarioResult = await Usuario.obtenerPorId(uid);

    if (!usuarioResult || usuarioResult.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Usuario no existe",
      });
    }

    const usuarioDB = usuarioResult[0];

    if (usuarioDB.role === "ADMIN_ROLE" || uid == id) {
      next();
    } else {
      return res.status(403).json({
        ok: false,
        msg: "No tiene privilegios para hacer eso",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: "Hable con el administrador",
    });
  }
};

module.exports = {
  validarJWT,
  validarAdminRole,
  validarAdminRole_O_MismoUsuario,
};
