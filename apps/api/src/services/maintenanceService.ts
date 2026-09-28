import { db } from '../storage/db';
import { IMaintenanceRecord, IUser } from '@infra360/types';
import { AssetService } from './assetService';

export class MaintenanceService {
  public static getRecords(filter: { assetTag?: string; status?: string } = {}) {
    const q: Record<string, any> = {};
    if (filter.assetTag) q.assetTag = filter.assetTag;
    if (filter.status) q.status = filter.status;
    return db.maintenance.find(q);
  }

  public static getRecordById(id: string): IMaintenanceRecord | null {
    return db.maintenance.findOne({ id });
  }

  public static createRecord(
    data: Omit<IMaintenanceRecord, 'id' | 'ticketId' | 'createdAt'>,
    actor: IUser
  ): IMaintenanceRecord {
    const ticketId = `MNT-${new Date().getFullYear()}-${String(db.maintenance.count() + 1).padStart(4, '0')}`;
    const newRecord: IMaintenanceRecord = {
      id: ticketId,
      ticketId,
      ...data,
      technicianId: data.technicianId || actor.id,
      technicianName: data.technicianName || actor.name,
      createdAt: new Date().toISOString(),
    };

    db.maintenance.insertOne(newRecord);

    // Update asset status and accumulated maintenance cost
    const asset = db.assets.findOne({ assetTag: data.assetTag });
    if (asset) {
      const prevCost = asset.accumulatedMaintenanceCost || 0;
      const updatedCost = prevCost + (data.cost || 0);

      const updates: any = {
        accumulatedMaintenanceCost: updatedCost,
      };

      if (data.status === 'IN_PROGRESS' || data.status === 'SCHEDULED') {
        updates.status = 'MAINTENANCE';
        updates.lifecycleStage = 'MAINTENANCE';
      } else if (data.status === 'COMPLETED') {
        updates.status = 'OPERATIONAL';
        updates.lifecycleStage = 'OPERATIONAL';
      }

      AssetService.updateAsset(data.assetTag, updates, actor);
    }

    db.audit.insertOne({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'MAINTENANCE_TICKET_LOGGED',
      entityType: 'MAINTENANCE',
      entityId: ticketId,
      diff: { previous: {}, current: newRecord },
      reason: `Work order logged for ${data.assetTag}: ${data.title}`,
      ipAddress: '127.0.0.1',
    });

    return newRecord;
  }

  public static updateRecord(
    ticketId: string,
    updates: Partial<IMaintenanceRecord>,
    actor: IUser
  ): IMaintenanceRecord | null {
    const existing = db.maintenance.findOne({ ticketId });
    if (!existing) return null;

    const previous = { ...existing };
    const merged = { ...existing, ...updates };

    db.maintenance.updateOne({ ticketId }, merged);

    // If marked COMPLETED, return asset to operational
    if (updates.status === 'COMPLETED') {
      AssetService.updateAsset(
        existing.assetTag,
        {
          status: 'OPERATIONAL',
          lifecycleStage: 'OPERATIONAL',
        },
        actor
      );
    }

    db.audit.insertOne({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'MAINTENANCE_TICKET_UPDATED',
      entityType: 'MAINTENANCE',
      entityId: ticketId,
      diff: { previous, current: merged },
      reason: `Maintenance ticket status updated to ${updates.status || 'modified'}`,
      ipAddress: '127.0.0.1',
    });

    return merged;
  }
}
