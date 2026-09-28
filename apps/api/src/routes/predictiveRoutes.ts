import { Router, Response } from 'express';
import { PredictiveService } from '../services/predictiveService';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/predictive/fleet
router.get('/fleet', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const highRisk = PredictiveService.getFleetHighRisk();
  res.json({ fleetPredictions: highRisk });
});

// GET /api/predictive/:assetTag
router.get('/:assetTag', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const pred = PredictiveService.predictAssetFailure(req.params.assetTag);
  if (!pred) {
    return res.status(404).json({ error: `Asset ${req.params.assetTag} not found` });
  }
  res.json({ prediction: pred });
});

export default router;
