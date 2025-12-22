const { response } = require("express");
const bcrypt = require("bcryptjs");

const Usuario = require("../models/usuario");
const { generarJWT } = require("../helpers/jwt");
const {
  obtenerMensaje: obtenerMensajeTraduccido,
} = require("../helpers/traducciones");

const getUsuarios = async (req, res) => {
  const desde = Number(req.query.desde) || 0;
  const limite = 5;
  const idioma = req.idioma?.codigo || "es";

  try {
    // Calcular la página basada en 'desde'
    const pagina = Math.floor(desde / limite) + 1;

    const [usuarios, total] = await Promise.all([
      Usuario.listar(pagina, limite),
      Usuario.contar(),
    ]);

    res.json({
      ok: true,
      usuarios,
      total,
    });
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido("USER_GET_ERROR", idioma);
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al obtener usuarios",
    });
  }
};

const listarUsuarios = async (req, res) => {
  const pagina = Number(req.query.desde) || 0;
  const limite = Number(req.query.desde) || 0;
  try {
    const results = await Usuario.listar(pagina, limite);
    res.status(200).send(results);
  } catch (err) {
    res.status(500).send(err);
  }
};

const crearUsuario = async (req, res = response) => {
  const { correo_electronico, contrasena } = req.body;
  const idioma = req.idioma?.codigo || "es";

  try {
    const existeEmail = await Usuario.obtenerPorCorreo(correo_electronico);

    if (existeEmail) {
      const msgError = await obtenerMensajeTraduccido(
        "USER_EMAIL_EXISTS",
        idioma
      );
      return res.status(400).json({
        ok: false,
        msg: msgError || "El correo ya está registrado",
      });
    }

    // Encriptar contraseña
    const salt = bcrypt.genSaltSync();
    const contrasenaHash = bcrypt.hashSync(contrasena, salt);

    const usuarioData = {
      ...req.body,
      contrasena: contrasenaHash,
    };

    // Guardar usuario
    const resultado = await Usuario.crear(usuarioData);

    // Generar el TOKEN - JWT
    const token = await generarJWT(resultado.insertId, correo_electronico);

    const msgSuccess = await obtenerMensajeTraduccido("USER_CREATED", idioma);

    res.json({
      ok: true,
      usuario: {
        id_usuario: resultado.insertId,
        ...req.body,
        contrasena: undefined,
      },
      token,
      msg: msgSuccess || "Usuario creado exitosamente",
    });
  } catch (error) {
    console.log(error);
    const msgError = await obtenerMensajeTraduccido(
      "USER_SERVER_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error inesperado... revisar logs",
    });
  }
};

const actualizarUsuario = async (req, res = response) => {
  const uid = req.params.id;
  const idioma = req.idioma?.codigo || "es";

  try {
    const usuarioDB = await Usuario.obtenerPorId(uid);

    if (!usuarioDB || usuarioDB.length === 0) {
      const msgError = await obtenerMensajeTraduccido("USER_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "No existe un usuario por ese id",
      });
    }

    const usuario = usuarioDB[0];

    // Actualizaciones
    const { contrasena, correo_electronico, ...campos } = req.body;

    // Construir objeto de actualización con los campos actuales
    const datosActualizacion = {
      nombre_usuario: campos.nombre_usuario || usuario.nombre_usuario,
      nombres: campos.nombres || usuario.nombres,
      apellidos: campos.apellidos || usuario.apellidos,
      correo_electronico: usuario.correo_electronico,
    };

    if (
      correo_electronico &&
      usuario.correo_electronico !== correo_electronico
    ) {
      const existeEmail = await Usuario.obtenerPorCorreo(correo_electronico);
      if (existeEmail) {
        const msgError = await obtenerMensajeTraduccido(
          "USER_EMAIL_EXISTS",
          idioma
        );
        return res.status(400).json({
          ok: false,
          msg: msgError || "Ya existe un usuario con ese email",
        });
      }
      datosActualizacion.correo_electronico = correo_electronico;
    }

    // Actualizar usuario
    await Usuario.actualizar(uid, datosActualizacion);

    const usuarioActualizado = await Usuario.obtenerPorId(uid);

    const msgSuccess = await obtenerMensajeTraduccido("USER_UPDATED", idioma);

    res.json({
      ok: true,
      usuario: usuarioActualizado[0],
      msg: msgSuccess || "Usuario actualizado exitosamente",
    });
  } catch (error) {
    console.log(error);
    const msgError = await obtenerMensajeTraduccido(
      "USER_SERVER_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error inesperado",
    });
  }
};

const borrarUsuario = async (req, res = response) => {
  const uid = req.params.id;
  const idioma = req.idioma?.codigo || "es";

  try {
    const usuarioDB = await Usuario.obtenerPorId(uid);

    if (!usuarioDB || usuarioDB.length === 0) {
      const msgError = await obtenerMensajeTraduccido("USER_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "No existe un usuario por ese id",
      });
    }

    await Usuario.eliminar(uid);

    const msgSuccess = await obtenerMensajeTraduccido("USER_DELETED", idioma);

    res.json({
      ok: true,
      msg: msgSuccess || "Usuario eliminado",
    });
  } catch (error) {
    console.log(error);
    const msgError = await obtenerMensajeTraduccido(
      "USER_SERVER_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Hable con el administrador",
    });
  }
};

const cambiarContrasena = async (req, res = response) => {
  const uid = req.params.id;
  const { contrasena_actual, contrasena_nueva } = req.body;
  const idioma = req.idioma?.codigo || "es";

  try {
    // Verificar que el usuario existe
    const usuarioDB = await Usuario.obtenerPorId(uid);

    if (!usuarioDB || usuarioDB.length === 0) {
      const msgError = await obtenerMensajeTraduccido("USER_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "Usuario no encontrado",
      });
    }

    const usuario = usuarioDB[0];

    // Si el usuario autenticado no es el mismo ni es admin, denegar
    if (req.uid !== parseInt(uid)) {
      // Verificar si es admin
      const esAdmin = await Usuario.tieneRol(req.uid, "ADMIN");
      if (!esAdmin) {
        const msgError = await obtenerMensajeTraduccido(
          "USER_NO_PERMISSION",
          idioma
        );
        return res.status(403).json({
          ok: false,
          msg:
            msgError ||
            "No tiene permisos para cambiar la contraseña de otro usuario",
        });
      }
    }

    // Obtener IP y User-Agent
    const ipOrigen =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Cambiar contraseña
    await Usuario.cambiarContrasena(
      uid,
      contrasena_actual,
      contrasena_nueva,
      "CAMBIO_USUARIO",
      ipOrigen,
      userAgent
    );

    const msgSuccess = await obtenerMensajeTraduccido(
      "USER_PASSWORD_CHANGED",
      idioma
    );

    res.json({
      ok: true,
      msg: msgSuccess || "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error(error);

    if (error.message === "La contraseña actual es incorrecta") {
      const msgError = await obtenerMensajeTraduccido(
        "USER_INVALID_CURRENT_PASSWORD",
        idioma
      );
      return res.status(400).json({
        ok: false,
        msg: msgError || error.message,
      });
    }

    const msgError = await obtenerMensajeTraduccido(
      "USER_PASSWORD_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al cambiar contraseña",
    });
  }
};

const resetearContrasena = async (req, res = response) => {
  const uid = req.params.id;
  const { contrasena_nueva } = req.body;
  const idioma = req.idioma?.codigo || "es";

  try {
    // Verificar que el usuario existe
    const usuarioDB = await Usuario.obtenerPorId(uid);

    if (!usuarioDB || usuarioDB.length === 0) {
      const msgError = await obtenerMensajeTraduccido("USER_NOT_FOUND", idioma);
      return res.status(404).json({
        ok: false,
        msg: msgError || "Usuario no encontrado",
      });
    }

    // Obtener IP y User-Agent
    const ipOrigen =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Resetear contraseña (sin validar la actual)
    const salt = bcrypt.genSaltSync();
    const nuevaContrasenaHash = bcrypt.hashSync(contrasena_nueva, salt);

    const connection = await Usuario.obtenerConexion();
    try {
      await connection.beginTransaction();

      // Registrar en historial
      await connection.query(
        "INSERT INTO historial_contrasenas (id_usuario, contrasena, motivo, ip_origen, user_agent) VALUES (?, ?, ?, ?, ?)",
        [uid, nuevaContrasenaHash, "RESET_ADMIN", ipOrigen, userAgent]
      );

      // Actualizar contraseña
      await connection.query(
        "UPDATE usuarios SET contrasena = ?, fecha_cambio_contraseña = NOW() WHERE id_usuario = ?",
        [nuevaContrasenaHash, uid]
      );

      await connection.commit();
      connection.release();

      const msgSuccess = await obtenerMensajeTraduccido(
        "USER_PASSWORD_RESET",
        idioma
      );

      res.json({
        ok: true,
        msg: msgSuccess || "Contraseña reseteada exitosamente",
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error(error);
    const msgError = await obtenerMensajeTraduccido(
      "USER_PASSWORD_RESET_ERROR",
      idioma
    );
    res.status(500).json({
      ok: false,
      msg: msgError || "Error al resetear contraseña",
    });
  }
};

module.exports = {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  borrarUsuario,
  listarUsuarios,
  cambiarContrasena,
  resetearContrasena,
};
