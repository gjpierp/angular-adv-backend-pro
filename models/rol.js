const dbConnection = require("../database/config");

class Rol {
  static async crear(nombre, descripcion) {
    const [result] = await dbConnection.query(
      "INSERT INTO roles (nombre, descripcion) VALUES (?, ?)",
      [nombre, descripcion]
    );
    return result.insertId;
  }

  static async obtenerPorId(id) {
    const [rows] = await dbConnection.query(
      "SELECT * FROM roles WHERE id_rol = ?",
      [id]
    );
    return rows[0];
  }

  static async obtenerPorNombre(nombre) {
    const [rows] = await dbConnection.query(
      "SELECT * FROM roles WHERE nombre = ?",
      [nombre]
    );
    return rows[0];
  }

  static async actualizar(id, nombre, descripcion) {
    const [result] = await dbConnection.query(
      "UPDATE roles SET nombre = ?, descripcion = ? WHERE id_rol = ?",
      [nombre, descripcion, id]
    );
    return result.affectedRows > 0;
  }

  static async eliminar(id) {
    const [result] = await dbConnection.query(
      "DELETE FROM roles WHERE id_rol = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  static async listar(desde = 0, limite = 5) {
    const [rows] = await dbConnection.query(
      "SELECT * FROM roles ORDER BY nombre LIMIT ?, ?",
      [desde, limite]
    );
    return rows;
  }

  static async contar() {
    const [rows] = await dbConnection.query(
      "SELECT COUNT(*) as total FROM roles"
    );
    return rows[0].total;
  }

  // Métodos para gestionar permisos del rol
  static async asignarPermiso(idRol, idPermiso) {
    const [result] = await dbConnection.query(
      "INSERT INTO rol_permiso (id_rol, id_permiso) VALUES (?, ?)",
      [idRol, idPermiso]
    );
    return result.affectedRows > 0;
  }

  static async removerPermiso(idRol, idPermiso) {
    const [result] = await dbConnection.query(
      "DELETE FROM rol_permiso WHERE id_rol = ? AND id_permiso = ?",
      [idRol, idPermiso]
    );
    return result.affectedRows > 0;
  }

  static async obtenerPermisos(idRol) {
    const [rows] = await dbConnection.query(
      `SELECT p.* FROM permisos p
             INNER JOIN rol_permiso rp ON p.id_permiso = rp.id_permiso
             WHERE rp.id_rol = ?
             ORDER BY p.codigo`,
      [idRol]
    );
    return rows;
  }

  static async sincronizarPermisos(idRol, idsPermisos) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // Eliminar permisos actuales
      await connection.query("DELETE FROM rol_permiso WHERE id_rol = ?", [
        idRol,
      ]);

      // Insertar nuevos permisos
      if (idsPermisos && idsPermisos.length > 0) {
        const values = idsPermisos.map((idPermiso) => [idRol, idPermiso]);
        await connection.query(
          "INSERT INTO rol_permiso (id_rol, id_permiso) VALUES ?",
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

  // Métodos para obtener usuarios del rol
  static async obtenerUsuarios(idRol) {
    const [rows] = await dbConnection.query(
      `SELECT u.* FROM usuarios u
             INNER JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
             WHERE ur.id_rol = ?
             ORDER BY u.nombre_usuario`,
      [idRol]
    );
    return rows;
  }
}

module.exports = Rol;
