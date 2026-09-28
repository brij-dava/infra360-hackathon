import { db } from '../storage/db';
import { IAsset, LifecycleStage, IUser } from '@infra360/types';
import { canTransitionLifecycle, calculateHealthScore, calculateRiskScore } from '@infra360/shared';

export interface AssetQueryOptions {
  category?: string;
  status?: string;
  lifecycleStage?: string;
  criticality?: string;
  siteId?: string;
  search?: string;
  minRisk?: number;
  maxHealth?: number;
  limit?: number;
  skip?: number;
}

export class AssetService {
  public static getAssets(options: AssetQueryOptions = {}) {
    let all = db.assets.find();

    if (options.category && options.category !== 'ALL') {
      all = all.filter((a) => a.category === options.category);
    }
    if (options.status && options.status !== 'ALL') {
      all = all.filter((a) => a.status === options.status);
    }
    if (options.lifecycleStage && options.lifecycleStage !== 'ALL') {
      all = all.filter((a) => a.lifecycleStage === options.lifecycleStage);
    }
    if (options.criticality && options.criticality !== 'ALL') {
      all = all.filter((a) => a.criticality === options.criticality);
    }
    if (options.siteId && options.siteId !== 'ALL') {
      all = all.filter((a) => a.location.siteId === options.siteId);
    }
    if (options.minRisk !== undefined) {
      all = all.filter((a) => a.riskScore >= options.minRisk!);
    }
    if (options.maxHealth !== undefined) {
      all = all.filter((a) => a.healthScore <= options.maxHealth!);
    }
    if (options.search) {
      const q = options.search.toLowerCase().trim();
      all = all.filter(
        (a) =>
          a.assetTag.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.model.toLowerCase().includes(q) ||
          a.manufacturer.toLowerCase().includes(q) ||
          (a.ipAddress && a.ipAddress.includes(q)) ||
          a.serialNumber.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q)
      );
    }

    const total = all.length;
    const skip = options.skip || 0;
    const limit = options.limit || 50;
    const paginated = all.slice(skip, skip + limit);

    return {
      total,
      skip,
      limit,
      assets: paginated,
    };
  }

  public static getAssetByTag(assetTag: string): IAsset | null {
    return db.assets.findOne({ assetTag });
  }

  public static createAsset(assetData: Partial<IAsset>, actor: IUser): IAsset {
    const assetTag =
      assetData.assetTag ||
      `AST-${(assetData.category || 'SRV').substring(0, 3).toUpperCase()}-${String(
        db.assets.count() + 101
      ).padStart(6, '0')}`;

    const health = calculateHealthScore(assetData, 0, false);
    const risk = calculateRiskScore(assetData, health.healthScore, 1);

    const newAsset: IAsset = {
      id: assetTag,
      assetTag,
      name: assetData.name || 'Unnamed Infrastructure Asset',
      category: assetData.category || 'SERVER',
      type: assetData.type || 'Standard Hardware Unit',
      manufacturer: assetData.manufacturer || 'Generic OEM',
      model: assetData.model || 'Model Unknown',
      serialNumber: assetData.serialNumber || `SN-${Date.now()}`,
      status: assetData.status || 'OPERATIONAL',
      lifecycleStage: assetData.lifecycleStage || 'INVENTORIED',
      criticality: assetData.criticality || 'TIER_2_OPERATIONAL',
      location: assetData.location || {
        siteId: 'DC-EAST-01',
        siteName: 'Ashburn Datacenter Alpha',
        building: 'DC Building A',
        floor: 'Floor 1',
        room: 'Server Room 101',
        rack: 'Rack-A1',
        rackUnitStart: 1,
        rackUnitEnd: 2,
      },
      department: assetData.department || 'Corporate IT',
      ownerId: actor.id,
      ownerName: actor.name,
      custodianId: actor.id,
      custodianName: actor.name,
      purchaseDate: assetData.purchaseDate || new Date().toISOString(),
      purchaseCost: assetData.purchaseCost || 5000,
      currency: 'USD',
      warrantyStartDate: assetData.warrantyStartDate || new Date().toISOString(),
      warrantyEndDate:
        assetData.warrantyEndDate ||
        new Date(Date.now() + 36 * 30 * 24 * 3600 * 1000).toISOString(),
      expectedLifespanMonths: assetData.expectedLifespanMonths || 60,
      replacementCostEstimate: assetData.replacementCostEstimate || (assetData.purchaseCost || 5000) * 1.15,
      accumulatedMaintenanceCost: 0,
      healthScore: health.healthScore,
      healthFactors: health.factors,
      riskScore: risk.riskScore,
      riskFactors: risk.factors,
      ipAddress: assetData.ipAddress,
      macAddress: assetData.macAddress,
      firmwareVersion: assetData.firmwareVersion || 'v1.0.0',
      telemetry: {
        cpuUtilizationPct: 20,
        temperatureCelsius: 40,
        errorRatePerMin: 0,
        uptimeHours: 0,
        lastPingTimestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };

    db.assets.insertOne(newAsset);

    db.audit.insertOne({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ASSET_CREATED',
      entityType: 'ASSET',
      entityId: assetTag,
      diff: { previous: {}, current: newAsset },
      reason: 'Asset onboarded to inventory',
      ipAddress: '127.0.0.1',
    });

    return newAsset;
  }

  public static updateAsset(
    assetTag: string,
    updates: Partial<IAsset>,
    actor: IUser
  ): IAsset | null {
    const existing = db.assets.findOne({ assetTag });
    if (!existing) return null;

    const previous = { ...existing };
    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    // Recompute score if relevant fields changed
    const recentFails = db.maintenance.count({ assetTag, type: 'EMERGENCY_REPAIR' });
    const health = calculateHealthScore(merged, recentFails, merged.status === 'DEGRADED');
    const risk = calculateRiskScore(merged, health.healthScore, 2);

    merged.healthScore = health.healthScore;
    merged.healthFactors = health.factors;
    merged.riskScore = risk.riskScore;
    merged.riskFactors = risk.factors;

    db.assets.updateOne({ assetTag }, merged);

    db.audit.insertOne({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ASSET_UPDATED',
      entityType: 'ASSET',
      entityId: assetTag,
      diff: { previous, current: merged },
      reason: 'Asset details updated by custodian/admin',
      ipAddress: '127.0.0.1',
    });

    return merged;
  }

  public static transitionLifecycle(
    assetTag: string,
    targetStage: LifecycleStage,
    reason: string,
    actor: IUser
  ): { success: boolean; asset?: IAsset; error?: string } {
    const existing = db.assets.findOne({ assetTag });
    if (!existing) {
      return { success: false, error: `Asset ${assetTag} not found` };
    }

    if (!canTransitionLifecycle(existing.lifecycleStage, targetStage)) {
      return {
        success: false,
        error: `Illegal lifecycle transition from ${existing.lifecycleStage} to ${targetStage}. Required state machine path not satisfied.`,
      };
    }

    const previousStage = existing.lifecycleStage;
    existing.lifecycleStage = targetStage;
    existing.updatedAt = new Date().toISOString();

    if (targetStage === 'MAINTENANCE') {
      existing.status = 'MAINTENANCE';
    } else if (targetStage === 'OPERATIONAL') {
      existing.status = 'OPERATIONAL';
    } else if (targetStage === 'RETIRED' || targetStage === 'DISPOSED') {
      existing.status = 'OFFLINE';
    }

    db.assets.updateOne({ assetTag }, existing);

    db.audit.insertOne({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'LIFECYCLE_STAGE_TRANSITIONED',
      entityType: 'LIFECYCLE',
      entityId: assetTag,
      diff: {
        previous: { stage: previousStage, status: existing.status },
        current: { stage: targetStage, status: existing.status },
      },
      reason: reason || `Lifecycle transition to ${targetStage}`,
      ipAddress: '127.0.0.1',
    });

    return { success: true, asset: existing };
  }
}
