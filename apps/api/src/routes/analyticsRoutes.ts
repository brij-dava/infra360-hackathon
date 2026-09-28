import { Router, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/analytics/dashboard
router.get('/dashboard', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const data = AnalyticsService.getDashboardKPIs();
  res.json(data);
});

// GET /api/analytics/repair-replace/:assetTag
router.get('/repair-replace/:assetTag', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const analysis = AnalyticsService.getRepairVsReplace(req.params.assetTag);
  if (!analysis) {
    return res.status(404).json({ error: `Asset ${req.params.assetTag} not found` });
  }
  res.json({ analysis });
});

export default router;
