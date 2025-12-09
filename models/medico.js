const e = require("express");
const { Schema, model } = require("mongoose");

const MedicoSchema = Schema({
  nombre: {
    type: String,
    required: [true, "El nombre es obligatorio"],
  },
  img: {
    type: String,
  },
  estado: {
    type: Boolean,
    default: true,
  },
  usuario: {
    type: Schema.Types.ObjectId,
    ref: "Usuario",
    required: [true, "El usuario es obligatorio"],
  },
  hospital: {
    type: Schema.Types.ObjectId,
    ref: "Hospital",
    required: [true, "El hospital es obligatorio"],
  },
});

MedicoSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  return object;
});

module.exports = model("Medico", MedicoSchema);
