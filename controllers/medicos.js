const { response } = require("express");
const Medico = require("../models/medico");

const getMedicos = async (req, res = response) => {
  const medicos = await Medico.find()
    .populate("usuario", "nombre email img")
    .populate("hospital", "nombre");
  res.json({
    ok: true,
    medicos: medicos,
  });
};

const crearMedico = async (req, res = response) => {
  const medico = new Medico({
    usuario: req.uid,
    ...req.body,
  });
  try {
    const medicoDB = await medico.save();
    res.json({
      ok: true,
      medico: medicoDB,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Hable con el administrador",
    });
  }
};

const actualizarMedico = (req, res = response) => {
  res.json({
    ok: true,
    msg: "Actualizar Medico",
  });
};

const borrarMedico = (req, res = response) => {
  res.json({
    ok: true,
    msg: "Borrar Medico",
  });
};

module.exports = {
  getMedicos: getMedicos,
  crearMedico: crearMedico,
  actualizarMedico: actualizarMedico,
  borrarMedico: borrarMedico,
};
