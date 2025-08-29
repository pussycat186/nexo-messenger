import { type User, type InsertUser, type UserRegistration, type STH } from "@shared/schema";
import { getStorage } from "./src/adapters/fileStore";

// Storage interface for NEXO
export interface IStorage {
  // Health data
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

// Use file storage adapter
export const storage = getStorage();
