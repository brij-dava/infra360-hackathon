import { Router, Response } from 'express';
import { DiscoveryService } from '../services/discoveryService';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth';
import { TriageStatus } from '@infra360/types';

const router = Router();

// GET /api/discovery
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query;
  const devices = DiscoveryService.getDevices(status as TriageStatus);
  res.json({ devices });
});

// POST /api/discovery/:id/triage
router.post(
  '/:id/triage',
  authMiddleware,
  requireRole('ADMIN', 'IT_MANAGER', 'SECURITY_ANALYST'),
  (req: AuthenticatedRequest, res: Response) => {
    const { action, targetCategory } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Triage action is required' });
    }

    const result = DiscoveryService.triageDevice(
      req.params.id,
      action as TriageStatus,
      targetCategory,
      req.user!
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  }
);

// POST /api/discovery/scan
router.post(
  '/scan',
  authMiddleware,
  requireRole('ADMIN', 'SECURITY_ANALYST', 'IT_MANAGER'),
  (req: AuthenticatedRequest, res: Response) => {
    const { subnet } = req.body;
    const result = DiscoveryService.runSimulatedScan(subnet || '10.14.20.0/24', req.user!);
    res.json(result);
  }
);

export default router;
