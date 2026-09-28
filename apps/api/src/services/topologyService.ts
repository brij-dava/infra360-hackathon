import { db } from '../storage/db';
import { IRelationship, IBlastRadiusResult, IAsset, IUser } from '@infra360/types';
import { traverseBlastRadius } from '@infra360/shared';

export class TopologyService {
  public static getTopologyGraph() {
    const relationships = db.relationships.find();
    const assets = db.assets.find();

    // Map of assets by tag for quick lookup
    const assetMap = new Map<string, IAsset>();
    assets.forEach((a) => assetMap.set(a.assetTag, a));

    // Generate React Flow nodes
    // Collect all unique asset tags present in relationships
    const tagsInGraph = new Set<string>();
    relationships.forEach((r) => {
      tagsInGraph.add(r.sourceAssetTag);
      tagsInGraph.add(r.targetAssetTag);
    });

    // If too few, add first 30 assets for a rich topology visual
    if (tagsInGraph.size < 25) {
      assets.slice(0, 30).forEach((a) => tagsInGraph.add(a.assetTag));
    }

    const nodes = Array.from(tagsInGraph).map((tag, idx) => {
      const asset = assetMap.get(tag);
      const col = idx % 5;
      const row = Math.floor(idx / 5);

      return {
        id: tag,
        type: 'assetNode',
        position: {
          x: col * 260 + 50,
          y: row * 180 + 50,
        },
        data: {
          assetTag: tag,
          name: asset ? asset.name : tag,
          category: asset ? asset.category : 'SERVER',
          status: asset ? asset.status : 'OPERATIONAL',
          healthScore: asset ? asset.healthScore : 100,
          riskScore: asset ? asset.riskScore : 0,
          criticality: asset ? asset.criticality : 'TIER_2_OPERATIONAL',
          ipAddress: asset?.ipAddress || '10.10.x.x',
          location: asset ? `${asset.location.rack} (${asset.location.room})` : 'Datacenter',
        },
      };
    });

    // Generate React Flow edges
    const edges = relationships.map((rel) => ({
      id: rel.id,
      source: rel.sourceAssetTag,
      target: rel.targetAssetTag,
      label: rel.relationshipType,
      animated: rel.relationshipType === 'CONNECTED_TO' || rel.relationshipType === 'SERVES',
      style: {
        stroke: rel.criticalityMultiplier > 2.0 ? '#ef4444' : '#6366f1',
        strokeWidth: rel.criticalityMultiplier > 2.0 ? 3 : 2,
      },
      data: {
        multiplier: rel.criticalityMultiplier,
        metadata: rel.metadata,
      },
    }));

    return { nodes, edges };
  }

  public static getBlastRadius(assetTag: string): IBlastRadiusResult | null {
    const asset = db.assets.findOne({ assetTag });
    if (!asset) return null;

    const relationships = db.relationships.find();
    const assets = db.assets.find();
    const assetsMap = new Map<string, IAsset>();
    assets.forEach((a) => assetsMap.set(a.assetTag, a));

    return traverseBlastRadius(assetTag, relationships, assetsMap);
  }

  public static addRelationship(
    relData: Omit<IRelationship, 'id' | 'createdAt'>,
    actor: IUser
  ): IRelationship {
    const id = `REL-${Date.now()}`;
    const newRel: IRelationship = {
      id,
      ...relData,
      createdAt: new Date().toISOString(),
    };

    db.relationships.insertOne(newRel);

    db.audit.insertOne({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TOPOLOGY_RELATIONSHIP_CREATED',
      entityType: 'RELATIONSHIP',
      entityId: id,
      diff: { previous: {}, current: newRel },
      reason: `Linked ${relData.sourceAssetTag} to ${relData.targetAssetTag} (${relData.relationshipType})`,
      ipAddress: '127.0.0.1',
    });

    return newRel;
  }
}
