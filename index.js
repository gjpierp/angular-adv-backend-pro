require("dotenv").config();
const path = require("path");

const express = require("express");
const cors = require("cors");

const dbConnection = require("./database/config");
const {
  sanitizarInputs,
  validarTamanoBody,
} = require("./middlewares/validar-inputs");
const {
  manejadorErrores,
  rutaNoEncontrada,
} = require("./middlewares/manejador-errores");
const { capturarIdioma } = require("./middlewares/gestionar-idioma");

// Crear el servidor de express
const app = express();

// Configurar CORS
app.use(cors());

// Protección contra payloads muy grandes
app.use(validarTamanoBody(2048)); // 2MB máximo

// Lectura y parseo del body
app.use(express.json());

// Sanitizar inputs
app.use(sanitizarInputs);

// Capturar idioma del request
app.use(capturarIdioma);

// Base de datos
// La conexión ya se establece al importar el módulo

// Directorio público
app.use(express.static("public"));

// Rutas
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/roles", require("./routes/roles"));
app.use("/api/permisos", require("./routes/permisos"));
app.use("/api/menus", require("./routes/menus"));
app.use("/api/todo", require("./routes/busquedas"));
app.use("/api/login", require("./routes/auth"));
app.use("/api/upload", require("./routes/uploads"));
app.use("/api/territorios", require("./routes/territorios"));
app.use("/api/traducciones", require("./routes/traducciones"));

// Ruta catch-all para SPA
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "/public/index.html"));
});

// Manejador de rutas no encontradas (debe ir después de todas las rutas)
app.use(rutaNoEncontrada);

// Manejador global de errores (debe ser el último middleware)
app.use(manejadorErrores);

app.listen(process.env.PORT, () => {
  console.log("Servidor corriendo en puerto " + process.env.PORT);
});
