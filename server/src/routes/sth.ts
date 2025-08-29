import { Request, Response } from 'express';
import { storage } from '../../storage';

export async function sthLatestHandler(req: Request, res: Response) {
  try {
    const latest = await storage.getLatestSTH();
    if (!latest) {
      return res.status(404).json({ detail: "No STH found" });
    }
    res.json(latest);
  } catch (error) {
    console.error('Failed to get latest STH:', error);
    res.status(500).json({ message: 'Failed to get latest STH' });
  }
}

export async function sthChainHandler(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const chain = await storage.listSTH(limit);
    res.json(chain);
  } catch (error) {
    console.error('Failed to get STH chain:', error);
    res.status(500).json({ message: 'Failed to get STH chain' });
  }
}
