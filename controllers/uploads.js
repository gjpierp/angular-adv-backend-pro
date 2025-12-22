const path = require("path");
const fs = require("fs");

const { response } = require("express");
const { v4: uuidv4 } = require("uuid");
const { actualizarImagen } = require("../helpers/actualizar-imagen");
const xlsx = require("xlsx");
const csvParse = require("csv-parse/sync");
const {
  obtenerMensaje: obtenerMensajeTraduccido,
} = require("../helpers/traducciones");
// Carga masiva de archivos .csv, .xlsx, .txt
const cargaMasiva = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      const msg = await obtenerMensajeTraduccido("UPLOAD_NO_FILE", idioma);
      return res
        .status(400)
        .json({ ok: false, msg: msg || "No hay ningún archivo" });
    }
    const file = req.files.archivo;
    const nombreCortado = file.name.split(".");
    const extensionArchivo =
      nombreCortado[nombreCortado.length - 1].toLowerCase();
    if (!["csv", "xlsx", "txt"].includes(extensionArchivo)) {
      const msg = await obtenerMensajeTraduccido(
        "UPLOAD_INVALID_EXTENSION",
        idioma
      );
      return res
        .status(400)
        .json({ ok: false, msg: msg || "Extensión no permitida" });
    }
    let registros = [];
    // Guardar archivo temporalmente
    const tempPath = `./uploads/tmp-${uuidv4()}.${extensionArchivo}`;
    await file.mv(tempPath);
    try {
      if (extensionArchivo === "csv" || extensionArchivo === "txt") {
        const contenido = fs.readFileSync(tempPath, "utf8");
        registros = csvParse.parse(contenido, {
          columns: true,
          skip_empty_lines: true,
        });
      } else if (extensionArchivo === "xlsx") {
        const workbook = xlsx.readFile(tempPath);
        const hoja = workbook.Sheets[workbook.SheetNames[0]];
        registros = xlsx.utils.sheet_to_json(hoja);
      }
    } catch (err) {
      fs.unlinkSync(tempPath);
      const msg = await obtenerMensajeTraduccido("UPLOAD_PARSE_ERROR", idioma);
      return res
        .status(400)
        .json({ ok: false, msg: msg || "Error al procesar el archivo" });
    }
    fs.unlinkSync(tempPath);
    const msg = await obtenerMensajeTraduccido(
      "UPLOAD_MASSIVE_SUCCESS",
      idioma
    );
    res.json({
      ok: true,
      msg: msg || "Carga masiva exitosa",
      total: registros.length,
      registros,
    });
  } catch (error) {
    console.error(error);
    const msg = await obtenerMensajeTraduccido("UPLOAD_MASSIVE_ERROR", idioma);
    res.status(500).json({ ok: false, msg: msg || "Error en la carga masiva" });
  }
};

const fileUpload = async (req, res = response) => {
  const idioma = req.idioma?.codigo || "es";
  const tipo = req.params.tipo;
  const id = req.params.id;
  // Validar tipo
  const tiposValidos = ["hospitales", "medicos", "usuarios"];
  if (!tiposValidos.includes(tipo)) {
    const msg = await obtenerMensajeTraduccido("UPLOAD_INVALID_TYPE", idioma);
    return res.status(400).json({
      ok: false,
      msg: msg || "No es un médico, usuario u hospital (tipo)",
    });
  }
  // Validar que exista un archivo
  if (!req.files || Object.keys(req.files).length === 0) {
    const msg = await obtenerMensajeTraduccido("UPLOAD_NO_FILE", idioma);
    return res.status(400).json({
      ok: false,
      msg: msg || "No hay ningún archivo",
    });
  }
  // Procesar la imagen...
  const file = req.files.imagen;
  const nombreCortado = file.name.split(".");
  const extensionArchivo =
    nombreCortado[nombreCortado.length - 1].toLowerCase();
  // Validar extension
  const extensionesValidas = ["png", "jpg", "jpeg", "gif"];
  if (!extensionesValidas.includes(extensionArchivo)) {
    const msg = await obtenerMensajeTraduccido(
      "UPLOAD_INVALID_EXTENSION",
      idioma
    );
    return res.status(400).json({
      ok: false,
      msg: msg || "No es una extensión permitida",
    });
  }
  // Generar el nombre del archivo
  const nombreArchivo = `${uuidv4()}.${extensionArchivo}`;
  // Path para guardar la imagen
  const pathFile = `./uploads/${tipo}/${nombreArchivo}`;
  // Mover la imagen
  file.mv(pathFile, async (err) => {
    if (err) {
      console.log(err);
      const msg = await obtenerMensajeTraduccido("UPLOAD_MOVE_ERROR", idioma);
      return res.status(500).json({
        ok: false,
        msg: msg || "Error al mover la imagen",
      });
    }
    // Actualizar base de datos
    actualizarImagen(tipo, id, nombreArchivo);
    const msg = await obtenerMensajeTraduccido("UPLOAD_SUCCESS", idioma);
    res.json({
      ok: true,
      msg: msg || "Archivo subido",
      nombreArchivo,
    });
  });
};

const retornaImagen = (req, res = response) => {
  const tipo = req.params.tipo;
  const foto = req.params.foto;
  const pathImg = path.join(__dirname, `../uploads/${tipo}/${foto}`);
  if (fs.existsSync(pathImg)) {
    res.sendFile(pathImg);
  } else {
    const pathImg = path.join(__dirname, `../uploads/no-img.png`);
    res.sendFile(pathImg);
  }
};

module.exports = {
  fileUpload,
  retornaImagen,
  cargaMasiva,
};
