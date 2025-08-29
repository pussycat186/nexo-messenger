import { z } from "zod";

// DID Registration Schema
export const didRegistrationSchema = z.object({
  id: z.string().min(1, "DID identifier is required"),
  public_key: z.string().regex(/^[A-Za-z0-9+/]+=*$/, "Invalid base64 format").refine(
    (val) => {
      try {
        const decoded = Buffer.from(val, 'base64');
        return decoded.length === 32;
      } catch {
        return false;
      }
    },
    "Public key must be 32 bytes when decoded"
  ),
  timestamp: z.number().int().positive("Timestamp must be positive integer"),
});

// STH (Signed Tree Head) Schema
export const sthSchema = z.object({
  tree_size: z.number().int().min(0),
  root: z.string(),
  prev_hash: z.string(),
  policy: z.object({
    t: z.number().int().min(1),
    n: z.number().int().min(1),
  }),
  timestamp: z.number().int().positive(),
  signatures: z.array(z.object({
    cosigner: z.string(),
    sig: z.string(),
  })),
});

// Health Response Schema
export const healthSchema = z.object({
  status: z.literal("healthy"),
  timestamp: z.number().int().positive(),
  users_count: z.number().int().min(0),
  sth_count: z.number().int().min(0),
});

// WebSocket Message Schema
export const wsMessageSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  payload: z.string(), // base64 encoded opaque payload
});

// User Registration (internal storage)
export const userRegistrationSchema = z.object({
  id: z.string(),
  public_key: z.string(), // base64 encoded
  timestamp: z.number().int().positive(),
  leaf_hash: z.string(), // computed SHA-256 hash
});

// Metrics Schema
export const metricsSchema = z.object({
  process_up: z.number(),
  users_count: z.number().int().min(0),
  sth_count: z.number().int().min(0),
  ws_sessions: z.number().int().min(0),
  last_sth_timestamp: z.number().int().min(0),
});

// Types
export type DIDRegistration = z.infer<typeof didRegistrationSchema>;
export type STH = z.infer<typeof sthSchema>;
export type Health = z.infer<typeof healthSchema>;
export type WSMessage = z.infer<typeof wsMessageSchema>;
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type Metrics = z.infer<typeof metricsSchema>;

// Legacy types for compatibility
export type InsertUser = DIDRegistration;
export type User = UserRegistration;
