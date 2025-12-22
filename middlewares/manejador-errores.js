const { response } = require("express");

/**
 * Middleware global para manejo de errores
 * Debe ser el último middleware registrado
 */
const manejadorErrores = (err, req, res = response, next) => {
  console.error("Error capturado por manejador global:");
  console.error(err);

  // Error de validación de express-validator
  if (err.array && typeof err.array === "function") {
    return res.status(400).json({
      ok: false,
      msg: "Error de validación",
      errors: err.array(),
    });
  }

  // Error de base de datos
  if (err.code) {
    switch (err.code) {
      case "ER_DUP_ENTRY":
        return res.status(409).json({
          ok: false,
          msg: "El registro ya existe en la base de datos",
          error: err.sqlMessage,
        });

      case "ER_NO_REFERENCED_ROW_2":
      case "ER_ROW_IS_REFERENCED_2":
        return res.status(400).json({
          ok: false,
          msg: "Operación no permitida por restricciones de integridad",
          error: err.sqlMessage,
        });

      case "ER_BAD_FIELD_ERROR":
        return res.status(400).json({
          ok: false,
          msg: "Campo inválido en la consulta",
          error: err.sqlMessage,
        });

      case "ER_PARSE_ERROR":
        return res.status(500).json({
          ok: false,
          msg: "Error de sintaxis en la consulta SQL",
        });

      case "ER_ACCESS_DENIED_ERROR":
        return res.status(500).json({
          ok: false,
          msg: "Error de conexión a la base de datos",
        });

      case "ECONNREFUSED":
        return res.status(503).json({
          ok: false,
          msg: "No se puede conectar a la base de datos",
        });

      default:
        console.error("Error SQL no manejado:", err.code);
        return res.status(500).json({
          ok: false,
          msg: "Error en la base de datos",
          code: err.code,
        });
    }
  }

  // Error de JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      ok: false,
      msg: "Token inválido",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      ok: false,
      msg: "Token expirado",
    });
  }

  // Error de validación personalizado
  if (err.status) {
    return res.status(err.status).json({
      ok: false,
      msg: err.message || "Error en la petición",
    });
  }

  // Error genérico
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    ok: false,
    msg: err.message || "Error interno del servidor",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

/**
 * Middleware para rutas no encontradas
 */
const rutaNoEncontrada = (req, res = response) => {
  res.status(404).json({
    ok: false,
    msg: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
  });
};

/**
 * Wrapper para funciones async para capturar errores automáticamente
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  manejadorErrores,
  rutaNoEncontrada,
  asyncHandler,
};
