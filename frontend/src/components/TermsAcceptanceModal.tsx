import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useAuth } from "@clerk/clerk-react";
import { ShieldCheck, Lock, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/config/api";

export function TermsAcceptanceModal() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
       // Check if user has accepted terms in DB (synced to Clerk metadata)
       // We cast strictly to boolean to handle undefined
       const hasAccepted = !!user.publicMetadata?.hasAcceptedTerms;
       
       if (!hasAccepted) {
          // Add a small delay for better UX and to ensure data is settled
          const timer = setTimeout(() => setIsOpen(true), 1500);
          return () => clearTimeout(timer);
       } else {
          setIsOpen(false);
       }
    }
  }, [isLoaded, isSignedIn, user]);

  const handleAccept = async () => {
     if (!user) return;
     if (!agreed) return;
     
     setIsSubmitting(true);
     try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ hasAcceptedTerms: true })
        });

        if (response.ok) {
            // Reload user to update publicMetadata locally so modal closes and TourGuide can start
            await user.reload();
            setIsOpen(false);
        } else {
            console.error("Failed to update terms acceptance");
        }
     } catch (err) {
        console.error("Error accepting terms:", err);
     } finally {
        setIsSubmitting(false);
     }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        // Prevent closing by clicking outside or pressing ESC if not accepted
        if (!open && !agreed) return; 
        // Also prevent closing if submitting
        if (isSubmitting) return;
        setIsOpen(open);
    }}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col font-cairo p-0 overflow-hidden rounded-[2rem] border-0" dir="rtl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <div className="bg-indigo-600 p-8 text-white flex items-center justify-between shrink-0">
            <div>
                <DialogTitle className="text-2xl font-black mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-indigo-200" />
                     تحديث الشروط والسياسات
                </DialogTitle>
                <DialogDescription className="text-indigo-100 font-bold">
                    يرجى قراءة والموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة
                </DialogDescription>
            </div>
            <div className="hidden md:block bg-white/10 p-3 rounded-2xl">
                <Lock className="w-8 h-8 text-white/80" />
            </div>
        </div>

        <Tabs defaultValue="terms" className="flex-1 flex flex-col min-h-0">
            <div className="px-8 pt-6 shrink-0">
                <TabsList className="w-full h-12 p-1 bg-gray-100/80 rounded-xl grid grid-cols-2">
                    <TabsTrigger value="terms" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">شروط الاستخدام</TabsTrigger>
                    <TabsTrigger value="privacy" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">سياسة الخصوصية</TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 min-h-0 relative">
                <ScrollArea className="h-full px-8 py-6" dir="rtl">
                    <TabsContent value="terms" className="mt-0 space-y-6 pb-20">
                        <div className="prose prose-lg max-w-none text-right">
                            <h3 className="font-black text-gray-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                1. قبول الشروط
                            </h3>
                            <p className="text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                من خلال الوصول إلى واستخدام منصة رحلتي، فإنك تقبل وتوافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، فيجب عليك عدم استخدام المنصة.
                            </p>

                            <h3 className="font-black text-gray-900 mt-8 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                2. استخدام المنصة
                            </h3>
                            <p className="text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                يمكنك استخدام منصة رحلتي للأغراض القانونية فقط. أنت توافق على عدم استخدام المنصة لأي غرض غير قانوني، وعدم محاولة الوصول غير المصرح به، واحترام حقوق الملكية الفكرية للآخرين.
                            </p>

                            <h3 className="font-black text-gray-900 mt-8 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                3. ملكية المحتوى
                            </h3>
                            <p className="text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                أنت تحتفظ بحقوق الملكية الفكرية للمحتوى الذي تنشره. من خلال نشره، فإنك تمنحنا ترخيصاً غير حصري لاستخدامه وعرضه لتمكين ميزات المنصة وتوفير تجربة أفضل للمستخدمين.
                            </p>

                            <h3 className="font-black text-gray-900 mt-8 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                4. مسؤولية الحساب
                            </h3>
                            <p className="text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                أنت مسؤول عن الحفاظ على سرية معلومات حسابك. يجب عليك إبلاغنا فوراً عن أي استخدام غير مصرح به. نحن لسنا مسؤولين عن أي خسارة ناتجة عن عدم التزامك بهذا الالتزام.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="privacy" className="mt-0 space-y-6 pb-20">
                         <div className="prose prose-lg max-w-none text-right">
                            <h3 className="font-black text-gray-900 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-emerald-600" />
                                1. حماية بياناتك
                            </h3>
                            <p className="text-gray-600 font-medium leading-relaxed bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                نحن نستخدم بروتوكولات تشفير (SSL) ومعايير أمان عالمية لحماية معلوماتك الشخصية من الوصول غير المصرح به. بياناتك مشفرة ومخزنة في خوادم آمنة.
                            </p>

                            <h3 className="font-black text-gray-900 mt-8 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-emerald-600" />
                                2. المعلومات التي نجمعها
                            </h3>
                            <p className="text-gray-600 font-medium leading-relaxed bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                نجمع فقط المعلومات الضرورية لتجربتك: الاسم، البريد الإلكتروني، وتفاصيل الرحلات التي تشاركها. لا نجمع أي بيانات حساسة دون موافقتك الصريحة.
                            </p>

                            <h3 className="font-black text-gray-900 mt-8 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-emerald-600" />
                                3. استخدام المعلومات
                            </h3>
                            <p className="text-gray-600 font-medium leading-relaxed bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                تُستخدم بياناتك لتحسين اقتراحات الرحلات، وتخصيص تجربتك على المنصة، وللتواصل معك بخصوص تحديثات حسابك أو محتوى يهمك.
                            </p>

                             <h3 className="font-black text-gray-900 mt-8 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-emerald-600" />
                                4. مشاركة البيانات
                            </h3>
                            <p className="text-gray-600 font-medium leading-relaxed bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                نحن لا نبيع بياناتك لأي طرف ثالث. قد نشارك معلومات محدودة مع شركاء الخدمة (مثل خدمات الخرائط) لتمكين وظائف المنصة الأساسية فقط.
                            </p>
                        </div>
                    </TabsContent>
                </ScrollArea>
            </div>
        </Tabs>

        <DialogFooter className="mr-0 p-8 border-t border-gray-100 bg-white z-20 shrink-0 flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse cursor-pointer" onClick={() => setAgreed(!agreed)}>
                <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(c as boolean)} className="w-6 h-6 border-2 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" />
                <label
                    htmlFor="terms"
                    className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none text-gray-600"
                >
                    قرأت وأوافق على شروط الاستخدام وسياسة الخصوصية
                </label>
            </div>
            <Button 
                onClick={handleAccept} 
                disabled={!agreed}
                className={cn(
                    "w-full sm:w-auto h-12 px-8 rounded-xl font-black text-lg transition-all",
                    agreed 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200" 
                    : "bg-gray-100 text-gray-400"
                )}
            >
                موافق ومتابعة
                <CheckCircle2 className="w-5 h-5 mr-2" />
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
