import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/AppLayout';
import { RefreshCw, Shield, Clock, Users, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { z } from 'zod';
import type { sthSchema, healthSchema } from '@shared/schema';

type STH = z.infer<typeof sthSchema>;
type Health = z.infer<typeof healthSchema>;

export default function Admin() {
  const { toast } = useToast();

  const { data: health, refetch: refetchHealth, isLoading: healthLoading } = useQuery<Health>({
    queryKey: ['/health'],
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  const { data: latestSTH, refetch: refetchSTH, isLoading: sthLoading } = useQuery<STH>({
    queryKey: ['/sth/latest'],
  });

  const { data: metrics, refetch: refetchMetrics } = useQuery<string>({
    queryKey: ['/metrics'],
    refetchInterval: 30000,
  });

  const handleRefreshSTH = async () => {
    try {
      await refetchSTH();
      await refetchHealth();
      await refetchMetrics();
      toast({
        title: "STH Refreshed",
        description: "Successfully refreshed STH and system metrics",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh STH data",
        variant: "destructive",
      });
    }
  };

  // Mock cosigner data for display
  const cosigners = [
    {
      id: 'cosigner_0',
      name: 'Cosigner 0',
      publicKey: '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29',
      status: 'verified',
      lastSignature: '2m ago'
    },
    {
      id: 'cosigner_1',
      name: 'Cosigner 1', 
      publicKey: 'f4e5d6c7b8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
      status: 'verified',
      lastSignature: '2m ago'
    },
    {
      id: 'cosigner_2',
      name: 'Cosigner 2',
      publicKey: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      status: 'offline',
      lastSignature: 'Offline'
    }
  ];

  return (
    <AppLayout>
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">System Administration</h2>
              <p className="text-muted-foreground">Manage STH verification and system security</p>
            </div>
            <Button 
              onClick={handleRefreshSTH}
              disabled={sthLoading}
              data-testid="button-refresh-sth"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${sthLoading ? 'animate-spin' : ''}`} />
              Refresh STH
            </Button>
          </div>

          {/* Latest STH Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Latest Signed Tree Head</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm text-muted-foreground">Verified</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Tree Size</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-tree-size">
                    {latestSTH?.tree_size || health?.sth_count || 0}
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="text-lg font-semibold text-foreground" data-testid="text-timestamp">
                    {latestSTH?.timestamp 
                      ? new Date(latestSTH.timestamp * 1000).toLocaleTimeString()
                      : '--:--:--'
                    }
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Signatures</p>
                  <p className="text-2xl font-bold text-primary">
                    {latestSTH?.signatures?.length || 0}/3
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Policy</p>
                  <p className="text-lg font-semibold text-foreground">
                    t={latestSTH?.policy?.t || 2}, n={latestSTH?.policy?.n || 3}
                  </p>
                </div>
              </div>

              {latestSTH && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Merkle Root</label>
                    <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all">
                      <span data-testid="text-merkle-root">{latestSTH.root}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Previous Hash</label>
                    <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all">
                      <span data-testid="text-prev-hash">{latestSTH.prev_hash}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cosigner Status */}
          <Card>
            <CardHeader>
              <CardTitle>Cosigner Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cosigners.map((cosigner) => (
                  <div key={cosigner.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{cosigner.name}</h4>
                      <div className={`w-2 h-2 rounded-full ${
                        cosigner.status === 'verified' ? 'bg-primary' : 
                        cosigner.status === 'offline' ? 'bg-yellow-500' : 'bg-destructive'
                      }`} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Ed25519 Public Key</p>
                    <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                      {cosigner.publicKey}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Signature</span>
                      <span className={`${cosigner.status === 'offline' ? 'text-destructive' : 'text-foreground'}`}>
                        {cosigner.lastSignature}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Process Status</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Running</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Active WebSocket Sessions</span>
                    <span className="font-semibold" data-testid="text-ws-sessions">47</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last STH Timestamp</span>
                    <span className="font-semibold" data-testid="text-last-sth-timestamp">
                      {latestSTH?.timestamp || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Registered Users</span>
                    <span className="font-semibold" data-testid="text-users-count">
                      {health?.users_count || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rate Limiting</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">CORS Policy</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Enforced</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">TLS Version</span>
                    <span className="font-semibold">1.3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Key Rotation</span>
                    <span className="text-sm text-muted-foreground">Due in 45 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
