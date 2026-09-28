import { Router, Response } from 'express';
import { MaintenanceService } from '../services/maintenanceService';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/maintenance
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { assetTag, status } = req.query;
  const records = MaintenanceService.getRecords({
    assetTag: assetTag as string,
    status: status as string,
  });
  res.json({ records });
});

// GET /api/maintenance/:id
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const record = MaintenanceService.getRecordById(req.params.id);
  if (!record) {
    return res.status(404).json({ error: `Record ${req.params.id} not found` });
  }
  res.json({ record });
});

// POST /api/maintenance
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'IT_MANAGER', 'TECHNICIAN', 'INFRA_ENGINEER'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const created = MaintenanceService.createRecord(req.body, req.user!);
      res.status(201).json({ record: created });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// PUT /api/maintenance/:id
router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'IT_MANAGER', 'TECHNICIAN'),
  (req: AuthenticatedRequest, res: Response) => {
    const updated = MaintenanceService.updateRecord(req.params.id, req.body, req.user!);
    if (!updated) {
      return res.status(404).json({ error: `Record ${req.params.id} not found` });
    }
    res.json({ record: updated });
  }
);

export default router;
