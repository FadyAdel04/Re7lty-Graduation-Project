import { useUploadProgress } from '@/contexts/UploadProgressContext';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle2, XCircle } from 'lucide-react';

export function UploadProgressBar() {
  const { uploads } = useUploadProgress();

  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {uploads.map((upload) => (
        <Card
          key={upload.id}
          className="shadow-lg border-2 animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-center gap-3 p-3">
            {upload.status === 'uploading' && (
              <Upload className="h-5 w-5 text-primary animate-pulse" />
            )}
            {upload.status === 'completed' && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {upload.status === 'error' && (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{upload.fileName}</p>
              {upload.status === 'uploading' && (
                <Progress value={upload.progress} className="h-2 mt-1" />
              )}
              {upload.status === 'error' && (
                <p className="text-xs text-destructive mt-1">
                  {upload.error || 'فشل التحميل'}
                </p>
              )}
              {upload.status === 'completed' && (
                <p className="text-xs text-green-600 mt-1">تم التحميل بنجاح</p>
              )}
            </div>
            
            {upload.status === 'uploading' && (
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {Math.round(upload.progress)}%
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
