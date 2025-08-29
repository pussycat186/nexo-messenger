import { UserRegistration, STH } from '@shared/schema';

export interface StoragePort {
  // Health metrics
  getUserCount(): Promise<number>;
  getSTHCount(): Promise<number>;
  
  // User registrations
  appendUserRegistration(user: UserRegistration): Promise<void>;
  listUserRegistrations(): Promise<UserRegistration[]>;
  
  // STH operations
  appendSTH(sth: STH): Promise<void>;
  getLatestSTH(): Promise<STH | null>;
  listSTH(limit?: number): Promise<STH[]>;
}
