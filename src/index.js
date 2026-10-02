

const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");

const app = express();
const PORT = 3000;

const reservas = [
  {
    id: 1,
    estudiante: "Paula Flores",
    email: "paula@gmail.com",
    sala: "Sala Norte",
    fecha: "2026-10-02",
    turno: "Mañana",
    personas: 2,
  },
  {
    id: 2,
    estudiante: "Martín López",
    email: "martin@gmail.com",
    sala: "Sala Sur",
    fecha: "2026-10-02",
    turno: "Tarde",
    personas: 4,
  },
  {
    id: 3,
    estudiante: "Sofía Gómez",
    email: "sofia@gmail.com",
    sala: "Sala Multimedia",
    fecha: "2026-10-03",
    turno: "Noche",
    personas: 3,
  },
  {
    id: 4,
    estudiante: "Lucas Pérez",
    email: "lucas@gmail.com",
    sala: "Sala Norte",
    fecha: "2026-10-04",
    turno: "Tarde",
    personas: 5,
  },
];

let numeroDeSolicitud = 0;

function identificarSolicitud(req, res, next) {
  numeroDeSolicitud += 1;

  res.locals.solicitudId = `BIB-${String(numeroDeSolicitud).padStart(4, "0")}`;

  next();
}

function medirDuracion(req, res, next) {
  const inicio = process.hrtime.bigint();

  res.on("finish", () => {
    const fin = process.hrtime.bigint();
    const milisegundos = Number(fin - inicio) / 1_000_000;

    console.log(
      `[${res.locals.solicitudId}] ${req.method} ${req.originalUrl} ` +
      `${res.statusCode} ${milisegundos.toFixed(2)} ms`,
    );
  });

  next();
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.use(morgan("dev"));
app.use(identificarSolicitud);
app.use(medirDuracion);
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("layout", "layouts/main");

const reservasRouter = express.Router();

function prepararAreaReservas(req, res, next) {
  res.locals.seccion = "Reservas de salas";
  next();
}

reservasRouter.use(prepararAreaReservas);

const salasPermitidas = [
  "Sala Norte",
  "Sala Sur",
  "Sala Multimedia",
];

const turnosPermitidos = [
  "Mañana",
  "Tarde",
  "Noche",
];

function validarReserva(req, res, next) {
  const estudiante = String(req.body.estudiante ?? "").trim();
  const email = String(req.body.email ?? "").trim();
  const sala = String(req.body.sala ?? "").trim();
  const fecha = String(req.body.fecha ?? "").trim();
  const turno = String(req.body.turno ?? "").trim();
  const personas = Number(req.body.personas);

  const valores = {
    estudiante,
    email,
    sala,
    fecha,
    turno,
    personas: req.body.personas ?? "",
  };

  if (
    !estudiante ||
    !email ||
    !sala ||
    !fecha ||
    !turno ||
    !req.body.personas
  ) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      seccion: res.locals.seccion,
      error: "Todos los campos son obligatorios.",
      valores,
    });
  }

  if (!email.includes("@")) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      seccion: res.locals.seccion,
      error: "El email debe contener @.",
      valores,
    });
  }

  if (!salasPermitidas.includes(sala)) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      seccion: res.locals.seccion,
      error: "La sala seleccionada no es válida.",
      valores,
    });
  }

  if (!turnosPermitidos.includes(turno)) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      seccion: res.locals.seccion,
      error: "El turno seleccionado no es válido.",
      valores,
    });
  }

  if (!Number.isInteger(personas) || personas < 1 || personas > 6) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      seccion: res.locals.seccion,
      error: "La cantidad de personas debe ser un número entero entre 1 y 6.",
      valores,
    });
  }

  req.reservaValidada = {
    estudiante,
    email,
    sala,
    fecha,
    turno,
    personas,
  };

  next();
}

function crearReserva(req, res) {
  const nuevoId = reservas.length > 0
    ? Math.max(...reservas.map((reserva) => reserva.id)) + 1
    : 1;

  reservas.push({
    id: nuevoId,
    ...req.reservaValidada,
  });

  res.redirect("/reservas");
}

reservasRouter.post("/", validarReserva, crearReserva);

reservasRouter.get("/", (req, res) => {
  res.render("reservas/lista", {
    titulo: "Reservas",
    reservas: reservas,
    seccion: res.locals.seccion,
  });
});

reservasRouter.get("/nueva", (req, res) => {
  res.render("reservas/nueva", {
    titulo: "Nueva reserva",
    seccion: res.locals.seccion,
    error: null,
    valores: {},
  });
});

reservasRouter.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const reserva = reservas.find((reserva) => reserva.id === id);

  if (!reserva) {
    return res.status(404).render("no-encontrado", {
      titulo: "Reserva no encontrada",
    });
  }

  res.render("reservas/detalle", {
    titulo: "Detalle de reserva",
    reserva: reserva,
    seccion: res.locals.seccion,
  });
});

app.get("/", (req, res) => {
  res.render("inicio", {
    titulo: "Inicio",
  });
});

app.get("/estado", (req, res) => {
  res.json({
    servicio: "activo",
    reservas: reservas.length,
    solicitudId: res.locals.solicitudId,
  });
});

app.use("/reservas", reservasRouter);

app.use((req, res) => {
  res.status(404).render("no-encontrado", {
    titulo: "Página no encontrada",
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

