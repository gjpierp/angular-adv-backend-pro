const pool = require("../database/config");

class Traduccion {
  /**
   * Obtener todos los idiomas disponibles
   */
  static async obtenerIdiomas() {
    try {
      const [rows] = await pool.query(
        `SELECT id_idioma, codigo_iso, nombre_nativo, nombre_ingles, 
                activo, por_defecto, orden
         FROM idiomas 
         WHERE activo = TRUE
         ORDER BY orden ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener idioma por código ISO
   */
  static async obtenerIdiomaPorCodigo(codigoIso) {
    try {
      const [rows] = await pool.query(
        `SELECT id_idioma, codigo_iso, nombre_nativo, nombre_ingles, 
                activo, por_defecto, orden
         FROM idiomas 
         WHERE codigo_iso = ? AND activo = TRUE`,
        [codigoIso]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener idioma por defecto
   */
  static async obtenerIdiomaDefecto() {
    try {
      const [rows] = await pool.query(
        `SELECT id_idioma, codigo_iso, nombre_nativo, nombre_ingles
         FROM idiomas 
         WHERE por_defecto = TRUE 
         LIMIT 1`
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener todos los mensajes del sistema en un idioma
   */
  static async obtenerMensajes(codigoIdioma = "es") {
    try {
      const [rows] = await pool.query(
        `SELECT tm.clave, tm.categoria, tmv.texto
         FROM traducciones_mensajes tm
         INNER JOIN traducciones_mensajes_valores tmv ON tm.id_mensaje = tmv.id_mensaje
         INNER JOIN idiomas i ON tmv.id_idioma = i.id_idioma
         WHERE i.codigo_iso = ? AND i.activo = TRUE
         ORDER BY tm.categoria, tm.clave`,
        [codigoIdioma]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener países traducidos
   */
  static async obtenerPaisesTraducidos(codigoIdioma = "es", filtros = {}) {
    try {
      let query = `
        SELECT 
          p.id_pais,
          p.nombre_pais AS nombre_original,
          ? AS idioma,
          COALESCE(tp.nombre_pais, p.nombre_pais) AS nombre_traducido,
          COALESCE(tp.nombre_oficial, p.nombre_pais) AS nombre_oficial,
          COALESCE(tp.capital, p.capital) AS capital,
          tp.gentilicio,
          p.codigo_iso_alpha2,
          p.codigo_iso_alpha3,
          p.id_continente,
          p.activo
        FROM paises p
        LEFT JOIN traducciones_paises tp ON p.id_pais = tp.id_pais 
          AND tp.id_idioma = (SELECT id_idioma FROM idiomas WHERE codigo_iso = ? LIMIT 1)
        WHERE p.activo = TRUE
      `;

      const params = [codigoIdioma, codigoIdioma];

      if (filtros.id_continente) {
        query += ` AND p.id_continente = ?`;
        params.push(filtros.id_continente);
      }

      query += ` ORDER BY nombre_traducido ASC`;

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener divisiones administrativas traducidas
   */
  static async obtenerDivisionesTraducidas(codigoIdioma = "es", filtros = {}) {
    try {
      let query = `
        SELECT 
          d.id_division,
          d.nombre_division AS nombre_original,
          ? AS idioma,
          COALESCE(td.nombre_division, d.nombre_division) AS nombre_traducido,
          td.descripcion,
          d.codigo_division,
          d.id_pais,
          d.id_tipo_division,
          d.nivel,
          d.id_division_padre,
          d.activo
        FROM divisiones_administrativas d
        LEFT JOIN traducciones_divisiones td ON d.id_division = td.id_division 
          AND td.id_idioma = (SELECT id_idioma FROM idiomas WHERE codigo_iso = ? LIMIT 1)
        WHERE d.activo = TRUE
      `;

      const params = [codigoIdioma, codigoIdioma];

      if (filtros.id_pais) {
        query += ` AND d.id_pais = ?`;
        params.push(filtros.id_pais);
      }

      if (filtros.nivel) {
        query += ` AND d.nivel = ?`;
        params.push(filtros.nivel);
      }

      if (filtros.id_division_padre) {
        query += ` AND d.id_division_padre = ?`;
        params.push(filtros.id_division_padre);
      }

      query += ` ORDER BY nombre_traducido ASC`;

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener continentes traducidos
   */
  static async obtenerContinentesTraducidos(codigoIdioma = "es") {
    try {
      const [rows] = await pool.query(
        `SELECT 
          c.id_continente,
          c.nombre_continente AS nombre_original,
          ? AS idioma,
          COALESCE(tc.nombre_continente, c.nombre_continente) AS nombre_traducido
        FROM continentes c
        LEFT JOIN traducciones_continentes tc ON c.id_continente = tc.id_continente 
          AND tc.id_idioma = (SELECT id_idioma FROM idiomas WHERE codigo_iso = ? LIMIT 1)
        ORDER BY nombre_traducido ASC`,
        [codigoIdioma, codigoIdioma]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Guardar o actualizar traducción de país
   */
  static async guardarTraduccionPais(
    idPais,
    idIdioma,
    nombrePais,
    nombreOficial,
    capital,
    gentilicio
  ) {
    try {
      const [result] = await pool.query(
        `INSERT INTO traducciones_paises 
         (id_pais, id_idioma, nombre_pais, nombre_oficial, capital, gentilicio)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           nombre_pais = VALUES(nombre_pais),
           nombre_oficial = VALUES(nombre_oficial),
           capital = VALUES(capital),
           gentilicio = VALUES(gentilicio),
           fecha_actualizacion = CURRENT_TIMESTAMP`,
        [idPais, idIdioma, nombrePais, nombreOficial, capital, gentilicio]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Guardar o actualizar traducción de división administrativa
   */
  static async guardarTraduccionDivision(
    idDivision,
    idIdioma,
    nombreDivision,
    descripcion
  ) {
    try {
      const [result] = await pool.query(
        `INSERT INTO traducciones_divisiones 
         (id_division, id_idioma, nombre_division, descripcion)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           nombre_division = VALUES(nombre_division),
           descripcion = VALUES(descripcion),
           fecha_actualizacion = CURRENT_TIMESTAMP`,
        [idDivision, idIdioma, nombreDivision, descripcion]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Guardar o actualizar traducción de rol
   */
  static async guardarTraduccionRol(idRol, idIdioma, descripcion) {
    try {
      const [result] = await pool.query(
        `INSERT INTO traducciones_roles 
         (id_rol, id_idioma, descripcion)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           descripcion = VALUES(descripcion),
           fecha_actualizacion = CURRENT_TIMESTAMP`,
        [idRol, idIdioma, descripcion]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Guardar o actualizar traducción de permiso
   */
  static async guardarTraduccionPermiso(idPermiso, idIdioma, descripcion) {
    try {
      const [result] = await pool.query(
        `INSERT INTO traducciones_permisos 
         (id_permiso, id_idioma, descripcion)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           descripcion = VALUES(descripcion),
           fecha_actualizacion = CURRENT_TIMESTAMP`,
        [idPermiso, idIdioma, descripcion]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Guardar o actualizar traducción de menú
   */
  static async guardarTraduccionMenu(idMenu, idIdioma, nombre, descripcion) {
    try {
      const [result] = await pool.query(
        `INSERT INTO traducciones_menus 
         (id_menu, id_idioma, nombre, descripcion)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           nombre = VALUES(nombre),
           descripcion = VALUES(descripcion),
           fecha_actualizacion = CURRENT_TIMESTAMP`,
        [idMenu, idIdioma, nombre, descripcion]
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar traducción genérica
   */
  static async eliminarTraduccion(tabla, idRegistro, codigoIdioma) {
    try {
      let queryTabla;
      let campoId;

      switch (tabla) {
        case "paises":
          queryTabla = "traducciones_paises";
          campoId = "id_pais";
          break;
        case "divisiones":
          queryTabla = "traducciones_divisiones";
          campoId = "id_division";
          break;
        case "roles":
          queryTabla = "traducciones_roles";
          campoId = "id_rol";
          break;
        case "permisos":
          queryTabla = "traducciones_permisos";
          campoId = "id_permiso";
          break;
        case "menus":
          queryTabla = "traducciones_menus";
          campoId = "id_menu";
          break;
        case "continentes":
          queryTabla = "traducciones_continentes";
          campoId = "id_continente";
          break;
        default:
          throw new Error(`Tabla no soportada: ${tabla}`);
      }

      const [result] = await pool.query(
        `DELETE FROM ${queryTabla} 
         WHERE ${campoId} = ? 
           AND id_idioma = (SELECT id_idioma FROM idiomas WHERE codigo_iso = ? LIMIT 1)`,
        [idRegistro, codigoIdioma]
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener traducciones de un registro específico
   */
  static async obtenerTraduccionesRegistro(tabla, idRegistro) {
    try {
      let queryTabla;
      let campoId;
      let camposSelect;

      switch (tabla) {
        case "paises":
          queryTabla = "traducciones_paises";
          campoId = "id_pais";
          camposSelect = "nombre_pais, nombre_oficial, capital, gentilicio";
          break;
        case "divisiones":
          queryTabla = "traducciones_divisiones";
          campoId = "id_division";
          camposSelect = "nombre_division, descripcion";
          break;
        case "roles":
          queryTabla = "traducciones_roles";
          campoId = "id_rol";
          camposSelect = "descripcion";
          break;
        case "permisos":
          queryTabla = "traducciones_permisos";
          campoId = "id_permiso";
          camposSelect = "descripcion";
          break;
        case "menus":
          queryTabla = "traducciones_menus";
          campoId = "id_menu";
          camposSelect = "nombre, descripcion";
          break;
        case "continentes":
          queryTabla = "traducciones_continentes";
          campoId = "id_continente";
          camposSelect = "nombre_continente";
          break;
        default:
          throw new Error(`Tabla no soportada: ${tabla}`);
      }

      const [rows] = await pool.query(
        `SELECT i.codigo_iso AS idioma, i.nombre_nativo AS nombre_idioma, 
                t.${camposSelect}
         FROM ${queryTabla} t
         INNER JOIN idiomas i ON t.id_idioma = i.id_idioma
         WHERE t.${campoId} = ? AND i.activo = TRUE
         ORDER BY i.orden`,
        [idRegistro]
      );

      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener roles con traducciones
   */
  static async obtenerRolesTraducidos(codigoIdioma = "es") {
    try {
      const [rows] = await pool.query(
        `SELECT 
          r.id_rol,
          r.nombre,
          COALESCE(tr.descripcion, r.descripcion) AS descripcion,
          r.activo
        FROM roles r
        LEFT JOIN traducciones_roles tr ON r.id_rol = tr.id_rol 
          AND tr.id_idioma = (SELECT id_idioma FROM idiomas WHERE codigo_iso = ? LIMIT 1)
        WHERE r.activo = TRUE
        ORDER BY r.nombre ASC`,
        [codigoIdioma]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener permisos con traducciones
   */
  static async obtenerPermisosTraducidos(codigoIdioma = "es") {
    try {
      const [rows] = await pool.query(
        `SELECT 
          p.id_permiso,
          p.codigo,
          COALESCE(tp.descripcion, p.descripcion) AS descripcion,
          p.activo
        FROM permisos p
        LEFT JOIN traducciones_permisos tp ON p.id_permiso = tp.id_permiso 
          AND tp.id_idioma = (SELECT id_idioma FROM idiomas WHERE codigo_iso = ? LIMIT 1)
        WHERE p.activo = TRUE
        ORDER BY p.codigo ASC`,
        [codigoIdioma]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener menús con traducciones
   */
  static async obtenerMenusTraducidos(codigoIdioma = "es") {
    try {
      const [rows] = await pool.query(
        `SELECT 
          m.id_menu,
          COALESCE(tm.nombre, m.nombre) AS nombre,
          COALESCE(tm.descripcion, m.descripcion) AS descripcion,
          m.ruta,
          m.icono,
          m.nivel,
          m.orden,
          m.visible,
          m.id_menu_padre,
          m.activo
        FROM menus m
        LEFT JOIN traducciones_menus tm ON m.id_menu = tm.id_menu 
          AND tm.id_idioma = (SELECT id_idioma FROM idiomas WHERE codigo_iso = ? LIMIT 1)
        WHERE m.activo = TRUE
        ORDER BY m.nivel, m.orden ASC`,
        [codigoIdioma]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Traduccion;
