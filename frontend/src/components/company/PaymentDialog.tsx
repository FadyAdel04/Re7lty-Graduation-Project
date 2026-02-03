import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Calendar, Lock, CheckCircle2, Loader2 } from "lucide-react";

interface PaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    planName: string;
    price: string;
    onSuccess: () => void;
}

const PaymentDialog = ({ open, onOpenChange, planName, price, onSuccess }: PaymentDialogProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStep('processing');

        // Simulate payment processing
        setTimeout(() => {
            setIsLoading(false);
            setStep('success');
            setIsSuccess(true);
            
            // Auto close after showing success
            setTimeout(() => {
                onSuccess();
                onOpenChange(false);
                // Reset state after closing
                setTimeout(() => {
                    setStep('form');
                    setIsSuccess(false);
                }, 500);
            }, 2000);
        }, 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md font-cairo" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle className="text-xl font-black text-gray-900">ترقية الباقة</DialogTitle>
                    <DialogDescription>
                        أنت على وشك الاشتراك في <span className="font-bold text-indigo-600">{planName}</span>
                    </DialogDescription>
                </DialogHeader>

                {step === 'form' && (
                    <form onSubmit={handlePay} className="space-y-6 pt-4">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-600">الإجمالي للدفع</span>
                            <span className="text-2xl font-black text-indigo-600">{price} <span className="text-xs">ج.م</span></span>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="card-name" className="text-right block">اسم حامل البطاقة</Label>
                                <Input id="card-name" placeholder="Ahmed Mohamed" required className="text-left" dir="ltr" />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="card-number" className="text-right block">رقم البطاقة</Label>
                                <div className="relative">
                                    <Input id="card-number" placeholder="0000 0000 0000 0000" required className="pl-10 text-left" dir="ltr" maxLength={19} />
                                    <CreditCard className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expiry" className="text-right block">تاريخ الانتهاء</Label>
                                    <div className="relative">
                                        <Input id="expiry" placeholder="MM/YY" required className="pl-10 text-left" dir="ltr" maxLength={5} />
                                        <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cvc" className="text-right block">رمز الأمان (CVC)</Label>
                                    <div className="relative">
                                        <Input id="cvc" placeholder="123" required className="pl-10 text-left" dir="ltr" maxLength={3} />
                                        <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                             <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200">
                                 تأكيد الدفع
                             </Button>
                        </DialogFooter>
                    </form>
                )}

                {step === 'processing' && (
                     <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                         <div className="relative">
                             <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <Lock className="w-6 h-6 text-indigo-600" />
                             </div>
                         </div>
                         <div>
                             <h3 className="text-lg font-bold text-gray-900">جاري معالجة الدفع...</h3>
                             <p className="text-sm text-gray-500">برجاء الانتظار وعدم إغلاق النافذة</p>
                         </div>
                     </div>
                )}

                {step === 'success' && (
                     <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in duration-300">
                         <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2">
                             <CheckCircle2 className="w-10 h-10 text-green-600" />
                         </div>
                         <div>
                             <h3 className="text-2xl font-black text-gray-900">تم الدفع بنجاح!</h3>
                             <p className="text-gray-500 font-bold">تم ترقية باقتك إلى {planName}</p>
                         </div>
                     </div>
                )}

            </DialogContent>
        </Dialog>
    );
};

export default PaymentDialog;
