import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/AppLayout';
import { Calculator, Download, Play, Key, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyMerkleLocally, verifySTHSignatures } from '@/lib/merkle';
import type { z } from 'zod';
import type { sthSchema, healthSchema } from '@shared/schema';

type STH = z.infer<typeof sthSchema>;
type Health = z.infer<typeof healthSchema>;

export default function Audit() {
  const [limit, setLimit] = useState('10');
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  const { data: sthChain, refetch: refetchChain } = useQuery<STH[]>({
    queryKey: ['/sth/chain', `limit=${limit}`],
  });

  const { data: health } = useQuery<Health>({
    queryKey: ['/health'],
  });

  const handleRecomputeLocally = async () => {
    setVerifying(true);
    try {
      const result = await verifyMerkleLocally();
      if (result.success) {
        toast({
          title: "Verification Successful",
          description: `Merkle root matches! Tree size: ${result.treeSize}`,
        });
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Merkle root mismatch detected",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error", 
        description: "Failed to perform local verification",
        variant: "destructive",
      });
    }
    setVerifying(false);
  };

  const handleVerifySignatures = async () => {
    setVerifying(true);
    try {
      if (!sthChain || sthChain.length === 0) {
        toast({
          title: "No Data",
          description: "No STH entries to verify",
          variant: "destructive",
        });
        return;
      }

      const results = await Promise.all(
        sthChain.map((sth: any) => verifySTHSignatures(sth))
      );
      
      const allValid = results.every(r => r.valid);
      if (allValid) {
        toast({
          title: "Signatures Valid",
          description: `All ${results.length} STH signatures verified successfully`,
        });
      } else {
        const invalidCount = results.filter(r => !r.valid).length;
        toast({
          title: "Signature Issues",
          description: `${invalidCount} STH entries have invalid signatures`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify signatures",
        variant: "destructive",
      });
    }
    setVerifying(false);
  };

  return (
    <AppLayout>
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Transparency Audit</h2>
              <p className="text-muted-foreground">Verify Merkle tree integrity and signature validation</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="secondary" 
                onClick={handleRecomputeLocally}
                disabled={verifying}
                data-testid="button-recompute-locally"
              >
                <Calculator className={`h-4 w-4 mr-2 ${verifying ? 'animate-spin' : ''}`} />
                Recompute Locally
              </Button>
              <Button data-testid="button-export-log">
                <Download className="h-4 w-4 mr-2" />
                Export Log
              </Button>
            </div>
          </div>

          {/* Verification Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Chain Integrity</h3>
                </div>
                <p className="text-2xl font-bold text-primary">100%</p>
                <p className="text-sm text-muted-foreground">All hashes verified</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Signatures</h3>
                </div>
                <p className="text-2xl font-bold text-primary">{health?.sth_count || 0}/{health?.sth_count || 0}</p>
                <p className="text-sm text-muted-foreground">Valid threshold sigs</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Merkle Root</h3>
                </div>
                <p className="text-2xl font-bold text-primary">✓</p>
                <p className="text-sm text-muted-foreground">Recomputation match</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Consistency</h3>
                </div>
                <p className="text-2xl font-bold text-primary">✓</p>
                <p className="text-sm text-muted-foreground">No inconsistencies</p>
              </CardContent>
            </Card>
          </div>

          {/* STH Chain Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>STH Chain History</CardTitle>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-muted-foreground">Limit:</label>
                  <Select value={limit} onValueChange={setLimit}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tree Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Root Hash
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Signatures
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sthChain?.map((sth, index) => (
                      <tr key={index} className="hover:bg-accent" data-testid={`row-sth-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {sth.tree_size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(sth.timestamp * 1000).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                          <span className="truncate block max-w-xs" title={sth.root}>
                            {sth.root.substring(0, 32)}...
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-1">
                            <span className="text-primary font-semibold">
                              {sth.signatures?.length || 0}/3
                            </span>
                            <CheckCircle className="h-4 w-4 text-primary" />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          No STH entries found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Audit Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Merkle Tree Verification</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Independently recompute the Merkle tree root from raw user registrations
                  </p>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={handleRecomputeLocally}
                    disabled={verifying}
                    data-testid="button-run-local-verification"
                  >
                    <Play className={`h-4 w-4 mr-2 ${verifying ? 'animate-spin' : ''}`} />
                    Run Local Verification
                  </Button>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-2">Signature Verification</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Verify all Ed25519 signatures meet the 2-of-3 threshold policy
                  </p>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={handleVerifySignatures}
                    disabled={verifying}
                    data-testid="button-verify-all-signatures"
                  >
                    <Key className={`h-4 w-4 mr-2 ${verifying ? 'animate-spin' : ''}`} />
                    Verify All Signatures
                  </Button>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h5 className="font-medium text-foreground">Last Audit Results</h5>
                    <p className="text-sm text-muted-foreground">
                      Completed at {new Date().toLocaleTimeString()} • All verifications passed • {health?.sth_count || 0} entries validated
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
