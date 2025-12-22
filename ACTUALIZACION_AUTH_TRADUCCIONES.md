# 🌍 Actualización del Módulo de Autenticación con Sistema de Traducciones

## 📋 Resumen de Cambios

Se ha actualizado el módulo de autenticación para integrar el sistema de traducciones multilingüe, permitiendo que todos los mensajes de error y éxito se devuelvan en el idioma preferido del usuario.

---

## 🔧 Archivos Modificados

### 1. **controllers/auth.js**

Se actualizaron las 4 funciones principales de autenticación:

#### ✅ Cambios implementados:

- **Import agregado**: `const { obtenerMensaje: obtenerMensajeTraduccido } = require("../helpers/traducciones");`
- **Detección de idioma**: Todas las funciones ahora capturan `req.idioma?.codigo || "es"`
- **Mensajes traducidos**: Todos los mensajes de error y éxito utilizan `obtenerMensajeTraduccido()`

#### 📌 Funciones actualizadas:

##### `login()`

- ✅ AUTH_EMAIL_NOT_FOUND - Cuando el email no existe
- ✅ AUTH_INVALID_PASSWORD - Cuando la contraseña es incorrecta
- ✅ AUTH_LOGIN_SUCCESS - Login exitoso
- ✅ AUTH_SERVER_ERROR - Error del servidor

##### `googleSignIn()`

- ✅ AUTH_GOOGLE_TOKEN_REQUIRED - Token de Google no proporcionado
- ✅ AUTH_GOOGLE_EMAIL_ERROR - Error al obtener email de Google
- ✅ AUTH_GOOGLE_SUCCESS - Login con Google exitoso
- ✅ AUTH_GOOGLE_INVALID_TOKEN - Token inválido o expirado

##### `facebookSignIn()`

- ✅ AUTH_FACEBOOK_TOKEN_REQUIRED - Token de Facebook no proporcionado
- ✅ AUTH_FACEBOOK_EMAIL_ERROR - Error al obtener email de Facebook
- ✅ AUTH_FACEBOOK_SUCCESS - Login con Facebook exitoso
- ✅ AUTH_FACEBOOK_INVALID_TOKEN - Token inválido o expirado

##### `renewToken()`

- ✅ AUTH_USER_NOT_FOUND - Usuario no encontrado
- ✅ AUTH_TOKEN_RENEWED - Token renovado exitosamente
- ✅ AUTH_SERVER_ERROR - Error renovando el token

---

### 2. **index.js**

Se registró el middleware de gestión de idioma:

```javascript
// Import agregado
const { capturarIdioma } = require("./middlewares/gestionar-idioma");

// Middleware registrado después de sanitizarInputs
app.use(capturarIdioma);
```

**Orden de middlewares actualizado:**

1. CORS
2. validarTamanoBody (2MB)
3. express.json()
4. sanitizarInputs
5. **capturarIdioma** ← NUEVO
6. Rutas

---

### 3. **documentation/Sql/mensajes-autenticacion.sql**

Se creó un archivo SQL con 14 mensajes de autenticación en 8 idiomas:

#### 📦 Idiomas incluidos:

- 🇪🇸 Español (es)
- 🇬🇧 Inglés (en)
- 🇧🇷 Portugués (pt)
- 🇫🇷 Francés (fr)
- 🇩🇪 Alemán (de)
- 🇮🇹 Italiano (it)
- 🇨🇳 Chino (zh)
- 🇯🇵 Japonés (ja)

#### 📝 Mensajes creados:

1. AUTH_EMAIL_NOT_FOUND
2. AUTH_INVALID_PASSWORD
3. AUTH_LOGIN_SUCCESS
4. AUTH_SERVER_ERROR
5. AUTH_GOOGLE_TOKEN_REQUIRED
6. AUTH_GOOGLE_EMAIL_ERROR
7. AUTH_GOOGLE_SUCCESS
8. AUTH_GOOGLE_INVALID_TOKEN
9. AUTH_FACEBOOK_TOKEN_REQUIRED
10. AUTH_FACEBOOK_EMAIL_ERROR
11. AUTH_FACEBOOK_SUCCESS
12. AUTH_FACEBOOK_INVALID_TOKEN
13. AUTH_USER_NOT_FOUND
14. AUTH_TOKEN_RENEWED

**Total**: 14 mensajes × 8 idiomas = **112 traducciones**

---

## 🚀 Instalación de Mensajes

Para agregar los mensajes de autenticación a la base de datos:

```bash
# Opción 1: MySQL CLI
mysql -u root -p admin_sitio < documentation/Sql/mensajes-autenticacion.sql

# Opción 2: MySQL Workbench
# Abrir el archivo y ejecutar
```

---

## 📖 Uso del Sistema

### 🌐 Detectar idioma desde el frontend

El middleware `capturarIdioma` detecta automáticamente el idioma en este orden de prioridad:

1. **Header HTTP**: `X-Language` o `Accept-Language`
2. **Query parameter**: `?idioma=en` o `?lang=en`
3. **Cookie**: `idioma=en`
4. **Por defecto**: `es` (español)

### 📤 Ejemplo de Request

```javascript
// Opción 1: Header (recomendado)
fetch("http://localhost:3000/api/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Language": "en", // ← Idioma
  },
  body: JSON.stringify({
    correo_electronico: "user@example.com",
    contrasena: "wrongpass",
  }),
});

// Opción 2: Query parameter
fetch("http://localhost:3000/api/login?idioma=fr", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    correo_electronico: "user@example.com",
    contrasena: "wrongpass",
  }),
});
```

### 📥 Ejemplo de Response

**Request en inglés (X-Language: en):**

```json
{
  "ok": false,
  "msg": "Invalid password"
}
```

**Request en francés (X-Language: fr):**

```json
{
  "ok": false,
  "msg": "Mot de passe invalide"
}
```

**Request en japonés (X-Language: ja):**

```json
{
  "ok": false,
  "msg": "無効なパスワード"
}
```

---

## 🧪 Testing

### 1. **Login con email incorrecto**

```bash
# Español
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -H "X-Language: es" \
  -d '{"correo_electronico":"noexiste@test.com","contrasena":"123"}'

# Respuesta: "Email no encontrado"

# Inglés
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -H "X-Language: en" \
  -d '{"correo_electronico":"noexiste@test.com","contrasena":"123"}'

# Respuesta: "Email not found"
```

### 2. **Login con contraseña incorrecta**

```bash
# Portugués
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -H "X-Language: pt" \
  -d '{"correo_electronico":"admin@test.com","contrasena":"wrong"}'

# Respuesta: "Senha inválida"
```

### 3. **Login exitoso**

```bash
# Alemán
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -H "X-Language: de" \
  -d '{"correo_electronico":"admin@test.com","contrasena":"correctpass"}'

# Respuesta incluye: "msg": "Anmeldung erfolgreich"
```

### 4. **Renovar token**

```bash
# Italiano
curl -X GET http://localhost:3000/api/login/renew \
  -H "x-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "X-Language: it"

# Respuesta incluye: "msg": "Token rinnovato con successo"
```

---

## 🎯 Beneficios

### ✅ Para el Usuario Final

- Mensajes de error en su idioma nativo
- Mejor experiencia de usuario (UX)
- Mayor comprensión de los errores
- Accesibilidad mejorada

### ✅ Para el Desarrollador

- Sistema centralizado de mensajes
- Fácil mantenimiento
- Consistencia en toda la aplicación
- Escalable a más idiomas

### ✅ Para el Negocio

- Aplicación preparada para mercados internacionales
- Reducción de soporte técnico por incomprensión de mensajes
- Profesionalismo y calidad percibida

---

## 📊 Estadísticas del Sistema

### Cobertura de Traducciones

```
✅ Idiomas soportados: 8
✅ Mensajes de autenticación: 14
✅ Total traducciones: 112
✅ Categorías: autenticacion
✅ Middleware: capturarIdioma ✓
✅ Helper: obtenerMensaje ✓
```

### Archivos del Sistema de Traducciones

```
📁 Base de datos
  └── schema-traducciones.sql (15+ tablas)

📁 Middlewares
  └── gestionar-idioma.js (7 funciones)

📁 Helpers
  └── traducciones.js (13 funciones)

📁 Models
  └── traduccion.js (17 métodos)

📁 Controllers
  ├── traducciones.js (17 handlers)
  └── auth.js (actualizado con traducciones)

📁 Routes
  ├── traducciones.js (15 endpoints)
  └── auth.js (4 endpoints multilingües)

📁 Documentation/Sql
  ├── schema-traducciones.sql
  └── mensajes-autenticacion.sql
```

---

## 🔄 Próximos Pasos

### Módulos a actualizar con traducciones:

1. **Usuarios** (controllers/usuarios.js)

   - Mensajes de validación
   - Errores de permisos
   - Operaciones CRUD

2. **Roles** (controllers/roles.js)

   - Mensajes de operaciones
   - Validaciones

3. **Permisos** (controllers/permisos.js)

   - Mensajes de asignación
   - Errores de validación

4. **Menús** (controllers/menus.js)

   - Mensajes de operaciones
   - Validaciones

5. **Búsquedas** (controllers/busquedas.js)

   - Mensajes de resultados
   - Errores de búsqueda

6. **Uploads** (controllers/uploads.js)
   - Mensajes de validación de archivos
   - Errores de carga

---

## 📝 Notas Técnicas

### Función obtenerMensajeTraduccido()

```javascript
// Uso en controllers
const idioma = req.idioma?.codigo || "es";
const msgError = await obtenerMensajeTraduccido("AUTH_EMAIL_NOT_FOUND", idioma);

// Retorna:
// - Mensaje traducido si existe
// - Clave del mensaje como fallback
```

### Detección de Idioma

```javascript
// El middleware capturarIdioma agrega al request:
req.idioma = {
  id: 1, // ID de la tabla idiomas
  codigo: "es", // Código ISO (es, en, pt, etc.)
  nombre: "Español", // Nombre nativo del idioma
};
```

### Validación de Idioma

- Si el idioma no existe → Se usa español por defecto
- Si la traducción no existe → Se retorna la clave del mensaje
- El sistema nunca falla por falta de traducción

---

## 🐛 Troubleshooting

### Problema: Mensajes en español aunque solicito otro idioma

**Solución:**

1. Verificar que los mensajes estén en la BD:

```sql
SELECT * FROM traducciones_mensajes_valores
WHERE id_mensaje IN (
  SELECT id_mensaje FROM traducciones_mensajes
  WHERE categoria = 'autenticacion'
);
```

2. Verificar que el middleware esté registrado en index.js

3. Verificar headers del request con herramientas de desarrollo

### Problema: Error "Cannot read property 'codigo' of undefined"

**Solución:**
Verificar que el middleware `capturarIdioma` está antes de las rutas en index.js:

```javascript
app.use(sanitizarInputs);
app.use(capturarIdioma); // ← Debe estar aquí
app.use("/api/login", require("./routes/auth"));
```

---

## 📚 Referencias

- [SISTEMA_TRADUCCIONES.md](SISTEMA_TRADUCCIONES.md) - Documentación completa del sistema
- [helpers/traducciones.js](helpers/traducciones.js) - Helper functions
- [middlewares/gestionar-idioma.js](middlewares/gestionar-idioma.js) - Middleware
- [models/traduccion.js](models/traduccion.js) - Modelo de datos
- [controllers/traducciones.js](controllers/traducciones.js) - Controladores
- [routes/traducciones.js](routes/traducciones.js) - Rutas API

---

## ✨ Conclusión

El módulo de autenticación ha sido actualizado exitosamente para soportar respuestas multilingües. El sistema detecta automáticamente el idioma preferido del usuario y retorna todos los mensajes en el idioma correspondiente, mejorando significativamente la experiencia de usuario para aplicaciones internacionales.

**Fecha de actualización**: 22 de diciembre de 2025
**Versión**: 1.0.0
**Estado**: ✅ Completado y Operativo
