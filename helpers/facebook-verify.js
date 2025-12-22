const axios = require("axios");

const facebookVerify = async (accessToken) => {
  if (!accessToken) {
    throw new Error("Token no proporcionado");
  }

  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    throw new Error(
      "FACEBOOK_APP_ID o FACEBOOK_APP_SECRET no configurados en las variables de entorno"
    );
  }

  try {
    // Verificar el token con Facebook
    const appAccessToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`;

    // Validar el token de acceso
    const debugResponse = await axios.get(
      `https://graph.facebook.com/debug_token`,
      {
        params: {
          input_token: accessToken,
          access_token: appAccessToken,
        },
      }
    );

    const { data: tokenData } = debugResponse.data;

    if (!tokenData.is_valid) {
      throw new Error("Token de Facebook no válido");
    }

    if (tokenData.app_id !== process.env.FACEBOOK_APP_ID) {
      throw new Error("Token no pertenece a esta aplicación");
    }

    // Obtener información del usuario
    const userResponse = await axios.get(`https://graph.facebook.com/me`, {
      params: {
        fields: "id,name,email,picture.type(large)",
        access_token: accessToken,
      },
    });

    const userData = userResponse.data;

    if (!userData.email) {
      throw new Error("El usuario de Facebook no proporcionó permiso de email");
    }

    const { name, email, picture, id: facebookId } = userData;
    const pictureUrl = picture?.data?.url || null;

    console.log("Usuario de Facebook verificado:", { name, email, facebookId });

    return {
      name,
      email,
      picture: pictureUrl,
      facebookId,
    };
  } catch (error) {
    if (error.response) {
      console.error("Error de Facebook API:", error.response.data);
      throw new Error(
        "Error al verificar con Facebook: " + error.response.data.error?.message
      );
    }
    console.error("Error al verificar token de Facebook:", error.message);
    throw new Error("Token de Facebook inválido: " + error.message);
  }
};

module.exports = {
  facebookVerify,
};
