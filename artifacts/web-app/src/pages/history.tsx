import React from "react";
import { useGetBotHistory, getGetBotHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

export default function History() {
  const { data: historyData, isLoading } = useGetBotHistory({
    query: {
      queryKey: getGetBotHistoryQueryKey()
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">Completed</Badge>;
      case 'running': return <Badge className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/20">Running</Badge>;
      case 'stopped': return <Badge variant="secondary">Stopped</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Run History</h2>
        <p className="text-sm text-muted-foreground mt-1">Archive of past automation sessions.</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right text-emerald-500">Success</TableHead>
                <TableHead className="text-right text-destructive">Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading history...</TableCell>
                </TableRow>
              ) : !historyData?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No run history found.</TableCell>
                </TableRow>
              ) : (
                historyData.map((run) => {
                  const start = new Date(run.startedAt);
                  const end = run.completedAt ? new Date(run.completedAt) : new Date();
                  const duration = formatDistanceToNow(start, { addSuffix: true });
                  
                  return (
                    <TableRow key={run.id} className="border-border hover:bg-secondary/10">
                      <TableCell className="font-medium">{getStatusBadge(run.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {start.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {run.completedAt ? duration : 'In progress...'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{run.totalRows}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-500">{run.processedRows}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">{run.failedRows}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
