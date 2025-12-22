const pool = require("../database/config");

class Pais {
  static async obtenerTodos(activo = null) {
    let query = `
      SELECT p.*, c.nombre_continente, c.codigo_continente
      FROM paises p
      INNER JOIN continentes c ON p.id_continente = c.id_continente
    `;
    const params = [];

    if (activo !== null) {
      query += " WHERE p.activo = ?";
      params.push(activo);
    }

    query += " ORDER BY p.nombre_pais";

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async obtenerPorId(id) {
    const [rows] = await pool.query(
      `SELECT p.*, c.nombre_continente, c.codigo_continente
       FROM paises p
       INNER JOIN continentes c ON p.id_continente = c.id_continente
       WHERE p.id_pais = ?`,
      [id]
    );
    return rows[0];
  }

  static async obtenerPorCodigo(codigo) {
    const [rows] = await pool.query(
      `SELECT p.*, c.nombre_continente, c.codigo_continente
       FROM paises p
       INNER JOIN continentes c ON p.id_continente = c.id_continente
       WHERE p.codigo_iso_alpha2 = ? OR p.codigo_iso_alpha3 = ?`,
      [codigo, codigo]
    );
    return rows[0];
  }

  static async obtenerPorContinente(idContinente) {
    const [rows] = await pool.query(
      `SELECT * FROM paises 
       WHERE id_continente = ? AND activo = TRUE
       ORDER BY nombre_pais`,
      [idContinente]
    );
    return rows;
  }

  static async crear(pais) {
    const {
      id_continente,
      nombre_pais,
      codigo_iso_alpha2,
      codigo_iso_alpha3,
      codigo_numerico,
      capital,
      idioma_oficial,
      moneda,
    } = pais;

    const [result] = await pool.query(
      `INSERT INTO paises 
       (id_continente, nombre_pais, codigo_iso_alpha2, codigo_iso_alpha3, 
        codigo_numerico, capital, idioma_oficial, moneda) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_continente,
        nombre_pais,
        codigo_iso_alpha2,
        codigo_iso_alpha3,
        codigo_numerico,
        capital,
        idioma_oficial,
        moneda,
      ]
    );
    return result;
  }

  static async actualizar(id, pais) {
    const {
      id_continente,
      nombre_pais,
      codigo_iso_alpha2,
      codigo_iso_alpha3,
      codigo_numerico,
      capital,
      idioma_oficial,
      moneda,
      activo,
    } = pais;

    const [result] = await pool.query(
      `UPDATE paises 
       SET id_continente = ?, nombre_pais = ?, codigo_iso_alpha2 = ?, 
           codigo_iso_alpha3 = ?, codigo_numerico = ?, capital = ?, 
           idioma_oficial = ?, moneda = ?, activo = ?
       WHERE id_pais = ?`,
      [
        id_continente,
        nombre_pais,
        codigo_iso_alpha2,
        codigo_iso_alpha3,
        codigo_numerico,
        capital,
        idioma_oficial,
        moneda,
        activo,
        id,
      ]
    );
    return result;
  }

  static async activarDesactivar(id, activo) {
    const [result] = await pool.query(
      "UPDATE paises SET activo = ? WHERE id_pais = ?",
      [activo, id]
    );
    return result;
  }

  static async eliminar(id) {
    const [result] = await pool.query("DELETE FROM paises WHERE id_pais = ?", [
      id,
    ]);
    return result;
  }

  static async obtenerTiposDivision(id) {
    const [rows] = await pool.query(
      `SELECT * FROM tipos_division_administrativa 
       WHERE id_pais = ?
       ORDER BY nivel`,
      [id]
    );
    return rows;
  }

  static async obtenerDivisiones(id, nivel = null) {
    let query = `
      SELECT d.*, td.nombre_tipo
      FROM divisiones_administrativas d
      INNER JOIN tipos_division_administrativa td ON d.id_tipo_division = td.id_tipo_division
      WHERE d.id_pais = ? AND d.activo = TRUE
    `;
    const params = [id];

    if (nivel !== null) {
      query += " AND d.nivel = ?";
      params.push(nivel);
    }

    query += " ORDER BY d.nombre_division";

    const [rows] = await pool.query(query, params);
    return rows;
  }
}

module.exports = Pais;
