require("dotenv").config();
const dbConnection = require("./database/config");
const Usuario = require("./models/usuario");

async function testDatabase() {
  try {
    console.log("🔍 Probando conexión a la base de datos...");
    console.log("📋 Configuración:");
    console.log("  - Host:", process.env.DB_HOST);
    console.log("  - User:", process.env.DB_USER);
    console.log(
      "  - Password:",
      process.env.DB_PASSWORD ? "***" : "NO CONFIGURADO"
    );
    console.log("  - Database:", process.env.DB_NAME);
    console.log("");

    // Test 1: Conexión básica
    const [rows] = await dbConnection.query("SELECT 1 as test");
    console.log("✅ Conexión exitosa:", rows);

    // Test 2: Verificar si existe la tabla usuarios
    const [tables] = await dbConnection.query('SHOW TABLES LIKE "usuarios"');
    console.log("✅ Tabla usuarios existe:", tables.length > 0);

    // Test 3: Contar usuarios
    const [count] = await dbConnection.query(
      "SELECT COUNT(*) as total FROM usuarios"
    );
    console.log("📊 Total de usuarios en la BD:", count[0].total);

    // Test 4: Listar todos los usuarios
    const [usuarios] = await dbConnection.query(
      "SELECT id_usuario, nombre_usuario, correo_electronico FROM usuarios"
    );
    console.log("👥 Usuarios registrados:");
    usuarios.forEach((u) => {
      console.log(
        `  - ID: ${u.id_usuario}, Usuario: ${u.nombre_usuario}, Email: ${u.correo_electronico}`
      );
    });

    // Test 5: Buscar el usuario específico
    console.log("\n🔍 Buscando usuario con correo: gjpierp@gmail.com");
    const usuarioDB = await Usuario.obtenerPorCorreo("gjpierp@gmail.com");

    if (usuarioDB) {
      console.log("✅ Usuario encontrado:", {
        id: usuarioDB.id_usuario,
        nombre: usuarioDB.nombre_usuario,
        email: usuarioDB.correo_electronico,
        tiene_contrasena: !!usuarioDB.contrasena,
      });
    } else {
      console.log("❌ Usuario NO encontrado con ese correo");
      console.log("💡 Necesitas crear el usuario primero");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testDatabase();
