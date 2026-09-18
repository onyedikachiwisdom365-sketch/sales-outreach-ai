import express, { type Express } from "express";
import cors from "cors";
// @ts-ignore
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const pinoMw = (pinoHttp as any).default;

const app: Express = express();

app.use(
  pinoMw({
    logger,
  })
);

app.use(cors());
app.use(express.json());

app.get("/health", (req: any, res: any) => {
  res.json({ status: "ok" });
});

app.get("/", (req: any, res: any) => {
  res.json({ message: "Sales Outreach API running" });
});

app.use("/api", router);

export default app;
