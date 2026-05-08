import React from "react";
import { useGetBotHistory, getGetBotHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";

export default function History() {
  const { data: historyData, isLoading } = useGetBotHistory({
    query: {
      queryKey: getGetBotHistoryQueryKey()
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">Yakunlandi</Badge>;
      case 'running': return <Badge className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/20">Ishlayapti</Badge>;
      case 'stopped': return <Badge variant="secondary">To'xtatildi</Badge>;
      case 'error': return <Badge variant="destructive">Xato</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ishlar tarixi</h2>
        <p className="text-sm text-muted-foreground mt-1">O'tgan avtomatlashtirish sessiyalari arxivi.</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[140px]">Holat</TableHead>
                <TableHead>Boshlangan vaqt</TableHead>
                <TableHead>Davomiyligi</TableHead>
                <TableHead className="text-right">Jami</TableHead>
                <TableHead className="text-right text-emerald-500">Muvaffaq</TableHead>
                <TableHead className="text-right text-destructive">Xato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Yuklanmoqda...</TableCell>
                </TableRow>
              ) : !historyData?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Tarix topilmadi.</TableCell>
                </TableRow>
              ) : (
                historyData.map((run) => {
                  const start = new Date(run.startedAt);
                  const duration = formatDistanceToNow(start, { addSuffix: true, locale: uz });
                  
                  return (
                    <TableRow key={run.id} className="border-border hover:bg-secondary/10" data-testid={`row-history-${run.id}`}>
                      <TableCell className="font-medium">{getStatusBadge(run.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {start.toLocaleString('uz-UZ')}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {run.completedAt ? duration : 'Davom etmoqda...'}
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
