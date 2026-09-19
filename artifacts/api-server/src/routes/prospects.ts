import { Router, type IRouter, type Request, type Response } from 'express';

const router: IRouter = Router();

// GET /prospects - List all prospects
router.get("/prospects", async (_req: Request, res: Response) => {
  try {
    res.json({ prospects: [], message: 'Prospects endpoint working' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prospects' });
  }
});

// POST /prospects - Create prospect
router.post("/prospects", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    res.status(201).json({ 
      id: Date.now().toString(), 
      ...body, 
      createdAt: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create prospect' });
  }
});

// GET /prospects/:id
router.get("/prospects/:id", async (req: Request, res: Response) => {
  try {
    res.json({ id: req.params.id, status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prospect' });
  }
});

export default router;
