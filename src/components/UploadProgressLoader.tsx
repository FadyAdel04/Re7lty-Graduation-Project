import { useState, useEffect } from "react";
import { Bus, Image as ImageIcon, Video, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";

interface UploadProgressLoaderProps {
  totalItems: number;
  completedItems: number;
  currentItem?: string;
  isProcessing?: boolean;
}

const UploadProgressLoader = ({ 
  totalItems, 
  completedItems, 
  currentItem,
  isProcessing = false 
}: UploadProgressLoaderProps) => {
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardContent className="p-6 space-y-6">
          {/* Animated Bus */}
          <div className="relative h-32 flex items-center justify-center">
            <div className="absolute inset-0 overflow-hidden">
              {/* Road */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2">
                <div className="h-full bg-primary/20 animate-[roadMove_1s_linear_infinite]" />
              </div>
              
              {/* Bus Animation */}
              <Bus 
                className="h-12 w-12 text-primary absolute top-1/2 -translate-y-1/2 animate-[busTravel_2s_ease-in-out_infinite]"
                style={{ left: '10%' }}
              />
              
              {/* Destination Marker */}
              <div className="absolute top-1/2 right-8 -translate-y-1/2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                  <div className="h-4 w-4 rounded-full bg-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Progress Info */}
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {isProcessing ? "جاري معالجة الملفات..." : "جاري رفع الملفات..."}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentItem || `معالجة ${completedItems} من ${totalItems}`}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedItems} / {totalItems}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Icons */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <ImageIcon className={`h-5 w-5 ${completedItems > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">صور</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className={`h-5 w-5 ${completedItems > totalItems / 2 ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">فيديوهات</span>
              </div>
            </div>

            {/* Loading Spinner */}
            <div className="flex justify-center pt-2">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadProgressLoader;

