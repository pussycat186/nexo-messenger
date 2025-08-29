import * as fs from 'fs/promises';
import * as path from 'path';
import { StoragePort } from '../ports/storage';
import { UserRegistration, STH, userRegistrationSchema, sthSchema } from '@shared/schema';

class FileStore implements StoragePort {
  private usersFile = path.join(process.cwd(), 'server', '_data', 'users.jsonl');
  private sthFile = path.join(process.cwd(), 'server', '_data', 'sth.jsonl');

  async getUserCount(): Promise<number> {
    try {
      const data = await fs.readFile(this.usersFile, 'utf-8');
      return data.trim().split('\n').filter(line => line.trim()).length;
    } catch (error) {
      return 0;
    }
  }

  async getSTHCount(): Promise<number> {
    try {
      const data = await fs.readFile(this.sthFile, 'utf-8');
      return data.trim().split('\n').filter(line => line.trim()).length;
    } catch (error) {
      return 0;
    }
  }

  async appendUserRegistration(user: UserRegistration): Promise<void> {
    const validated = userRegistrationSchema.parse(user);
    const line = JSON.stringify(validated) + '\n';
    await fs.appendFile(this.usersFile, line);
  }

  async listUserRegistrations(): Promise<UserRegistration[]> {
    try {
      const data = await fs.readFile(this.usersFile, 'utf-8');
      const lines = data.trim().split('\n').filter(line => line.trim());
      return lines.map(line => userRegistrationSchema.parse(JSON.parse(line)));
    } catch (error) {
      return [];
    }
  }

  async appendSTH(sth: STH): Promise<void> {
    const validated = sthSchema.parse(sth);
    const line = JSON.stringify(validated) + '\n';
    await fs.appendFile(this.sthFile, line);
  }

  async getLatestSTH(): Promise<STH | null> {
    try {
      const data = await fs.readFile(this.sthFile, 'utf-8');
      const lines = data.trim().split('\n').filter(line => line.trim());
      if (lines.length === 0) return null;
      
      const lastLine = lines[lines.length - 1];
      return sthSchema.parse(JSON.parse(lastLine));
    } catch (error) {
      return null;
    }
  }

  async listSTH(limit = 10): Promise<STH[]> {
    try {
      const data = await fs.readFile(this.sthFile, 'utf-8');
      const lines = data.trim().split('\n').filter(line => line.trim());
      const parsed = lines.map(line => sthSchema.parse(JSON.parse(line)));
      
      // Return newest first
      return parsed.reverse().slice(0, limit);
    } catch (error) {
      return [];
    }
  }
}

let storageInstance: FileStore;

export function getStorage(): StoragePort {
  if (!storageInstance) {
    storageInstance = new FileStore();
  }
  return storageInstance;
}
