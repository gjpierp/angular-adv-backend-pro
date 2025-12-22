const { response } = require("express");
const bcrypt = require("bcryptjs");

const Usuario = require("../models/usuario");
const { generarJWT } = require("../helpers/jwt");
const { googleVerify } = require("../helpers/google-verify");
const { facebookVerify } = require("../helpers/facebook-verify");
const { getMenuFrontend } = require("../helpers/menu-frontend");
const {
  obtenerMensaje: obtenerMensajeTraduccido,
} = require("../helpers/traducciones");

const login = async (req, res = response) => {
  const { correo_electronico, contrasena } = req.body;
  const idioma = req.idioma?.codigo || "es";

  try {
    const usuarioDB = await Usuario.obtenerPorCorreo(correo_electronico);
    if (!usuarioDB) {
      const msgError = await obtenerMensajeTraduccido(
        "AUTH_EMAIL_NOT_FOUND",
        idioma
      );
      return res.status(404).json({
        ok: false,
        msg: msgError || "Email no encontrado",
      });
    }

    const validPassword = bcrypt.compareSync(contrasena, usuarioDB.contrasena);
    if (!validPassword) {
      const msgError = await obtenerMensajeTraduccido(
        "AUTH_INVALID_PASSWORD",
        idioma
      );
      return res.status(400).json({
        ok: false,
        msg: msgError || "Contraseña no válida",
      });
    }

    // Actualizar último acceso
    await Usuario.actualizarUltimoAcceso(usuarioDB.id_usuario);

    console.log("Generating JWT for user ID:", usuarioDB.id_usuario);
    const token = await generarJWT(usuarioDB.id_usuario, correo_electronico);

    const msgSuccess = await obtenerMensajeTraduccido(
      "AUTH_LOGIN_SUCCESS",
      idioma
    );

    res.json({
      ok: true,
      token,
      menu: getMenuFrontend(usuarioDB.role),
      msg: msgSuccess || "Inicio de sesión exitoso",
    });
  } catch (error) {
    console.error("Error en login:", error);
    const msgError = await obtenerMensajeTraduccido(
      "AUTH_SERVER_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error en el servidor",
    });
  }
};

const googleSignIn = async (req, res = response) => {
  const googleToken = req.body.token;
  const idioma = req.idioma?.codigo || "es";

  if (!googleToken) {
    const msgError = await obtenerMensajeTraduccido(
      "AUTH_GOOGLE_TOKEN_REQUIRED",
      idioma
    );
    return res.status(400).json({
      ok: false,
      msg: msgError || "Token de Google no proporcionado",
    });
  }

  try {
    const { name, email, picture } = await googleVerify(googleToken);

    if (!email) {
      const msgError = await obtenerMensajeTraduccido(
        "AUTH_GOOGLE_EMAIL_ERROR",
        idioma
      );
      return res.status(400).json({
        ok: false,
        msg: msgError || "No se pudo obtener el email de Google",
      });
    }

    const usuarioDB = await Usuario.obtenerPorCorreo(email);

    let usuarioId;
    let usuarioData;

    if (!usuarioDB) {
      // Crear nuevo usuario de Google
      const nuevoUsuario = {
        nombre_usuario: email.split("@")[0],
        nombres: name || "Usuario",
        apellidos: "Google",
        correo_electronico: email,
        contrasena: "@@@",
        img: picture || null,
        google: true,
      };

      const resultado = await Usuario.crear(nuevoUsuario);
      usuarioId = resultado.insertId;

      // Actualizar último acceso
      await Usuario.actualizarUltimoAcceso(usuarioId);

      usuarioData = {
        id_usuario: usuarioId,
        ...nuevoUsuario,
        contrasena: undefined,
      };
    } else {
      usuarioId = usuarioDB.id_usuario;

      // Actualizar que es usuario de Google si no lo era
      if (!usuarioDB.google) {
        await Usuario.actualizar(usuarioId, {
          google: true,
          img: picture || usuarioDB.img,
        });
      }

      // Actualizar último acceso
      await Usuario.actualizarUltimoAcceso(usuarioId);

      usuarioData = {
        ...usuarioDB,
        contrasena: undefined,
      };
    }

    const token = await generarJWT(usuarioId, email);

    const msgSuccess = await obtenerMensajeTraduccido(
      "AUTH_GOOGLE_SUCCESS",
      idioma
    );

    res.json({
      ok: true,
      token,
      usuario: usuarioData,
      menu: getMenuFrontend(usuarioData.role || "USER_ROLE"),
      msg: msgSuccess || "Inicio de sesión con Google exitoso",
    });
  } catch (error) {
    console.error("Error en googleSignIn:", error);
    const msgError = await obtenerMensajeTraduccido(
      "AUTH_GOOGLE_INVALID_TOKEN",
      idioma
    );
    res.status(401).json({
      ok: false,
      msg: msgError || "Token de Google no válido o expirado",
      error: error.message,
    });
  }
};

const facebookSignIn = async (req, res = response) => {
  const accessToken = req.body.accessToken;
  const idioma = req.idioma?.codigo || "es";

  if (!accessToken) {
    const msgError = await obtenerMensajeTraduccido(
      "AUTH_FACEBOOK_TOKEN_REQUIRED",
      idioma
    );
    return res.status(400).json({
      ok: false,
      msg: msgError || "Token de Facebook no proporcionado",
    });
  }

  try {
    const { name, email, picture, facebookId } = await facebookVerify(
      accessToken
    );

    if (!email) {
      const msgError = await obtenerMensajeTraduccido(
        "AUTH_FACEBOOK_EMAIL_ERROR",
        idioma
      );
      return res.status(400).json({
        ok: false,
        msg:
          msgError ||
          "No se pudo obtener el email de Facebook. Asegúrate de dar permiso de email.",
      });
    }

    const usuarioDB = await Usuario.obtenerPorCorreo(email);

    let usuarioId;
    let usuarioData;

    if (!usuarioDB) {
      // Crear nuevo usuario de Facebook
      const nuevoUsuario = {
        nombre_usuario: email.split("@")[0],
        nombres: name || "Usuario",
        apellidos: "Facebook",
        correo_electronico: email,
        contrasena: "@@@",
        img: picture || null,
        facebook: true,
      };

      const resultado = await Usuario.crear(nuevoUsuario);
      usuarioId = resultado.insertId;

      // Actualizar último acceso
      await Usuario.actualizarUltimoAcceso(usuarioId);

      usuarioData = {
        id_usuario: usuarioId,
        ...nuevoUsuario,
        contrasena: undefined,
      };
    } else {
      usuarioId = usuarioDB.id_usuario;

      // Actualizar que es usuario de Facebook si no lo era
      if (!usuarioDB.facebook) {
        await Usuario.actualizar(usuarioId, {
          facebook: true,
          img: picture || usuarioDB.img,
        });
      }

      // Actualizar último acceso
      await Usuario.actualizarUltimoAcceso(usuarioId);

      usuarioData = {
        ...usuarioDB,
        contrasena: undefined,
      };
    }

    const token = await generarJWT(usuarioId, email);

    const msgSuccess = await obtenerMensajeTraduccido(
      "AUTH_FACEBOOK_SUCCESS",
      idioma
    );

    res.json({
      ok: true,
      token,
      usuario: usuarioData,
      menu: getMenuFrontend(usuarioData.role || "USER_ROLE"),
      msg: msgSuccess || "Inicio de sesión con Facebook exitoso",
    });
  } catch (error) {
    console.error("Error en facebookSignIn:", error);
    const msgError = await obtenerMensajeTraduccido(
      "AUTH_FACEBOOK_INVALID_TOKEN",
      idioma
    );
    res.status(401).json({
      ok: false,
      msg: msgError || "Token de Facebook no válido o expirado",
      error: error.message,
    });
  }
};

const renewToken = async (req, res = response) => {
  const uid = req.uid;
  const idioma = req.idioma?.codigo || "es";
  console.log("Renew token for UID:", uid);

  try {
    // Obtener el usuario por UID
    const usuarioResult = await Usuario.obtenerPorId(uid);

    if (!usuarioResult || usuarioResult.length === 0) {
      const msgError = await obtenerMensajeTraduccido(
        "AUTH_USER_NOT_FOUND",
        idioma
      );
      return res.status(404).json({
        ok: false,
        msg: msgError || "Usuario no encontrado",
      });
    }

    const usuario = usuarioResult[0];

    // Generar un nuevo JWT
    const token = await generarJWT(uid, usuario.correo_electronico);

    const msgSuccess = await obtenerMensajeTraduccido(
      "AUTH_TOKEN_RENEWED",
      idioma
    );

    res.json({
      ok: true,
      token,
      usuario,
      menu: getMenuFrontend(usuario.role || "USER_ROLE"),
      msg: msgSuccess || "Token renovado exitosamente",
    });
  } catch (error) {
    console.error("Error renovando token:", error);
    const msgError = await obtenerMensajeTraduccido(
      "AUTH_SERVER_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error renovando el token",
    });
  }
};

module.exports = {
  login,
  googleSignIn,
  facebookSignIn,
  renewToken,
};
