const { response } = require("express");

/**
 * Middleware para sanitizar y validar inputs para prevenir inyecciones SQL
 */
const sanitizarInputs = (req, res = response, next) => {
  // Sanitizar body
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === "string") {
        // Remover caracteres peligrosos pero mantener UTF-8
        req.body[key] = req.body[key].trim();
      }
    }
  }

  // Sanitizar query params
  if (req.query) {
    for (let key in req.query) {
      if (typeof req.query[key] === "string") {
        req.query[key] = req.query[key].trim();
      }
    }
  }

  // Sanitizar params
  if (req.params) {
    for (let key in req.params) {
      if (typeof req.params[key] === "string") {
        req.params[key] = req.params[key].trim();
      }
    }
  }

  next();
};

/**
 * Middleware para validar que los IDs numéricos sean válidos
 */
const validarIdNumerico = (campo = "id") => {
  return (req, res = response, next) => {
    const id = req.params[campo] || req.body[campo];

    if (!id) {
      return res.status(400).json({
        ok: false,
        msg: `El campo ${campo} es obligatorio`,
      });
    }

    const idNum = Number(id);
    if (isNaN(idNum) || idNum <= 0 || !Number.isInteger(idNum)) {
      return res.status(400).json({
        ok: false,
        msg: `El ${campo} debe ser un número entero positivo`,
      });
    }

    // Convertir a número para evitar problemas
    if (req.params[campo]) req.params[campo] = idNum;
    if (req.body[campo]) req.body[campo] = idNum;

    next();
  };
};

/**
 * Middleware para validar límites de paginación
 */
const validarPaginacion = (req, res = response, next) => {
  const { desde, limite } = req.query;

  if (desde !== undefined) {
    const desdeNum = Number(desde);
    if (isNaN(desdeNum) || desdeNum < 0) {
      return res.status(400).json({
        ok: false,
        msg: "El parámetro 'desde' debe ser un número mayor o igual a 0",
      });
    }
    req.query.desde = desdeNum;
  }

  if (limite !== undefined) {
    const limiteNum = Number(limite);
    if (isNaN(limiteNum) || limiteNum <= 0 || limiteNum > 100) {
      return res.status(400).json({
        ok: false,
        msg: "El parámetro 'limite' debe ser un número entre 1 y 100",
      });
    }
    req.query.limite = limiteNum;
  }

  next();
};

/**
 * Middleware para prevenir ataques de denegación de servicio con archivos grandes
 */
const validarTamanoBody = (maxSizeKB = 1024) => {
  return (req, res = response, next) => {
    const contentLength = req.headers["content-length"];

    if (contentLength && parseInt(contentLength) > maxSizeKB * 1024) {
      return res.status(413).json({
        ok: false,
        msg: `El tamaño de la petición excede el límite de ${maxSizeKB}KB`,
      });
    }

    next();
  };
};

module.exports = {
  sanitizarInputs,
  validarIdNumerico,
  validarPaginacion,
  validarTamanoBody,
};
