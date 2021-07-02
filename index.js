require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

app.listen(4000, () => console.log("Servidor levantado"));

const authMiddleware = (req, res, next) => {
  if (!req.header("Authorization")) {
    const nuevoError = new Error("Petición no autentificada");
    nuevoError.codigo = 403;
    return next(nuevoError);
  }
  const token = req.header("Authorization").split(" ")[1];
  try {
    const datosToken = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = datosToken;
    req.idUsuario = id;
    next();
  } catch (e) {
    // Token incorrecto
    if (e.message.includes("expired")) {
      const nuevoError = new Error("Token caducado");
      nuevoError.codigo = 403;
      return next(nuevoError);
    }
    next(e);
  }
};

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.get("/datos", authMiddleware, (req, res, next) => {
  const id = req.idUsuario;
  res.json({ datos: [1, 2, 3] });
});

app.post("/login", (req, res, next) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) {
    const nuevoError = new Error("Faltan credenciales");
    nuevoError.codigo = 400;
    return next(nuevoError);
  }
  if (usuario === "mariogl" && password === "mariogl") {
    const idUsuarioInventada = 8;
    const token = jwt.sign({ id: idUsuarioInventada }, process.env.JWT_SECRET, {
      expiresIn: "2m",
    });
    res.json({ token });
  } else {
    const nuevoError = new Error("Credenciales incorrectas");
    nuevoError.codigo = 403;
    next(nuevoError);
  }
});

app.use((err, req, res, next) => {
  const codigo = err.codigo || 500;
  const mensaje = err.codigo ? err.message : "Pete general";
  console.log(err.message);
  res.status(codigo).json({ error: true, mensaje });
});
