import { Request, Response } from 'express';
import { storage } from '../../storage';
import { getTransport } from '../adapters/wsTransport';

export async function metricsHandler(req: Request, res: Response) {
  try {
    const [users_count, sth_count] = await Promise.all([
      storage.getUserCount(),
      storage.getSTHCount(),
    ]);
    
    const latestSTH = await storage.getLatestSTH();
    const last_sth_timestamp = latestSTH ? latestSTH.timestamp : 0;
    
    const transport = getTransport();
    const ws_sessions = transport.getActiveConnections();

    const metrics = [
      '# HELP process_up Whether the process is running',
      '# TYPE process_up gauge',
      'process_up 1',
      '',
      '# HELP users_count Total number of registered users',
      '# TYPE users_count gauge',
      `users_count ${users_count}`,
      '',
      '# HELP sth_count Total number of STH entries',
      '# TYPE sth_count gauge',
      `sth_count ${sth_count}`,
      '',
      '# HELP ws_sessions Number of active WebSocket sessions',
      '# TYPE ws_sessions gauge',
      `ws_sessions ${ws_sessions}`,
      '',
      '# HELP last_sth_timestamp Timestamp of the latest STH',
      '# TYPE last_sth_timestamp gauge',
      `last_sth_timestamp ${last_sth_timestamp}`,
      '',
    ].join('\n');

    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    console.error('Metrics collection failed:', error);
    res.status(500).send('# Metrics collection failed\n');
  }
}
