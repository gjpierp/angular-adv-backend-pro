const { OAuth2Client } = require("google-auth-library");

const googleVerify = async (token) => {
  if (!token) {
    throw new Error("Token no proporcionado");
  }

  if (!process.env.GOOGLE_ID) {
    throw new Error("GOOGLE_ID no configurado en las variables de entorno");
  }

  try {
    // Crear cliente OAuth2 con el CLIENT_ID
    const client = new OAuth2Client(process.env.GOOGLE_ID);

    // Verificar el ID Token (compatible con Google Identity Services)
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_ID, // CLIENT_ID de la app
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error("No se pudo obtener el payload del token");
    }

    // Extraer información del usuario
    const {
      name,
      email,
      picture,
      sub: googleId, // ID único de Google
      email_verified,
      given_name,
      family_name,
    } = payload;

    if (!email) {
      throw new Error("El token no contiene un email válido");
    }

    // Validar que el email esté verificado
    if (!email_verified) {
      throw new Error("El email de Google no está verificado");
    }

    // Validar que el token sea reciente (opcional pero recomendado)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error("El token de Google ha expirado");
    }

    // Validar issuer (emisor del token)
    if (
      payload.iss !== "accounts.google.com" &&
      payload.iss !== "https://accounts.google.com"
    ) {
      throw new Error("Emisor del token no válido");
    }

    console.log("Usuario de Google verificado:", {
      name,
      email,
      googleId,
      email_verified,
    });

    return {
      name: name || `${given_name || ""} ${family_name || ""}`.trim(),
      email,
      picture,
      googleId,
      given_name,
      family_name,
    };
  } catch (error) {
    console.error("Error al verificar token de Google:", error.message);

    // Proporcionar mensajes de error más específicos
    if (error.message.includes("Token used too late")) {
      throw new Error(
        "El token de Google ha expirado. Por favor, intenta iniciar sesión nuevamente."
      );
    }

    if (error.message.includes("Invalid token signature")) {
      throw new Error(
        "Firma del token inválida. El token ha sido modificado o es inválido."
      );
    }

    throw new Error("Token de Google inválido: " + error.message);
  }
};

module.exports = {
  googleVerify,
};
