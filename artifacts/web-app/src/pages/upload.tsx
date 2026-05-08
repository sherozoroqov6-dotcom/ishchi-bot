import React, { useRef, useState } from "react";
import { 
  useUploadExcel,
  useGetExcelPreview,
  getGetExcelPreviewQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Upload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useUploadExcel();

  const { data: previewData, isLoading: previewLoading } = useGetExcelPreview({
    query: {
      queryKey: getGetExcelPreviewQueryKey(),
    }
  });

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx, .xls)",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    uploadMutation.mutate({ data: { file } as any }, {
      onSuccess: () => {
        toast({ title: "File uploaded successfully" });
        queryClient.invalidateQueries({ queryKey: getGetExcelPreviewQueryKey() });
      },
      onError: (err) => {
        toast({ 
          title: "Upload failed", 
          description: err.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Excel Upload</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload the employment data file for automation processing.</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors flex flex-col items-center justify-center ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              {uploadMutation.isPending ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <UploadCloud className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-medium mb-1">Drag & drop your Excel file here</h3>
            <p className="text-sm text-muted-foreground mb-6">Or click below to browse your files. Supports .xlsx and .xls</p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              Select File
            </Button>
          </div>
        </CardContent>
      </Card>

      {(previewLoading || previewData) && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-primary" />
              Data Preview
            </CardTitle>
            <CardDescription>
              {previewData ? `${previewData.totalCount} rows detected in uploaded file.` : 'Loading preview...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previewLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : previewData?.rows && previewData.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground">
                    <tr>
                      {previewData.headers.map((h, i) => (
                        <th key={i} className="px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewData.rows.map((row: any, i) => (
                      <tr key={i} className="hover:bg-secondary/20">
                        {previewData.headers.map((h, j) => (
                          <td key={j} className="px-4 py-2 max-w-[200px] truncate text-foreground/80">
                            {row[h] !== null ? String(row[h]) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No preview data available.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
