import React from "react";
import { 
  useGetBotStatus, 
  getGetBotStatusQueryKey,
  useStartBot,
  useStopBot,
  useGetBotLogs,
  getGetBotLogsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Square, Activity, AlertCircle, CheckCircle2, Database } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = {
  idle: "TAYYOR",
  running: "ISHLAYAPTI",
  stopping: "TO'XTATILMOQDA",
  error: "XATO",
  completed: "YAKUNLANDI",
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: statusData } = useGetBotStatus({
    query: {
      queryKey: getGetBotStatusQueryKey(),
      refetchInterval: 2000,
    }
  });

  const isRunning = statusData?.status === 'running' || statusData?.status === 'stopping';

  const { data: logsData } = useGetBotLogs({ limit: 20 }, {
    query: {
      queryKey: getGetBotLogsQueryKey({ limit: 20 }),
      refetchInterval: isRunning ? 2000 : false,
    }
  });

  const startBot = useStartBot();
  const stopBot = useStopBot();

  const handleStart = () => {
    if (!statusData?.hasExcelFile) {
      toast({
        title: "Ma'lumot yo'q",
        description: "Avval Excel fayl yuklang.",
        variant: "destructive"
      });
      return;
    }
    startBot.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Bot ishga tushdi" });
        queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Botni ishga tushirib bo'lmadi", description: err?.error || "Noma'lum xato", variant: "destructive" });
      }
    });
  };

  const handleStop = () => {
    stopBot.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "To'xtatish signali yuborildi" });
        queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
      }
    });
  };

  const progressValue = statusData?.totalRows 
    ? ((statusData.processedRows + statusData.failedRows) / statusData.totalRows) * 100 
    : 0;

  const LOG_LEVEL_LABELS: Record<string, string> = {
    info: "AXBOROT",
    warn: "OGOHLANTIRISH",
    error: "XATO",
    success: "MUVAFFAQ",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Boshqaruv paneli</h2>
          <p className="text-sm text-muted-foreground mt-1">Bot holati va boshqaruvi.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleStart} 
            disabled={isRunning || startBot.isPending}
            className="w-36 bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-start-bot"
          >
            <Play className="w-4 h-4 mr-2" />
            Botni ishga tushir
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleStop} 
            disabled={!isRunning || stopBot.isPending}
            className="w-32"
            data-testid="button-stop-bot"
          >
            <Square className="w-4 h-4 mr-2" />
            To'xtatish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Holat</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold uppercase tracking-wider text-foreground">
              {STATUS_LABELS[statusData?.status || ''] || statusData?.status || 'NOMA\'LUM'}
            </div>
            {statusData?.startedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Boshlangan: {new Date(statusData.startedAt).toLocaleTimeString('uz-UZ')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Muvaffaqiyatli</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusData?.processedRows || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Saqlangan qatorlar soni</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Xatolik</CardTitle>
            <AlertCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statusData?.failedRows || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Xato bilan o'tgan qatorlar</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jami qatorlar</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusData?.totalRows || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Excel fayldagi jami qator</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Bajarilish jarayoni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Bajarildi</span>
            <span className="font-mono font-medium">{progressValue.toFixed(1)}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">So'nggi loglar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black/50 rounded-md p-4 font-mono text-xs overflow-y-auto max-h-64 border border-border space-y-1.5">
            {!logsData?.length && (
              <div className="text-muted-foreground text-center py-4">Loglar yo'q</div>
            )}
            {logsData?.map((log) => {
              let color = 'text-muted-foreground';
              if (log.level === 'error') color = 'text-destructive';
              if (log.level === 'warn') color = 'text-yellow-500';
              if (log.level === 'success') color = 'text-emerald-500';
              if (log.level === 'info') color = 'text-blue-400';

              return (
                <div key={log.id} className="flex gap-3 items-start">
                  <span className="text-muted-foreground opacity-50 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('uz-UZ')}
                  </span>
                  <span className={`shrink-0 uppercase w-16 font-bold text-[10px] ${color}`}>
                    {LOG_LEVEL_LABELS[log.level] || log.level}
                  </span>
                  {log.rowNumber && (
                    <span className="shrink-0 bg-primary/20 text-primary px-1 rounded text-[10px]">
                      Q{log.rowNumber}
                    </span>
                  )}
                  <span className="text-foreground break-all">{log.message}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
