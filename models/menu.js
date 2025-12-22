const dbConnection = require("../database/config");

class Menu {
  static async crear(datos) {
    const {
      nombre,
      descripcion,
      ruta,
      icono,
      nivel,
      orden,
      visible,
      id_menu_padre,
    } = datos;
    const [result] = await dbConnection.query(
      `INSERT INTO menus (nombre, descripcion, ruta, icono, nivel, orden, visible, id_menu_padre)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        descripcion,
        ruta,
        icono,
        nivel,
        orden || 0,
        visible !== false ? 1 : 0,
        id_menu_padre,
      ]
    );
    return result.insertId;
  }

  static async obtenerPorId(id) {
    const [rows] = await dbConnection.query(
      "SELECT * FROM menus WHERE id_menu = ?",
      [id]
    );
    return rows[0];
  }

  static async actualizar(id, datos) {
    const {
      nombre,
      descripcion,
      ruta,
      icono,
      nivel,
      orden,
      visible,
      id_menu_padre,
    } = datos;
    const [result] = await dbConnection.query(
      `UPDATE menus SET nombre = ?, descripcion = ?, ruta = ?, icono = ?, 
             nivel = ?, orden = ?, visible = ?, id_menu_padre = ?
             WHERE id_menu = ?`,
      [
        nombre,
        descripcion,
        ruta,
        icono,
        nivel,
        orden,
        visible ? 1 : 0,
        id_menu_padre,
        id,
      ]
    );
    return result.affectedRows > 0;
  }

  static async eliminar(id) {
    const [result] = await dbConnection.query(
      "DELETE FROM menus WHERE id_menu = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  static async listar() {
    const [rows] = await dbConnection.query(
      "SELECT * FROM menus ORDER BY nivel, orden, nombre"
    );
    return rows;
  }

  // Obtener menús jerárquicos (con sus hijos)
  static async obtenerJerarquia(idMenuPadre = null) {
    const [rows] = await dbConnection.query(
      `SELECT * FROM menus 
             WHERE ${
               idMenuPadre ? "id_menu_padre = ?" : "id_menu_padre IS NULL"
             }
             ORDER BY orden, nombre`,
      idMenuPadre ? [idMenuPadre] : []
    );
    return rows;
  }

  // Construir árbol completo de menús
  static async construirArbol() {
    const [rows] = await dbConnection.query(
      "SELECT * FROM menus ORDER BY nivel, orden, nombre"
    );

    const menuMap = {};
    const raices = [];

    // Crear mapa de menús
    rows.forEach((menu) => {
      menuMap[menu.id_menu] = { ...menu, hijos: [] };
    });

    // Construir árbol
    rows.forEach((menu) => {
      if (menu.id_menu_padre) {
        if (menuMap[menu.id_menu_padre]) {
          menuMap[menu.id_menu_padre].hijos.push(menuMap[menu.id_menu]);
        }
      } else {
        raices.push(menuMap[menu.id_menu]);
      }
    });

    return raices;
  }

  // Obtener menús para un usuario específico
  static async obtenerMenusUsuario(idUsuario) {
    const [rows] = await dbConnection.query(
      `SELECT DISTINCT m.* FROM menus m
             LEFT JOIN menu_usuario mu ON m.id_menu = mu.id_menu AND mu.id_usuario = ?
             LEFT JOIN menu_permiso mp ON m.id_menu = mp.id_menu
             LEFT JOIN rol_permiso rp ON mp.id_permiso = rp.id_permiso
             LEFT JOIN usuario_rol ur ON rp.id_rol = ur.id_rol AND ur.id_usuario = ?
             WHERE m.visible = 1 
             AND (
                 mu.id_usuario IS NOT NULL AND mu.permitido = 1
                 OR mp.id_permiso IS NULL
                 OR rp.id_rol IS NOT NULL
             )
             ORDER BY m.nivel, m.orden, m.nombre`,
      [idUsuario, idUsuario]
    );
    return rows;
  }

  // Construir árbol de menús para un usuario
  static async construirArbolUsuario(idUsuario) {
    const menus = await this.obtenerMenusUsuario(idUsuario);

    const menuMap = {};
    const raices = [];

    // Crear mapa de menús
    menus.forEach((menu) => {
      menuMap[menu.id_menu] = { ...menu, hijos: [] };
    });

    // Construir árbol
    menus.forEach((menu) => {
      if (menu.id_menu_padre) {
        if (menuMap[menu.id_menu_padre]) {
          menuMap[menu.id_menu_padre].hijos.push(menuMap[menu.id_menu]);
        }
      } else {
        raices.push(menuMap[menu.id_menu]);
      }
    });

    return raices;
  }

  // Gestión de permisos del menú
  static async asignarPermiso(idMenu, idPermiso) {
    const [result] = await dbConnection.query(
      "INSERT INTO menu_permiso (id_menu, id_permiso) VALUES (?, ?)",
      [idMenu, idPermiso]
    );
    return result.affectedRows > 0;
  }

  static async removerPermiso(idMenu, idPermiso) {
    const [result] = await dbConnection.query(
      "DELETE FROM menu_permiso WHERE id_menu = ? AND id_permiso = ?",
      [idMenu, idPermiso]
    );
    return result.affectedRows > 0;
  }

  static async obtenerPermisos(idMenu) {
    const [rows] = await dbConnection.query(
      `SELECT p.* FROM permisos p
             INNER JOIN menu_permiso mp ON p.id_permiso = mp.id_permiso
             WHERE mp.id_menu = ?
             ORDER BY p.codigo`,
      [idMenu]
    );
    return rows;
  }

  // Gestión de acceso directo de usuario a menú
  static async asignarUsuario(idMenu, idUsuario, permitido = true) {
    const [result] = await dbConnection.query(
      "INSERT INTO menu_usuario (id_menu, id_usuario, permitido) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE permitido = ?",
      [idMenu, idUsuario, permitido ? 1 : 0, permitido ? 1 : 0]
    );
    return result.affectedRows > 0;
  }

  static async removerUsuario(idMenu, idUsuario) {
    const [result] = await dbConnection.query(
      "DELETE FROM menu_usuario WHERE id_menu = ? AND id_usuario = ?",
      [idMenu, idUsuario]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Menu;
