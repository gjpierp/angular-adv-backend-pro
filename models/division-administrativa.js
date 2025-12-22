const pool = require("../database/config");

class DivisionAdministrativa {
  static async obtenerTodos(filtros = {}) {
    let query = `
      SELECT d.*, p.nombre_pais, td.nombre_tipo,
             padre.nombre_division AS division_padre
      FROM divisiones_administrativas d
      INNER JOIN paises p ON d.id_pais = p.id_pais
      INNER JOIN tipos_division_administrativa td ON d.id_tipo_division = td.id_tipo_division
      LEFT JOIN divisiones_administrativas padre ON d.id_division_padre = padre.id_division
      WHERE 1=1
    `;
    const params = [];

    if (filtros.id_pais) {
      query += " AND d.id_pais = ?";
      params.push(filtros.id_pais);
    }

    if (filtros.nivel) {
      query += " AND d.nivel = ?";
      params.push(filtros.nivel);
    }

    if (filtros.id_division_padre !== undefined) {
      if (filtros.id_division_padre === null) {
        query += " AND d.id_division_padre IS NULL";
      } else {
        query += " AND d.id_division_padre = ?";
        params.push(filtros.id_division_padre);
      }
    }

    if (filtros.activo !== undefined) {
      query += " AND d.activo = ?";
      params.push(filtros.activo);
    }

    query += " ORDER BY d.nombre_division";

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async obtenerPorId(id) {
    const [rows] = await pool.query(
      `SELECT d.*, p.nombre_pais, p.codigo_iso_alpha2, 
              c.nombre_continente, td.nombre_tipo,
              padre.nombre_division AS division_padre,
              padre.codigo_division AS codigo_padre
       FROM divisiones_administrativas d
       INNER JOIN paises p ON d.id_pais = p.id_pais
       INNER JOIN continentes c ON p.id_continente = c.id_continente
       INNER JOIN tipos_division_administrativa td ON d.id_tipo_division = td.id_tipo_division
       LEFT JOIN divisiones_administrativas padre ON d.id_division_padre = padre.id_division
       WHERE d.id_division = ?`,
      [id]
    );
    return rows[0];
  }

  static async obtenerPorCodigo(codigo, idPais) {
    const [rows] = await pool.query(
      `SELECT d.*, p.nombre_pais, td.nombre_tipo
       FROM divisiones_administrativas d
       INNER JOIN paises p ON d.id_pais = p.id_pais
       INNER JOIN tipos_division_administrativa td ON d.id_tipo_division = td.id_tipo_division
       WHERE d.codigo_division = ? AND d.id_pais = ?`,
      [codigo, idPais]
    );
    return rows[0];
  }

  static async obtenerHijos(id) {
    const [rows] = await pool.query(
      `SELECT d.*, td.nombre_tipo
       FROM divisiones_administrativas d
       INNER JOIN tipos_division_administrativa td ON d.id_tipo_division = td.id_tipo_division
       WHERE d.id_division_padre = ? AND d.activo = TRUE
       ORDER BY d.nombre_division`,
      [id]
    );
    return rows;
  }

  static async obtenerJerarquia(id) {
    const [rows] = await pool.query(
      `WITH RECURSIVE jerarquia AS (
         SELECT id_division, id_division_padre, nombre_division, 
                codigo_division, nivel, 1 as profundidad
         FROM divisiones_administrativas
         WHERE id_division = ?
         
         UNION ALL
         
         SELECT d.id_division, d.id_division_padre, d.nombre_division,
                d.codigo_division, d.nivel, j.profundidad + 1
         FROM divisiones_administrativas d
         INNER JOIN jerarquia j ON d.id_division_padre = j.id_division
       )
       SELECT * FROM jerarquia ORDER BY profundidad`,
      [id]
    );
    return rows;
  }

  static async obtenerRutaCompleta(id) {
    const [rows] = await pool.query(
      `WITH RECURSIVE ruta AS (
         SELECT id_division, id_division_padre, nombre_division, 
                codigo_division, nivel
         FROM divisiones_administrativas
         WHERE id_division = ?
         
         UNION ALL
         
         SELECT d.id_division, d.id_division_padre, d.nombre_division,
                d.codigo_division, d.nivel
         FROM divisiones_administrativas d
         INNER JOIN ruta r ON d.id_division = r.id_division_padre
       )
       SELECT * FROM ruta ORDER BY nivel`,
      [id]
    );
    return rows;
  }

  static async buscarPorNombre(nombre, idPais = null) {
    let query = `
      SELECT d.*, p.nombre_pais, td.nombre_tipo
      FROM divisiones_administrativas d
      INNER JOIN paises p ON d.id_pais = p.id_pais
      INNER JOIN tipos_division_administrativa td ON d.id_tipo_division = td.id_tipo_division
      WHERE d.nombre_division LIKE ? AND d.activo = TRUE
    `;
    const params = [`%${nombre}%`];

    if (idPais) {
      query += " AND d.id_pais = ?";
      params.push(idPais);
    }

    query += " ORDER BY d.nombre_division LIMIT 50";

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async crear(division) {
    const {
      id_pais,
      id_tipo_division,
      id_division_padre,
      nombre_division,
      codigo_division,
      nivel,
      poblacion,
      superficie_km2,
      latitud,
      longitud,
    } = division;

    const [result] = await pool.query(
      `INSERT INTO divisiones_administrativas 
       (id_pais, id_tipo_division, id_division_padre, nombre_division, 
        codigo_division, nivel, poblacion, superficie_km2, latitud, longitud) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_pais,
        id_tipo_division,
        id_division_padre,
        nombre_division,
        codigo_division,
        nivel,
        poblacion,
        superficie_km2,
        latitud,
        longitud,
      ]
    );
    return result;
  }

  static async actualizar(id, division) {
    const {
      id_tipo_division,
      id_division_padre,
      nombre_division,
      codigo_division,
      nivel,
      poblacion,
      superficie_km2,
      latitud,
      longitud,
      activo,
    } = division;

    const [result] = await pool.query(
      `UPDATE divisiones_administrativas 
       SET id_tipo_division = ?, id_division_padre = ?, nombre_division = ?, 
           codigo_division = ?, nivel = ?, poblacion = ?, superficie_km2 = ?, 
           latitud = ?, longitud = ?, activo = ?
       WHERE id_division = ?`,
      [
        id_tipo_division,
        id_division_padre,
        nombre_division,
        codigo_division,
        nivel,
        poblacion,
        superficie_km2,
        latitud,
        longitud,
        activo,
        id,
      ]
    );
    return result;
  }

  static async activarDesactivar(id, activo) {
    const [result] = await pool.query(
      "UPDATE divisiones_administrativas SET activo = ? WHERE id_division = ?",
      [activo, id]
    );
    return result;
  }

  static async eliminar(id) {
    const [result] = await pool.query(
      "DELETE FROM divisiones_administrativas WHERE id_division = ?",
      [id]
    );
    return result;
  }

  static async obtenerEstadisticas(id) {
    const [rows] = await pool.query(
      `SELECT 
         COUNT(*) as total_subdivisiones,
         SUM(poblacion) as poblacion_total,
         SUM(superficie_km2) as superficie_total
       FROM divisiones_administrativas
       WHERE id_division_padre = ? AND activo = TRUE`,
      [id]
    );
    return rows[0];
  }
}

module.exports = DivisionAdministrativa;
