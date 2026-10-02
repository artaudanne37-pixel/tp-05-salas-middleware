
Trabajo práctico 05 — Pipeline de middleware en Express
Descripción

Este proyecto es una aplicación web para gestionar reservas de salas de estudio. Permite consultar las reservas, ver sus detalles y registrar nuevas reservas mediante un formulario.

Está desarrollado con Node.js, Express y EJS.

Instalación

Para instalar las dependencias, ejecutar en la terminal:

npm install
Ejecución

Para iniciar el servidor:

npm start

Abrir en el navegador:

http://localhost:3000

Para comprobar la sintaxis del archivo principal:

npm run check
Rutas
Método	Ruta	Descripción
GET	/	Página de inicio
GET	/estado	Estado del servicio en formato JSON
GET	/reservas	Lista de reservas
GET	/reservas/nueva	Formulario de nueva reserva
GET	/reservas/:id	Detalle de una reserva
POST	/reservas	Validación y creación de una reserva
Pipeline de middleware

Express procesa las solicitudes mediante una secuencia de middleware. El orden es importante porque cada función puede preparar información para las siguientes.

El orden configurado en la aplicación es:

morgan("dev"): registra las solicitudes HTTP.
identificarSolicitud: genera un identificador consecutivo para cada solicitud.
medirDuracion: calcula cuánto tarda la respuesta.
express-ejs-layouts: permite utilizar un layout común en las vistas.
express.static: sirve los archivos estáticos, como el CSS.
express.urlencoded: permite leer los datos enviados por formularios.
express.json: permite interpretar cuerpos de solicitudes JSON.
Rutas de inicio y estado.
Router de reservas.
Middleware final para las rutas inexistentes.
Alcance de cada función
Middleware global

identificarSolicitud genera identificadores como BIB-0001 y los guarda en res.locals.solicitudId. De esta forma, el identificador está disponible en las vistas y en la respuesta de /estado.

medirDuracion registra el momento inicial y utiliza el evento finish para calcular la duración cuando termina la respuesta. En la consola muestra el identificador, el método, la URL, el estado HTTP y el tiempo en milisegundos.

Middleware del router

prepararAreaReservas se aplica al router de reservas y guarda el nombre de la sección en res.locals.seccion.

El router se monta con app.use("/reservas", reservasRouter). Por eso, sus rutas internas son /, /nueva y /:id, sin repetir el prefijo /reservas.

Validación de reservas

validarReserva normaliza los textos con trim() y comprueba que los campos estén completos. También verifica que el email contenga @, que la sala y el turno sean válidos y que la cantidad de personas sea un número entero entre 1 y 6.

Si los datos no son válidos, responde con estado HTTP 400 y vuelve a mostrar el formulario con un mensaje de error. En ese caso, no continúa con next() y la reserva no se crea.

Si los datos son válidos, guarda los valores en req.reservaValidada y llama a next() para continuar con crearReserva.

Flujo de una reserva válida
POST /reservas
    ↓
morgan("dev")
    ↓
identificarSolicitud
    ↓
medirDuracion
    ↓
express.urlencoded
    ↓
prepararAreaReservas
    ↓
validarReserva
    ↓
crearReserva
    ↓
302 Redirect a /reservas
    ↓
GET /reservas

En una solicitud inválida, validarReserva termina el procesamiento con una respuesta 400. La función crearReserva no se ejecuta.

Los parsers se registran antes de la validación para que los datos estén disponibles en req.body. El middleware medirDuracion escucha finish para calcular el tiempo real de respuesta.

Pruebas manuales

Se verificaron las siguientes funcionalidades:

Inicio y estado del servicio.
Listado de reservas y formulario.
Creación de una reserva válida.
Validación de email sin @.
Validación de cantidades fuera del rango permitido.
Página 404 para una URL inexistente.
Registro de solicitudes con Morgan.
Identificación y medición de duración de las respuestas.
Persistencia temporal

Las cuatro reservas iniciales están definidas en src/index.js. Las nuevas reservas se agregan a un arreglo en memoria.

No se utiliza una base de datos ni se guardan las nuevas reservas en archivos. Al reiniciar el servidor, las reservas creadas durante la ejecución se pierden y quedan solamente los datos iniciales.

Alcance del trabajo

El proyecto se concentra en el uso de middleware globales, middleware de router, validación de formularios, respuestas HTTP y manejo de rutas inexistentes. No incluye autenticación, sesiones ni persistencia en una base de datos.