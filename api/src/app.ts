import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middlewares/error.middleware";

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
