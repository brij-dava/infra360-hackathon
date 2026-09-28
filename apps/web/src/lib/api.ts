import { IUser, UserRole } from '@infra360/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiClient {
  private static currentRole: UserRole = 'ADMIN';

  public static setRole(role: UserRole) {
    this.currentRole = role;
    localStorage.setItem('infra360_role', role);
  }

  public static getRole(): UserRole {
    const saved = localStorage.getItem('infra360_role');
    if (saved) {
      this.currentRole = saved as UserRole;
    }
    return this.currentRole;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    headers.set('X-Mock-Role', this.getRole());

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // Auth & Personas
  public static async getPersonas(): Promise<{ users: IUser[] }> {
    return this.request('/auth/personas');
  }

  public static async getHealth(): Promise<any> {
    return this.request('/health');
  }

  // Dashboard & Analytics
  public static async getDashboardKPIs(): Promise<any> {
    return this.request('/analytics/dashboard');
  }

  public static async getRepairVsReplace(assetTag: string): Promise<any> {
    return this.request(`/analytics/repair-replace/${assetTag}`);
  }

  // Assets
  public static async getAssets(params: Record<string, any> = {}): Promise<any> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        qs.append(k, String(v));
      }
    });
    return this.request(`/assets?${qs.toString()}`);
  }

  public static async getAsset(assetTag: string): Promise<any> {
    return this.request(`/assets/${assetTag}`);
  }

  public static async createAsset(data: any): Promise<any> {
    return this.request('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateAsset(assetTag: string, data: any): Promise<any> {
    return this.request(`/assets/${assetTag}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async transitionLifecycle(assetTag: string, targetStage: string, reason: string): Promise<any> {
    return this.request(`/assets/${assetTag}/lifecycle`, {
      method: 'POST',
      body: JSON.stringify({ targetStage, reason }),
    });
  }

  public static async getAssetQr(assetTag: string): Promise<any> {
    return this.request(`/assets/${assetTag}/qr`);
  }

  // Topology & Blast Radius
  public static async getTopology(): Promise<any> {
    return this.request('/topology');
  }

  public static async getBlastRadius(assetTag: string): Promise<any> {
    return this.request(`/topology/blast-radius/${assetTag}`);
  }

  // Discovery & Shadow IT
  public static async getDiscoveredDevices(status?: string): Promise<any> {
    const qs = status ? `?status=${status}` : '';
    return this.request(`/discovery${qs}`);
  }

  public static async triageDevice(id: string, action: string, targetCategory?: string): Promise<any> {
    return this.request(`/discovery/${id}/triage`, {
      method: 'POST',
      body: JSON.stringify({ action, targetCategory }),
    });
  }

  public static async triggerDiscoveryScan(subnet?: string): Promise<any> {
    return this.request('/discovery/scan', {
      method: 'POST',
      body: JSON.stringify({ subnet }),
    });
  }

  // Maintenance
  public static async getMaintenance(assetTag?: string): Promise<any> {
    const qs = assetTag ? `?assetTag=${assetTag}` : '';
    return this.request(`/maintenance${qs}`);
  }

  public static async createMaintenance(data: any): Promise<any> {
    return this.request('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateMaintenance(id: string, data: any): Promise<any> {
    return this.request(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Predictive ML
  public static async getPredictiveFailure(assetTag: string): Promise<any> {
    return this.request(`/predictive/${assetTag}`);
  }

  public static async getFleetHighRisk(): Promise<any> {
    return this.request('/predictive/fleet');
  }

  // AI
  public static async queryAI(query: string): Promise<any> {
    return this.request('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  public static async chatAI(prompt: string, assetTag?: string): Promise<any> {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, assetTag }),
    });
  }

  // Audit
  public static async getAuditLogs(params: Record<string, any> = {}): Promise<any> {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/audit?${qs}`);
  }
}
