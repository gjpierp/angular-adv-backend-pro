const dbConnection = require("../database/config");
const bcrypt = require("bcryptjs");

class Usuario {
  // Métodos de gestión de roles
  static async asignarRol(idUsuario, idRol) {
    const [result] = await dbConnection.query(
      "INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)",
      [idUsuario, idRol]
    );
    return result.affectedRows > 0;
  }

  static async removerRol(idUsuario, idRol) {
    const [result] = await dbConnection.query(
      "DELETE FROM usuario_rol WHERE id_usuario = ? AND id_rol = ?",
      [idUsuario, idRol]
    );
    return result.affectedRows > 0;
  }

  static async obtenerRoles(idUsuario) {
    const [rows] = await dbConnection.query(
      `SELECT r.* FROM roles r
       INNER JOIN usuario_rol ur ON r.id_rol = ur.id_rol
       WHERE ur.id_usuario = ?
       ORDER BY r.nombre`,
      [idUsuario]
    );
    return rows;
  }

  static async sincronizarRoles(idUsuario, idsRoles) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // Eliminar roles actuales
      await connection.query("DELETE FROM usuario_rol WHERE id_usuario = ?", [
        idUsuario,
      ]);

      // Insertar nuevos roles
      if (idsRoles && idsRoles.length > 0) {
        const values = idsRoles.map((idRol) => [idUsuario, idRol]);
        await connection.query(
          "INSERT INTO usuario_rol (id_usuario, id_rol) VALUES ?",
          [values]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async obtenerPermisos(idUsuario) {
    const [rows] = await dbConnection.query(
      `SELECT DISTINCT p.* FROM permisos p
       INNER JOIN rol_permiso rp ON p.id_permiso = rp.id_permiso
       INNER JOIN usuario_rol ur ON rp.id_rol = ur.id_rol
       WHERE ur.id_usuario = ?
       ORDER BY p.codigo`,
      [idUsuario]
    );
    return rows;
  }

  static async tienePermiso(idUsuario, codigoPermiso) {
    const [rows] = await dbConnection.query(
      `SELECT COUNT(*) as tiene FROM permisos p
       INNER JOIN rol_permiso rp ON p.id_permiso = rp.id_permiso
       INNER JOIN usuario_rol ur ON rp.id_rol = ur.id_rol
       WHERE ur.id_usuario = ? AND p.codigo = ?`,
      [idUsuario, codigoPermiso]
    );
    return rows[0].tiene > 0;
  }

  static async tieneRol(idUsuario, nombreRol) {
    const [rows] = await dbConnection.query(
      `SELECT COUNT(*) as tiene FROM roles r
       INNER JOIN usuario_rol ur ON r.id_rol = ur.id_rol
       WHERE ur.id_usuario = ? AND r.nombre = ?`,
      [idUsuario, nombreRol]
    );
    return rows[0].tiene > 0;
  }

  static async crear(usuario) {
    const sql =
      "INSERT INTO usuarios (nombre_usuario, contrasena, correo_electronico, nombres, apellidos, google, facebook) VALUES (?, ?, ?, ?, ?, ?, ?)";

    // Solo hashear la contraseña si no es un usuario de Google o Facebook
    let contrasenaHash = usuario.contrasena;
    if (
      (!usuario.google && !usuario.facebook) ||
      usuario.contrasena !== "@@@"
    ) {
      const salt = bcrypt.genSaltSync();
      contrasenaHash = bcrypt.hashSync(usuario.contrasena, salt);
    }

    const values = [
      usuario.nombre_usuario,
      contrasenaHash,
      usuario.correo_electronico,
      usuario.nombres,
      usuario.apellidos,
      usuario.google || false,
      usuario.facebook || false,
    ];
    const [result] = await dbConnection.query(sql, values);
    return result;
  }

  static async obtenerPorId(id) {
    const sql = "SELECT * FROM usuarios WHERE id_usuario = ?";
    const [result] = await dbConnection.query(sql, [id]);
    // if (result.length === 0) {
    //   console.log("No se encontraron usuarios con ese correo.");
    //   return null; // O lanzar un error específico
    // }
    return result;
  }

  static async obtenerPorCorreo(email) {
    // console.log("Obteniendo usuario por correo:", email);
    const sql = "SELECT * FROM usuarios WHERE correo_electronico = ?";
    try {
      const [result] = await dbConnection.query(sql, [email]);
      if (result.length === 0) {
        console.log("No se encontraron usuarios con ese correo.");
        return null;
      }
      return result[0]; // Retornar el primer usuario encontrado
    } catch (error) {
      console.error("Error al obtener el usuario:", error);
      throw new Error("Error al obtener el usuario");
    }
  }

  static async actualizar(id, usuario) {
    const sql =
      "UPDATE usuarios SET nombre_usuario = ?, correo_electronico = ?, nombres = ?, apellidos = ? WHERE id_usuario = ?";
    const values = [
      usuario.nombre_usuario,
      usuario.correo_electronico,
      usuario.nombres,
      usuario.apellidos,
      id,
    ];
    await dbConnection.query(sql, values);
  }

  static async actualizarContrasena(id, nuevaContrasena) {
    const sql =
      "UPDATE usuarios SET contrasena = ?, fecha_cambio_contraseña = NOW() WHERE id_usuario = ?";
    const values = [nuevaContrasena, id];
    await dbConnection.query(sql, values);
  }

  static async cambiarContrasena(
    id,
    contrasenaActual,
    nuevaContrasena,
    motivo = "CAMBIO_USUARIO",
    ipOrigen = null,
    userAgent = null
  ) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // Obtener usuario
      const [usuarios] = await connection.query(
        "SELECT * FROM usuarios WHERE id_usuario = ?",
        [id]
      );

      if (usuarios.length === 0) {
        throw new Error("Usuario no encontrado");
      }

      const usuario = usuarios[0];

      // Verificar contraseña actual (solo si no es Google/Facebook)
      if (!usuario.google && !usuario.facebook) {
        const validPassword = bcrypt.compareSync(
          contrasenaActual,
          usuario.contrasena
        );
        if (!validPassword) {
          throw new Error("La contraseña actual es incorrecta");
        }
      }

      // Hashear nueva contraseña
      const salt = bcrypt.genSaltSync();
      const nuevaContrasenaHash = bcrypt.hashSync(nuevaContrasena, salt);

      // Registrar en historial
      await connection.query(
        "INSERT INTO historial_contrasenas (id_usuario, contrasena, motivo, ip_origen, user_agent) VALUES (?, ?, ?, ?, ?)",
        [id, nuevaContrasenaHash, motivo, ipOrigen, userAgent]
      );

      // Actualizar contraseña y fecha
      await connection.query(
        "UPDATE usuarios SET contrasena = ?, fecha_cambio_contraseña = NOW() WHERE id_usuario = ?",
        [nuevaContrasenaHash, id]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async eliminar(id) {
    const sql = "DELETE FROM usuarios WHERE id_usuario = ?";
    await dbConnection.query(sql, [id]);
  }

  static async listar() {
    const sql = "SELECT * FROM usuarios";
    const [results] = await dbConnection.query(sql);
    return results;
  }

  static async listar(pagina = 1, limite = 10) {
    const offset = (pagina - 1) * limite;
    const sql = "SELECT * FROM usuarios LIMIT ? OFFSET ?";
    const [results] = await dbConnection.query(sql, [limite, offset]);
    return results;
  }

  static async contar() {
    const sql = "SELECT COUNT(*) as total FROM usuarios";
    const [result] = await dbConnection.query(sql);
    return result[0].total;
  }

  static async actualizarUltimoAcceso(id) {
    const sql =
      "UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?";
    await dbConnection.query(sql, [id]);
  }

  static async actualizarImagen(id, img) {
    const sql = "UPDATE usuarios SET img = ? WHERE id_usuario = ?";
    await dbConnection.query(sql, [img, id]);
  }

  static async obtenerConexion() {
    return await dbConnection.getConnection();
  }
}

module.exports = Usuario;
