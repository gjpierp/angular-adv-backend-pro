#!/usr/bin/env node
require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");

// Colores para terminal
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

let connection;

async function conectarDB() {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
    });
    console.log(
      `${colors.green}✓ Conectado a la base de datos${colors.reset}\n`
    );
    return connection;
  } catch (error) {
    console.error(
      `${colors.red}✗ Error al conectar:${colors.reset}`,
      error.message
    );
    process.exit(1);
  }
}

async function ejecutarQuery(query) {
  try {
    const [results] = await connection.query(query);
    return results;
  } catch (error) {
    throw error;
  }
}

async function ejecutarArchivoSQL(filePath) {
  try {
    const sql = await fs.readFile(filePath, "utf-8");
    console.log(
      `${colors.cyan}📄 Ejecutando: ${path.basename(filePath)}${colors.reset}`
    );

    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    let ejecutadas = 0;
    let errores = 0;

    for (const statement of statements) {
      try {
        await connection.query(statement);
        ejecutadas++;
      } catch (error) {
        if (!error.message.includes("Duplicate entry")) {
          console.error(
            `${colors.yellow}⚠ Error:${colors.reset}`,
            error.message.substring(0, 100)
          );
          errores++;
        }
      }
    }

    console.log(
      `${colors.green}✓ Queries ejecutadas: ${ejecutadas}${colors.reset}`
    );
    if (errores > 0) {
      console.log(`${colors.yellow}⚠ Errores: ${errores}${colors.reset}`);
    }
    console.log("");
  } catch (error) {
    console.error(
      `${colors.red}✗ Error al leer archivo:${colors.reset}`,
      error.message
    );
  }
}

function mostrarTabla(data) {
  if (!data || data.length === 0) {
    console.log(`${colors.dim}(Sin resultados)${colors.reset}\n`);
    return;
  }

  const keys = Object.keys(data[0]);
  const maxLengths = keys.map((key) => {
    const maxDataLength = Math.max(
      ...data.map((row) => String(row[key] || "").length)
    );
    return Math.max(key.length, maxDataLength);
  });

  // Encabezados
  console.log(
    colors.bright +
      keys.map((key, i) => key.padEnd(maxLengths[i])).join(" | ") +
      colors.reset
  );

  console.log(maxLengths.map((len) => "-".repeat(len)).join("-+-"));

  // Filas
  data.forEach((row) => {
    console.log(
      keys
        .map((key, i) => String(row[key] || "").padEnd(maxLengths[i]))
        .join(" | ")
    );
  });

  console.log(`\n${colors.dim}(${data.length} filas)${colors.reset}\n`);
}

async function modoInteractivo() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colors.cyan}mysql>${colors.reset} `,
  });

  console.log(`${colors.bright}Modo Interactivo${colors.reset}`);
  console.log(`${colors.dim}Escribe 'exit' o 'quit' para salir${colors.reset}`);
  console.log(
    `${colors.dim}Escribe 'help' para ver comandos disponibles${colors.reset}\n`
  );

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();

    if (input === "exit" || input === "quit") {
      await connection.end();
      console.log(`${colors.green}¡Adiós!${colors.reset}`);
      process.exit(0);
    }

    if (input === "help") {
      console.log(`
${colors.bright}Comandos disponibles:${colors.reset}
  ${colors.cyan}help${colors.reset}              - Mostrar esta ayuda
  ${colors.cyan}show tables${colors.reset}       - Listar tablas
  ${colors.cyan}desc <tabla>${colors.reset}      - Describir tabla
  ${colors.cyan}SELECT ...${colors.reset}        - Ejecutar query SQL
  ${colors.cyan}exit/quit${colors.reset}         - Salir
`);
      rl.prompt();
      return;
    }

    if (input === "") {
      rl.prompt();
      return;
    }

    try {
      const results = await ejecutarQuery(input);

      if (Array.isArray(results)) {
        mostrarTabla(results);
      } else if (results.affectedRows !== undefined) {
        console.log(
          `${colors.green}✓ ${results.affectedRows} filas afectadas${colors.reset}\n`
        );
      } else {
        console.log(results);
      }
    } catch (error) {
      console.error(
        `${colors.red}✗ Error:${colors.reset}`,
        error.message,
        "\n"
      );
    }

    rl.prompt();
  });
}

async function main() {
  const args = process.argv.slice(2);

  await conectarDB();

  if (args.length === 0) {
    // Modo interactivo
    await modoInteractivo();
  } else if (args[0] === "-f" || args[0] === "--file") {
    // Ejecutar archivo
    if (!args[1]) {
      console.error(
        `${colors.red}✗ Debes especificar un archivo SQL${colors.reset}`
      );
      console.log(`Uso: node mysql-cli.js -f archivo.sql`);
      process.exit(1);
    }
    await ejecutarArchivoSQL(args[1]);
    await connection.end();
  } else if (args[0] === "-q" || args[0] === "--query") {
    // Ejecutar query directa
    const query = args.slice(1).join(" ");
    try {
      const results = await ejecutarQuery(query);
      if (Array.isArray(results)) {
        mostrarTabla(results);
      } else {
        console.log(`${colors.green}✓ Ejecutado correctamente${colors.reset}`);
        console.log(results);
      }
    } catch (error) {
      console.error(`${colors.red}✗ Error:${colors.reset}`, error.message);
    }
    await connection.end();
  } else if (args[0] === "-s" || args[0] === "--script") {
    // Ejecutar scripts predefinidos
    const scriptName = args[1];
    const scriptsDir = path.join(__dirname, "database");

    const scripts = {
      schema: path.join(scriptsDir, "schema-completo.sql"),
      datos: path.join(scriptsDir, "insertar-datos-prueba.sql"),
      queries: path.join(scriptsDir, "queries-utiles.sql"),
    };

    if (!scriptName || !scripts[scriptName]) {
      console.log(`${colors.yellow}Scripts disponibles:${colors.reset}`);
      Object.keys(scripts).forEach((name) => {
        console.log(
          `  ${colors.cyan}${name}${colors.reset} - ${scripts[name]}`
        );
      });
      process.exit(0);
    }

    await ejecutarArchivoSQL(scripts[scriptName]);
    await connection.end();
  } else {
    console.log(`
${colors.bright}MySQL CLI - Herramienta de línea de comandos${colors.reset}

${colors.cyan}Uso:${colors.reset}
  node mysql-cli.js                     ${colors.dim}# Modo interactivo${colors.reset}
  node mysql-cli.js -q "SELECT ..."     ${colors.dim}# Ejecutar query${colors.reset}
  node mysql-cli.js -f archivo.sql      ${colors.dim}# Ejecutar archivo SQL${colors.reset}
  node mysql-cli.js -s schema           ${colors.dim}# Ejecutar script predefinido${colors.reset}

${colors.cyan}Scripts predefinidos:${colors.reset}
  ${colors.green}schema${colors.reset}  - Crear tablas del sistema
  ${colors.green}datos${colors.reset}   - Insertar datos de prueba
  ${colors.green}queries${colors.reset} - Ver queries útiles

${colors.cyan}Ejemplos:${colors.reset}
  node mysql-cli.js -q "SELECT * FROM usuarios"
  node mysql-cli.js -f database/schema-completo.sql
  node mysql-cli.js -s datos
`);
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`${colors.red}✗ Error fatal:${colors.reset}`, error);
  process.exit(1);
});
