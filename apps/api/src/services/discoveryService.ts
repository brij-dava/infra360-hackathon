import { db } from '../storage/db';
import { IDiscoveredDevice, IUser, TriageStatus, IAsset } from '@infra360/types';
import { AssetService } from './assetService';

export class DiscoveryService {
  public static getDevices(status?: TriageStatus) {
    if (status) {
      return db.discovery.find({ triageStatus: status });
    }
    return db.discovery.find();
  }

  public static getDeviceById(id: string): IDiscoveredDevice | null {
    return db.discovery.findOne({ id });
  }

  public static triageDevice(
    deviceId: string,
    action: TriageStatus,
    targetCategory: string = 'SERVER',
    actor: IUser
  ): { success: boolean; device?: IDiscoveredDevice; registeredAsset?: IAsset; error?: string } {
    const device = db.discovery.findOne({ id: deviceId });
    if (!device) {
      return { success: false, error: 'Discovered device not found' };
    }

    const prevStatus = device.triageStatus;
    device.triageStatus = action;

    let registeredAsset: IAsset | undefined;

    if (action === 'REGISTERED') {
      // One-click convert unknown device to managed inventory asset!
      registeredAsset = AssetService.createAsset(
        {
          name: `${device.detectedManufacturer} ${device.detectedType}`,
          category: (targetCategory as any) || 'SERVER',
          type: device.detectedType,
          manufacturer: device.detectedManufacturer,
          model: 'Auto-Discovered Unit',
          ipAddress: device.ipAddress,
          macAddress: device.macAddress,
          status: 'OPERATIONAL',
          lifecycleStage: 'INVENTORIED',
          criticality: 'TIER_2_OPERATIONAL',
          department: 'Network Operations',
        },
        actor
      );

      device.associatedAssetTag = registeredAsset.assetTag;
    }

    db.discovery.updateOne({ id: deviceId }, device);

    db.audit.insertOne({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DISCOVERY_DEVICE_TRIAGED',
      entityType: 'DISCOVERY',
      entityId: deviceId,
      diff: {
        previous: { triageStatus: prevStatus },
        current: { triageStatus: action, associatedAssetTag: device.associatedAssetTag },
      },
      reason: `Device ${device.ipAddress} (${device.macAddress}) triaged as ${action}`,
      ipAddress: '127.0.0.1',
    });

    return { success: true, device, registeredAsset };
  }

  public static runSimulatedScan(subnet: string = '10.14.20.0/24', actor: IUser) {
    const sweepCount = Math.floor(Math.random() * 3) + 1;
    const newItems: IDiscoveredDevice[] = [];

    for (let i = 0; i < sweepCount; i++) {
      const lastOctet = Math.floor(Math.random() * 200) + 20;
      const ip = subnet.replace('0/24', `${lastOctet}`);
      const mac = `00:50:56:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`;

      // Check if already exists
      if (!db.discovery.findOne({ macAddress: mac })) {
        const item: IDiscoveredDevice = {
          id: `DISC-${Date.now()}-${i}`,
          ipAddress: ip,
          macAddress: mac,
          hostname: `probe-node-${lastOctet}`,
          detectedManufacturer: 'Unknown Vendor (Simulated Probe)',
          detectedType: 'Uncatalogued Subnet Host',
          subnet,
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          discoverySource: 'ARP_SWEEP',
          triageStatus: 'UNIDENTIFIED',
          riskScore: 75,
          openPorts: [80, 443],
        };
        db.discovery.insertOne(item);
        newItems.push(item);
      }
    }

    db.audit.insertOne({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DISCOVERY_SCAN_TRIGGERED',
      entityType: 'DISCOVERY',
      entityId: subnet,
      diff: { previous: {}, current: { newDevicesFound: newItems.length } },
      reason: `Manual on-demand discovery scan of ${subnet}`,
      ipAddress: '127.0.0.1',
    });

    return {
      subnet,
      newDevicesFound: newItems.length,
      devices: newItems,
    };
  }
}
