require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { dbConnection } = require("./database/config");

// Crear el servidor Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS
app.use(cors());

// Directorio público
app.use(express.static("public"));

// Lectura y parseo del body
app.use(express.json());

// Conectar a la base de datos
dbConnection();

// Rutas
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/hospitales", require("./routes/hospitales"));
app.use("/api/medicos", require("./routes/medicos"));
app.use("/api/todo", require("./routes/busquedas"));
app.use("/api/login", require("./routes/auth"));
app.use("/api/upload", require("./routes/uploads"));

app.listen(PORT, () => {
  console.log("Servidor iniciado en el puerto " + PORT);
});
