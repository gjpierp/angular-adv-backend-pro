const dbConnection = require("../database/config");

class HistorialAcciones {
  static async registrar(datos) {
    const { id_usuario, accion, entidad, id_entidad, descripcion, ip_origen } =
      datos;
    const [result] = await dbConnection.query(
      `INSERT INTO historial_acciones (id_usuario, accion, entidad, id_entidad, descripcion, ip_origen)
             VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario, accion, entidad, id_entidad, descripcion, ip_origen]
    );
    return result.insertId;
  }

  static async obtenerPorId(id) {
    const [rows] = await dbConnection.query(
      `SELECT ha.*, u.nombre_usuario, u.nombres, u.apellidos
             FROM historial_acciones ha
             LEFT JOIN usuarios u ON ha.id_usuario = u.id_usuario
             WHERE ha.id_historial = ?`,
      [id]
    );
    return rows[0];
  }

  static async listar(desde = 0, limite = 50, filtros = {}) {
    let query = `
            SELECT ha.*, u.nombre_usuario, u.nombres, u.apellidos
            FROM historial_acciones ha
            LEFT JOIN usuarios u ON ha.id_usuario = u.id_usuario
            WHERE 1=1
        `;
    const params = [];

    if (filtros.id_usuario) {
      query += " AND ha.id_usuario = ?";
      params.push(filtros.id_usuario);
    }

    if (filtros.accion) {
      query += " AND ha.accion = ?";
      params.push(filtros.accion);
    }

    if (filtros.entidad) {
      query += " AND ha.entidad = ?";
      params.push(filtros.entidad);
    }

    if (filtros.fecha_desde) {
      query += " AND ha.fecha_evento >= ?";
      params.push(filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query += " AND ha.fecha_evento <= ?";
      params.push(filtros.fecha_hasta);
    }

    query += " ORDER BY ha.fecha_evento DESC LIMIT ?, ?";
    params.push(desde, limite);

    const [rows] = await dbConnection.query(query, params);
    return rows;
  }

  static async contar(filtros = {}) {
    let query = "SELECT COUNT(*) as total FROM historial_acciones WHERE 1=1";
    const params = [];

    if (filtros.id_usuario) {
      query += " AND id_usuario = ?";
      params.push(filtros.id_usuario);
    }

    if (filtros.accion) {
      query += " AND accion = ?";
      params.push(filtros.accion);
    }

    if (filtros.entidad) {
      query += " AND entidad = ?";
      params.push(filtros.entidad);
    }

    if (filtros.fecha_desde) {
      query += " AND fecha_evento >= ?";
      params.push(filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query += " AND fecha_evento <= ?";
      params.push(filtros.fecha_hasta);
    }

    const [rows] = await dbConnection.query(query, params);
    return rows[0].total;
  }

  // Obtener acciones por entidad
  static async obtenerPorEntidad(entidad, idEntidad, desde = 0, limite = 20) {
    const [rows] = await dbConnection.query(
      `SELECT ha.*, u.nombre_usuario, u.nombres, u.apellidos
             FROM historial_acciones ha
             LEFT JOIN usuarios u ON ha.id_usuario = u.id_usuario
             WHERE ha.entidad = ? AND ha.id_entidad = ?
             ORDER BY ha.fecha_evento DESC
             LIMIT ?, ?`,
      [entidad, idEntidad, desde, limite]
    );
    return rows;
  }

  // Obtener acciones por usuario
  static async obtenerPorUsuario(idUsuario, desde = 0, limite = 50) {
    const [rows] = await dbConnection.query(
      `SELECT ha.*, u.nombre_usuario, u.nombres, u.apellidos
             FROM historial_acciones ha
             LEFT JOIN usuarios u ON ha.id_usuario = u.id_usuario
             WHERE ha.id_usuario = ?
             ORDER BY ha.fecha_evento DESC
             LIMIT ?, ?`,
      [idUsuario, desde, limite]
    );
    return rows;
  }

  // Estadísticas de acciones
  static async obtenerEstadisticas(filtros = {}) {
    let query = `
            SELECT 
                accion,
                COUNT(*) as total,
                COUNT(DISTINCT id_usuario) as usuarios_unicos
            FROM historial_acciones
            WHERE 1=1
        `;
    const params = [];

    if (filtros.fecha_desde) {
      query += " AND fecha_evento >= ?";
      params.push(filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query += " AND fecha_evento <= ?";
      params.push(filtros.fecha_hasta);
    }

    query += " GROUP BY accion ORDER BY total DESC";

    const [rows] = await dbConnection.query(query, params);
    return rows;
  }

  // Eliminar acciones antiguas
  static async limpiar(diasAntiguedad = 90) {
    const [result] = await dbConnection.query(
      "DELETE FROM historial_acciones WHERE fecha_evento < DATE_SUB(NOW(), INTERVAL ? DAY)",
      [diasAntiguedad]
    );
    return result.affectedRows;
  }
}

module.exports = HistorialAcciones;
