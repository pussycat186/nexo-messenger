import { Request, Response } from 'express';
import { storage } from '../../storage';
import { healthSchema } from '@shared/schema';

export async function healthHandler(req: Request, res: Response) {
  try {
    const [users_count, sth_count] = await Promise.all([
      storage.getUserCount(),
      storage.getSTHCount(),
    ]);

    const healthData = {
      status: "healthy" as const,
      timestamp: Math.floor(Date.now() / 1000),
      users_count,
      sth_count,
    };

    // Validate response
    const parsed = healthSchema.parse(healthData);
    res.json(parsed);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ message: 'Health check failed' });
  }
}
