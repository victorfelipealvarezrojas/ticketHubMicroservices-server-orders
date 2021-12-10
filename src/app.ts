import express from "express";
import 'express-async-errors';
import cookieSession from "cookie-session";
import { errorHandler, NotFounError, currentUser } from "@ticketshub/commun";
import { newOrderRouter } from "./routes/new";
import { showOrderRouter } from "./routes/show";
import { indexOrderRouter } from "./routes/index";
import { deleteOrderRouter } from "./routes/delete";

const app = express();
app.set('trust proxy', true);//no acepta otros proxys, ngnex los mete a todos en el msimo proxy y si es distinto no lo acepta
app.use(express.json());
//me eprmite configurar las cookies y hace posible que en las peticiones se incruste el jwt dentyro de las cookies de forma automatica
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test'//que solo funcione para protocolo https, me obliga a configurar settings(trust proxy,true)
  })
);

/*
  Rutas de usuario
*/
app.use(currentUser);//me permite manejar el usuario actual
app.use(newOrderRouter);
app.use(showOrderRouter);
app.use(indexOrderRouter);
app.use(deleteOrderRouter);

//controlo rutas que no existan
app.all('*', async (req, res) => {
  throw new NotFounError();
});

/*
  controlador de errores, middleware
  es llamado desde cualquiera de las rutas al ocurir algun error e instanciar la clase manejadora de errores
*/
app.use(errorHandler);

export { app };