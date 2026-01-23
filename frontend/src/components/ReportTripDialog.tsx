import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Flag, Loader2, AlertTriangle } from "lucide-react";
import { contentReportsService } from "@/services/contentReportsService";
import { useUser, useAuth } from "@clerk/clerk-react";

interface ReportTripDialogProps {
  tripId: string;
  tripTitle: string;
  trigger?: React.ReactNode;
}

const ReportTripDialog = ({ tripId, tripTitle, trigger }: ReportTripDialogProps) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<"spam" | "inappropriate" | "misleading" | "other">("spam");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يرجى تسجيل الدخول للإبلاغ عن محتوى",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
    const token = await getToken();
      await contentReportsService.submitReport(tripId, reason, description, token || undefined);
      
      toast({
        title: "تم استلام البلاغ",
        description: "شكراً لمساعدتنا في الحفاظ على أمان مجتمعنا. سنقوم بمراجعة البلاغ قريباً.",
      });

      setOpen(false);
      setDescription("");
      setReason("spam");
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.response?.data?.error || "حدث خطأ أثناء إرسال البلاغ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors">
            <Flag className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>إبلاغ عن محتوى غير لائق</DialogTitle>
          </div>
          <DialogDescription>
            هل أنت متأكد من رغبتك في الإبلاغ عن الرحلة "{tripTitle}"؟ سيتم مراجعة هذا البلاغ من قبل المشرفين.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>سبب الإبلاغ</Label>
            <RadioGroup 
              value={reason} 
              onValueChange={(value) => setReason(value as any)} 
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="spam" id="spam" />
                <Label htmlFor="spam" className="font-normal cursor-pointer">محتوى عشوائي أو احتيالي (Spam)</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="inappropriate" id="inappropriate" />
                <Label htmlFor="inappropriate" className="font-normal cursor-pointer">محتوى غير لائق أو مسيء</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="misleading" id="misleading" />
                <Label htmlFor="misleading" className="font-normal cursor-pointer">معلومات مضللة أو غير صحيحة</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal cursor-pointer">سبب آخر</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">تفاصيل إضافية (اختياري)</Label>
            <Textarea
              id="description"
              placeholder="يرجى تزويدنا بمزيد من التفاصيل..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                "إرسال البلاغ"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportTripDialog;
