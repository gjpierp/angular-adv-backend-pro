const Usuario = require("../models/usuario");
const fs = require("fs");

const borrarImagen = (path) => {
  if (fs.existsSync(path)) {
    // borrar la imagen anterior
    fs.unlinkSync(path);
  }
};

const actualizarImagen = async (tipo, id, nombreArchivo) => {
  let pathViejo = "";

  switch (tipo) {
    case "usuarios":
      const usuarioResult = await Usuario.obtenerPorId(id);
      if (!usuarioResult || usuarioResult.length === 0) {
        console.log("No es un usuario por id");
        return false;
      }

      const usuario = usuarioResult[0];
      pathViejo = `./uploads/usuarios/${usuario.img}`;
      borrarImagen(pathViejo);

      await Usuario.actualizarImagen(id, nombreArchivo);
      return true;

      break;

    default:
      console.log("Tipo no válido");
      return false;
  }
};

module.exports = {
  actualizarImagen,
};
