import { Router, type IRouter, type Request, type Response } from 'express';

const router: IRouter = Router();

router.get("/healthz", (_req: Request, res: Response) => {
  const data = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
  res.json(data);
});

export default router;
