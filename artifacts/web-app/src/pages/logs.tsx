import React, { useEffect, useRef } from "react";
import { useGetBotLogs, getGetBotLogsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Logs() {
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const { data: logsData } = useGetBotLogs({ limit: 500 }, {
    query: {
      queryKey: getGetBotLogsQueryKey({ limit: 500 }),
      refetchInterval: 2000,
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logsData]);

  const handleClear = () => {
    // There is no endpoint to clear logs, so we just clear the local cache for now 
    // or let it be read-only if we can't clear backend
    queryClient.setQueryData(getGetBotLogsQueryKey({ limit: 500 }), []);
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Logs</h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time automation event stream.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Trash2 className="w-4 h-4 mr-2" />
          Clear View
        </Button>
      </div>

      <Card className="flex-1 min-h-[500px] bg-black border-border relative overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs md:text-sm space-y-1.5">
          {!logsData?.length && (
            <div className="text-muted-foreground text-center py-12">No logs available</div>
          )}
          {logsData?.map((log) => {
            let colorClass = 'text-muted-foreground';
            let bgClass = '';
            
            if (log.level === 'error') { colorClass = 'text-destructive'; bgClass = 'bg-destructive/10'; }
            if (log.level === 'warn') { colorClass = 'text-yellow-500'; bgClass = 'bg-yellow-500/10'; }
            if (log.level === 'success') { colorClass = 'text-emerald-500'; }
            if (log.level === 'info') { colorClass = 'text-blue-400'; }

            return (
              <div key={log.id} className={`flex gap-3 p-1 rounded hover:bg-white/5 transition-colors ${bgClass}`}>
                <span className="text-muted-foreground opacity-50 shrink-0 w-20">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                <span className={`shrink-0 uppercase w-14 font-bold ${colorClass}`}>
                  {log.level}
                </span>
                {log.rowNumber ? (
                  <span className="shrink-0 bg-primary/20 text-primary px-1.5 rounded text-[10px] flex items-center">
                    R{log.rowNumber}
                  </span>
                ) : (
                  <span className="shrink-0 w-8"></span>
                )}
                <span className={`text-foreground/90 break-words ${log.level === 'error' ? 'font-medium text-destructive-foreground' : ''}`}>
                  {log.message}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </Card>
    </div>
  );
}
