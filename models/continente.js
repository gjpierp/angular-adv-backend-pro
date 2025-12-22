const pool = require("../database/config");

class Continente {
  static async obtenerTodos() {
    const [rows] = await pool.query(
      `SELECT * FROM continentes 
       ORDER BY nombre_continente`
    );
    return rows;
  }

  static async obtenerPorId(id) {
    const [rows] = await pool.query(
      "SELECT * FROM continentes WHERE id_continente = ?",
      [id]
    );
    return rows[0];
  }

  static async obtenerPorCodigo(codigo) {
    const [rows] = await pool.query(
      "SELECT * FROM continentes WHERE codigo_continente = ?",
      [codigo]
    );
    return rows[0];
  }

  static async crear(continente) {
    const { nombre_continente, codigo_continente } = continente;
    const [result] = await pool.query(
      `INSERT INTO continentes (nombre_continente, codigo_continente) 
       VALUES (?, ?)`,
      [nombre_continente, codigo_continente]
    );
    return result;
  }

  static async actualizar(id, continente) {
    const { nombre_continente, codigo_continente } = continente;
    const [result] = await pool.query(
      `UPDATE continentes 
       SET nombre_continente = ?, codigo_continente = ?
       WHERE id_continente = ?`,
      [nombre_continente, codigo_continente, id]
    );
    return result;
  }

  static async eliminar(id) {
    const [result] = await pool.query(
      "DELETE FROM continentes WHERE id_continente = ?",
      [id]
    );
    return result;
  }

  static async obtenerPaisesDelContinente(id) {
    const [rows] = await pool.query(
      `SELECT * FROM paises 
       WHERE id_continente = ? AND activo = TRUE
       ORDER BY nombre_pais`,
      [id]
    );
    return rows;
  }
}

module.exports = Continente;
