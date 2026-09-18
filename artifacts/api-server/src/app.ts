import express, { type Express } from "express";
import cors from "cors";
// @ts-ignore
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const pinoMw = (pinoHttp as any).default || (pinoHttp as any);

const app: Express = express();

app.use(
  pinoMw({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

app.use(cors());
app.use(express.json());
app.use(router);

export default app;
