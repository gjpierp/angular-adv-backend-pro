const Usuario = require("../models/usuario");
const Medico = require("../models/medico");
const Hospital = require("../models/hospital");
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
      const usuario = await Usuario.findById(id);
      if (!usuario) {
        console.log("No es un usuario por id");
        return false;
      }
      pathViejo = `./uploads/usuarios/${usuario.img}`;
      // Si existe, borrar la imagen anterior
      borrarImagen(pathViejo);

      usuario.img = nombreArchivo;
      await usuario.save();
      return true;
    case "medicos":
      const medico = await Medico.findById(id);
      if (!medico) {
        console.log("No es un médico por id");
        return false;
      }
      pathViejo = `./uploads/medicos/${medico.img}`;
      // Si existe, borrar la imagen anterior
      borrarImagen(pathViejo);

      medico.img = nombreArchivo;
      await medico.save();
      return true;
    case "hospitales":
      const hospital = await Hospital.findById(id);
      if (!hospital) {
        console.log("No es un hospital por id");
        return false;
      }
      pathViejo = `./uploads/hospitales/${hospital.img}`;
      // Si existe, borrar la imagen anterior
      borrarImagen(pathViejo);

      hospital.img = nombreArchivo;
      await hospital.save();
      return true;
    default:
      break;
  }
};

module.exports = {
  actualizarImagen,
};
