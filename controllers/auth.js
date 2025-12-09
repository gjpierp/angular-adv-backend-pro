const { response } = require("express");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/usuario");
const { generarJWT } = require("../helpers/jwt");
const { googleVerify } = require("../helpers/google-verify");

const login = async (req, res = response) => {
  const { email, password } = req.body;
  try {
    // Verificar si el email existe
    const usuarioDB = await Usuario.findOne({ email });
    if (!usuarioDB) {
      return res.status(404).json({
        ok: false,
        msg: "Hable con el administrador",
      });
    }

    // Verificar contraseña
    const validPassword = bcrypt.compareSync(password, usuarioDB.password);
    if (!validPassword) {
      return res.status(400).json({
        ok: false,
        msg: "Hable con el administrador",
      });
    }

    // Generar JWT
    const token = await generarJWT(usuarioDB.id);

    res.json({
      ok: true,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: "Hable con el administrador",
    });
  }
};

const googleSignIn = async (req, res = response) => {
  try {
    const { token } = req.body;
    const { email, name, picture } = await googleVerify(token);
    const usuarioDB = await Usuario.findOne({ email });
    let usuario;
    if (!usuarioDB) {
      // Si el usuario no existe, hay que crearlo
      usuario = new Usuario({
        nombre: name,
        email,
        password: "@@@",
        img: picture,
        google: true,
      });
    } else {
      // Existe el usuario
      usuario = usuarioDB;
      usuario.google = true;
      usuario.img = picture;
    }

    // Guardar en BD
    await usuario.save();

    // Generar JWT
    const jwt = await generarJWT(usuario.id);
    res.json({
      ok: true,
      email,
      name,
      picture,
      jwt,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      ok: false,
      msg: "Token de google no es correcto",
    });
  }
};

module.exports = {
  login,
  googleSignIn,
};
