const HistorialAcciones = require("../models/historial-acciones");

const registrarAccion = async (
  idUsuario,
  accion,
  entidad,
  idEntidad = null,
  descripcion = null,
  req = null
) => {
  try {
    const ipOrigen = req
      ? req.headers["x-forwarded-for"] || req.connection.remoteAddress
      : null;

    await HistorialAcciones.registrar({
      id_usuario: idUsuario,
      accion,
      entidad,
      id_entidad: idEntidad,
      descripcion,
      ip_origen: ipOrigen,
    });
  } catch (error) {
    // No lanzar error para no afectar la operación principal
    console.error("Error al registrar acción:", error);
  }
};

// Middleware para registrar acciones automáticamente
const middlewareRegistrarAccion = (accion, entidad) => {
  return async (req, res, next) => {
    // Guardar el método send original
    const originalSend = res.send;

    // Sobrescribir el método send
    res.send = function (data) {
      // Intentar parsear la respuesta si es JSON
      let responseData;
      try {
        responseData = typeof data === "string" ? JSON.parse(data) : data;
      } catch (e) {
        responseData = data;
      }

      // Si la respuesta es exitosa, registrar la acción
      if (responseData && responseData.ok) {
        const idUsuario = req.uid;
        const idEntidad =
          req.params.id ||
          responseData.id_usuario ||
          responseData.id_rol ||
          responseData.id_permiso ||
          responseData.id_menu;
        const descripcion = `${accion} en ${entidad}`;

        registrarAccion(
          idUsuario,
          accion,
          entidad,
          idEntidad,
          descripcion,
          req
        );
      }

      // Llamar al método send original
      return originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  registrarAccion,
  middlewareRegistrarAccion,
};
