import { Router, Response } from 'express';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/audit
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { entityType, entityId, actorRole, limit } = req.query;
  const logs = AuditService.getLogs({
    entityType: entityType as string,
    entityId: entityId as string,
    actorRole: actorRole as string,
    limit: limit ? parseInt(limit as string, 10) : 100,
  });

  res.json({ logs });
});

export default router;
