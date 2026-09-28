import fs from 'fs';
import path from 'path';
import {
  IAsset,
  IRelationship,
  IMaintenanceRecord,
  IDiscoveredDevice,
  IAuditLog,
  IUser,
} from '@infra360/types';

function getNestedValue(obj: any, pathStr: string): any {
  if (!obj) return undefined;
  if (!pathStr.includes('.')) return obj[pathStr];
  const parts = pathStr.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[part];
  }
  return curr;
}

function matchFilter(doc: any, filter: Record<string, any>): boolean {
  for (const key of Object.keys(filter)) {
    const filterVal = filter[key];

    // Special logical operators
    if (key === '$or' && Array.isArray(filterVal)) {
      const orMatched = filterVal.some((subFilter) => matchFilter(doc, subFilter));
      if (!orMatched) return false;
      continue;
    }
    if (key === '$and' && Array.isArray(filterVal)) {
      const andMatched = filterVal.every((subFilter) => matchFilter(doc, subFilter));
      if (!andMatched) return false;
      continue;
    }

    const docVal = getNestedValue(doc, key);

    // Operator object matching, e.g. { $gte: 70, $lte: 90 }
    if (
      filterVal !== null &&
      typeof filterVal === 'object' &&
      !Array.isArray(filterVal) &&
      !(filterVal instanceof Date)
    ) {
      for (const op of Object.keys(filterVal)) {
        const target = filterVal[op];
        if (op === '$eq' && docVal !== target) return false;
        if (op === '$ne' && docVal === target) return false;
        if (op === '$gt' && !(docVal > target)) return false;
        if (op === '$gte' && !(docVal >= target)) return false;
        if (op === '$lt' && !(docVal < target)) return false;
        if (op === '$lte' && !(docVal <= target)) return false;
        if (op === '$in' && Array.isArray(target) && !target.includes(docVal)) return false;
        if (op === '$nin' && Array.isArray(target) && target.includes(docVal)) return false;
        if (op === '$regex') {
          const regex = new RegExp(target, filterVal.$options || 'i');
          if (typeof docVal !== 'string' || !regex.test(docVal)) return false;
        }
      }
    } else {
      // Direct equality
      if (docVal !== filterVal) {
        return false;
      }
    }
  }
  return true;
}

export class Collection<T extends { id?: string; _id?: any }> {
  private items: T[] = [];
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  public find(filter: Record<string, any> = {}): T[] {
    if (Object.keys(filter).length === 0) {
      return [...this.items];
    }
    return this.items.filter((item) => matchFilter(item, filter));
  }

  public findOne(filter: Record<string, any> = {}): T | null {
    const results = this.find(filter);
    return results.length > 0 ? results[0] : null;
  }

  public insertOne(doc: T): T {
    const copy = { ...doc };
    if (!copy.id && !copy._id) {
      (copy as any).id = `DOC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
    this.items.push(copy);
    return copy;
  }

  public insertMany(docs: T[]): T[] {
    return docs.map((doc) => this.insertOne(doc));
  }

  public updateOne(filter: Record<string, any>, update: Partial<T> | Record<string, any>): T | null {
    const item = this.findOne(filter);
    if (!item) return null;

    const u = update as any;
    if (u.$set) {
      Object.assign(item, u.$set);
    } else {
      Object.assign(item, update);
    }
    return item;
  }

  public deleteOne(filter: Record<string, any>): boolean {
    const idx = this.items.findIndex((item) => matchFilter(item, filter));
    if (idx !== -1) {
      this.items.splice(idx, 1);
      return true;
    }
    return false;
  }

  public count(filter: Record<string, any> = {}): number {
    return this.find(filter).length;
  }

  public clear(): void {
    this.items = [];
  }
}

class Database {
  public assets = new Collection<IAsset>('assets');
  public relationships = new Collection<IRelationship>('relationships');
  public maintenance = new Collection<IMaintenanceRecord>('maintenance');
  public discovery = new Collection<IDiscoveredDevice>('discovery');
  public audit = new Collection<IAuditLog>('audit');
  public users = new Collection<IUser>('users');

  private isSeeded = false;

  public markSeeded(): void {
    this.isSeeded = true;
  }

  public isAlreadySeeded(): boolean {
    return this.isSeeded && this.assets.count() > 0;
  }
}

export const db = new Database();
