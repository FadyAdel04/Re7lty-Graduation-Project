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
  tripModel?: 'Trip' | 'CorporateTrip';
  trigger?: React.ReactNode;
}

const ReportTripDialog = ({ tripId, tripTitle, tripModel = 'Trip', trigger }: ReportTripDialogProps) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<"spam" | "inappropriate" | "misleading" | "scam" | "unsafe" | "other">("spam");
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
      await contentReportsService.submitReport(tripId, reason, description, tripModel, token || undefined);
      
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors rounded-full">
            <Flag className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background border-border font-cairo" dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-500 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle className="text-xl font-black">إبلاغ عن محتوى غير لائق</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground font-bold">
            هل أنت متأكد من رغبتك في الإبلاغ عن الرحلة "{tripTitle}"؟ سيتم مراجعة هذا البلاغ من قبل المشرفين.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-foreground font-black">سبب الإبلاغ</Label>
            <RadioGroup 
              value={reason} 
              onValueChange={(value) => setReason(value as any)} 
              className="flex flex-col gap-3"
            >
              <div className="flex items-center space-x-2 space-x-reverse bg-muted/30 p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer">
                <RadioGroupItem value="spam" id="spam" className="border-primary text-primary" />
                <Label htmlFor="spam" className="font-bold cursor-pointer text-foreground/80 flex-1">محتوى عشوائي أو احتيالي (Spam)</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse bg-muted/30 p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer">
                <RadioGroupItem value="inappropriate" id="inappropriate" className="border-primary text-primary" />
                <Label htmlFor="inappropriate" className="font-bold cursor-pointer text-foreground/80 flex-1">محتوى غير لائق أو مسيء</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse bg-muted/30 p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer">
                <RadioGroupItem value="misleading" id="misleading" className="border-primary text-primary" />
                <Label htmlFor="misleading" className="font-bold cursor-pointer text-foreground/80 flex-1">معلومات مضللة أو غير صحيحة</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse bg-rose-500/5 p-3 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer">
                <RadioGroupItem value="scam" id="scam" className="border-rose-500 text-rose-500" />
                <Label htmlFor="scam" className="font-black cursor-pointer text-rose-500 flex-1">احتيال أو عملية نصب (Scam)</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse bg-orange-500/5 p-3 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer">
                <RadioGroupItem value="unsafe" id="unsafe" className="border-orange-500 text-orange-500" />
                <Label htmlFor="unsafe" className="font-black cursor-pointer text-orange-500 flex-1">محتوى غير آمن أو خطير</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse bg-muted/30 p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer">
                <RadioGroupItem value="other" id="other" className="border-primary text-primary" />
                <Label htmlFor="other" className="font-bold cursor-pointer text-foreground/80 flex-1">سبب آخر</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground font-black">تفاصيل إضافية (اختياري)</Label>
            <Textarea
              id="description"
              placeholder="يرجى تزويدنا بمزيد من التفاصيل..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none bg-muted/50 border-border focus:ring-primary/20 text-foreground rounded-2xl min-h-[100px]"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              disabled={loading}
              className="rounded-xl border-border text-foreground hover:bg-muted font-bold"
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              variant="destructive" 
              disabled={loading}
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black px-6 shadow-lg shadow-rose-500/20"
            >
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
