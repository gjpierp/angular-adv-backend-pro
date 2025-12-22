const dbConnection = require("../database/config");

class Permiso {
  static async crear(codigo, descripcion) {
    const [result] = await dbConnection.query(
      "INSERT INTO permisos (codigo, descripcion) VALUES (?, ?)",
      [codigo, descripcion]
    );
    return result.insertId;
  }

  static async obtenerPorId(id) {
    const [rows] = await dbConnection.query(
      "SELECT * FROM permisos WHERE id_permiso = ?",
      [id]
    );
    return rows[0];
  }

  static async obtenerPorCodigo(codigo) {
    const [rows] = await dbConnection.query(
      "SELECT * FROM permisos WHERE codigo = ?",
      [codigo]
    );
    return rows[0];
  }

  static async actualizar(id, codigo, descripcion) {
    const [result] = await dbConnection.query(
      "UPDATE permisos SET codigo = ?, descripcion = ? WHERE id_permiso = ?",
      [codigo, descripcion, id]
    );
    return result.affectedRows > 0;
  }

  static async eliminar(id) {
    const [result] = await dbConnection.query(
      "DELETE FROM permisos WHERE id_permiso = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  static async listar(desde = 0, limite = 5) {
    const [rows] = await dbConnection.query(
      "SELECT * FROM permisos ORDER BY codigo LIMIT ?, ?",
      [desde, limite]
    );
    return rows;
  }

  static async contar() {
    const [rows] = await dbConnection.query(
      "SELECT COUNT(*) as total FROM permisos"
    );
    return rows[0].total;
  }

  // Métodos para gestionar roles que tienen este permiso
  static async obtenerRoles(idPermiso) {
    const [rows] = await dbConnection.query(
      `SELECT r.* FROM roles r
             INNER JOIN rol_permiso rp ON r.id_rol = rp.id_rol
             WHERE rp.id_permiso = ?
             ORDER BY r.nombre`,
      [idPermiso]
    );
    return rows;
  }

  // Métodos para gestionar menús que requieren este permiso
  static async asignarMenu(idPermiso, idMenu) {
    const [result] = await dbConnection.query(
      "INSERT INTO menu_permiso (id_menu, id_permiso) VALUES (?, ?)",
      [idMenu, idPermiso]
    );
    return result.affectedRows > 0;
  }

  static async removerMenu(idPermiso, idMenu) {
    const [result] = await dbConnection.query(
      "DELETE FROM menu_permiso WHERE id_menu = ? AND id_permiso = ?",
      [idMenu, idPermiso]
    );
    return result.affectedRows > 0;
  }

  static async obtenerMenus(idPermiso) {
    const [rows] = await dbConnection.query(
      `SELECT m.* FROM menus m
             INNER JOIN menu_permiso mp ON m.id_menu = mp.id_menu
             WHERE mp.id_permiso = ?
             ORDER BY m.nivel, m.orden`,
      [idPermiso]
    );
    return rows;
  }
}

module.exports = Permiso;
