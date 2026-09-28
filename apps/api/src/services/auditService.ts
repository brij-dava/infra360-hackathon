import { db } from '../storage/db';
import { IAuditLog } from '@infra360/types';

export class AuditService {
  public static getLogs(filter: { entityType?: string; entityId?: string; actorRole?: string; limit?: number } = {}) {
    let logs = db.audit.find();

    if (filter.entityType) {
      logs = logs.filter((l) => l.entityType === filter.entityType);
    }
    if (filter.entityId) {
      logs = logs.filter((l) => l.entityId === filter.entityId);
    }
    if (filter.actorRole) {
      logs = logs.filter((l) => l.actorRole === filter.actorRole);
    }

    // Sort descending by timestamp
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const limit = filter.limit || 100;
    return logs.slice(0, limit);
  }
}
