import { Router, Response } from 'express';
import { AiQueryService } from '../services/aiQueryService';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/ai/query
router.post('/query', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required' });
  }

  try {
    const result = await AiQueryService.executeNaturalLanguageQuery(query);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/chat
router.post('/chat', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { prompt, assetTag } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt string is required' });
  }

  try {
    const result = await AiQueryService.executeDiagnosticChat(prompt, assetTag);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
