import { Router, Response } from 'express';
import { AssetService } from '../services/assetService';
import { QrService } from '../services/qrService';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth';
import { LifecycleStage } from '@infra360/types';

const router = Router();

// GET /api/assets
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const {
    category,
    status,
    lifecycleStage,
    criticality,
    siteId,
    search,
    minRisk,
    maxHealth,
    limit,
    skip,
  } = req.query;

  const result = AssetService.getAssets({
    category: category as string,
    status: status as string,
    lifecycleStage: lifecycleStage as string,
    criticality: criticality as string,
    siteId: siteId as string,
    search: search as string,
    minRisk: minRisk ? parseInt(minRisk as string, 10) : undefined,
    maxHealth: maxHealth ? parseInt(maxHealth as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : 50,
    skip: skip ? parseInt(skip as string, 10) : 0,
  });

  res.json(result);
});

// GET /api/assets/:assetTag
router.get('/:assetTag', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const asset = AssetService.getAssetByTag(req.params.assetTag);
  if (!asset) {
    return res.status(404).json({ error: `Asset ${req.params.assetTag} not found` });
  }
  res.json({ asset });
});

// POST /api/assets
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'IT_MANAGER', 'INFRA_ENGINEER'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const created = AssetService.createAsset(req.body, req.user!);
      res.status(201).json({ asset: created });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// PUT /api/assets/:assetTag
router.put(
  '/:assetTag',
  authMiddleware,
  requireRole('ADMIN', 'IT_MANAGER', 'INFRA_ENGINEER', 'TECHNICIAN'),
  (req: AuthenticatedRequest, res: Response) => {
    const updated = AssetService.updateAsset(req.params.assetTag, req.body, req.user!);
    if (!updated) {
      return res.status(404).json({ error: `Asset ${req.params.assetTag} not found` });
    }
    res.json({ asset: updated });
  }
);

// POST /api/assets/:assetTag/lifecycle
router.post(
  '/:assetTag/lifecycle',
  authMiddleware,
  requireRole('ADMIN', 'IT_MANAGER', 'INFRA_ENGINEER'),
  (req: AuthenticatedRequest, res: Response) => {
    const { targetStage, reason } = req.body;
    if (!targetStage) {
      return res.status(400).json({ error: 'targetStage is required' });
    }

    const result = AssetService.transitionLifecycle(
      req.params.assetTag,
      targetStage as LifecycleStage,
      reason,
      req.user!
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ asset: result.asset });
  }
);

// GET /api/assets/:assetTag/qr
router.get('/:assetTag/qr', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hostHeader = req.get('host') || 'localhost:3000';
    const origin = req.protocol + '://' + hostHeader.replace(':5000', ':3000');
    const qrData = await QrService.generateAssetQrCode(req.params.assetTag, origin);
    res.json(qrData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
