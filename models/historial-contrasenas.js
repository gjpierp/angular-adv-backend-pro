const dbConnection = require("../database/config");

class HistorialContrasenas {
  static async registrar(datos) {
    const { id_usuario, contrasena, motivo, ip_origen, user_agent } = datos;
    const [result] = await dbConnection.query(
      `INSERT INTO historial_contrasenas (id_usuario, contrasena, motivo, ip_origen, user_agent)
             VALUES (?, ?, ?, ?, ?)`,
      [id_usuario, contrasena, motivo, ip_origen, user_agent]
    );
    return result.insertId;
  }

  static async obtenerPorId(id) {
    const [rows] = await dbConnection.query(
      `SELECT hc.*, u.nombre_usuario, u.nombres, u.apellidos
             FROM historial_contrasenas hc
             LEFT JOIN usuarios u ON hc.id_usuario = u.id_usuario
             WHERE hc.id_historial = ?`,
      [id]
    );
    return rows[0];
  }

  static async obtenerPorUsuario(idUsuario, desde = 0, limite = 10) {
    const [rows] = await dbConnection.query(
      `SELECT id_historial, id_usuario, fecha_cambio, motivo, ip_origen, user_agent
             FROM historial_contrasenas
             WHERE id_usuario = ?
             ORDER BY fecha_cambio DESC
             LIMIT ?, ?`,
      [idUsuario, desde, limite]
    );
    return rows;
  }

  static async contarPorUsuario(idUsuario) {
    const [rows] = await dbConnection.query(
      "SELECT COUNT(*) as total FROM historial_contrasenas WHERE id_usuario = ?",
      [idUsuario]
    );
    return rows[0].total;
  }

  // Verificar si una contraseña fue usada anteriormente
  static async verificarContrasenaUsada(
    idUsuario,
    contrasenaHash,
    ultimasN = 5
  ) {
    const [rows] = await dbConnection.query(
      `SELECT contrasena FROM historial_contrasenas
             WHERE id_usuario = ?
             ORDER BY fecha_cambio DESC
             LIMIT ?`,
      [idUsuario, ultimasN]
    );
    return rows;
  }

  // Obtener última contraseña del usuario
  static async obtenerUltima(idUsuario) {
    const [rows] = await dbConnection.query(
      `SELECT * FROM historial_contrasenas
             WHERE id_usuario = ?
             ORDER BY fecha_cambio DESC
             LIMIT 1`,
      [idUsuario]
    );
    return rows[0];
  }

  // Estadísticas de cambios de contraseña
  static async obtenerEstadisticas(filtros = {}) {
    let query = `
            SELECT 
                motivo,
                COUNT(*) as total,
                COUNT(DISTINCT id_usuario) as usuarios_unicos
            FROM historial_contrasenas
            WHERE 1=1
        `;
    const params = [];

    if (filtros.fecha_desde) {
      query += " AND fecha_cambio >= ?";
      params.push(filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query += " AND fecha_cambio <= ?";
      params.push(filtros.fecha_hasta);
    }

    query += " GROUP BY motivo ORDER BY total DESC";

    const [rows] = await dbConnection.query(query, params);
    return rows;
  }

  // Verificar antigüedad de contraseña
  static async verificarAntiguedad(idUsuario, diasMaximos = 90) {
    const [rows] = await dbConnection.query(
      `SELECT 
                DATEDIFF(NOW(), fecha_cambio) as dias_desde_cambio,
                fecha_cambio
             FROM historial_contrasenas
             WHERE id_usuario = ?
             ORDER BY fecha_cambio DESC
             LIMIT 1`,
      [idUsuario]
    );

    if (rows.length === 0)
      return { requiere_cambio: true, dias_desde_cambio: null };

    const diasDesdeCambio = rows[0].dias_desde_cambio;
    return {
      requiere_cambio: diasDesdeCambio > diasMaximos,
      dias_desde_cambio: diasDesdeCambio,
      fecha_ultimo_cambio: rows[0].fecha_cambio,
    };
  }

  // Limpiar historial antiguo (mantener solo las últimas N por usuario)
  static async limpiar(mantenePorUsuario = 10) {
    const [result] = await dbConnection.query(
      `DELETE FROM historial_contrasenas
             WHERE id_historial NOT IN (
                 SELECT id_historial FROM (
                     SELECT id_historial
                     FROM historial_contrasenas hc
                     WHERE (
                         SELECT COUNT(*)
                         FROM historial_contrasenas hc2
                         WHERE hc2.id_usuario = hc.id_usuario
                         AND hc2.fecha_cambio >= hc.fecha_cambio
                     ) <= ?
                 ) temp
             )`,
      [mantenePorUsuario]
    );
    return result.affectedRows;
  }
}

module.exports = HistorialContrasenas;
