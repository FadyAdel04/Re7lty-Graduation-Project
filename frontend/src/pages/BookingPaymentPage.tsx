import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { bookingService } from "@/services/bookingService";
import { paymobService } from "@/services/paymobService";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Wallet, 
  Smartphone, 
  Check, 
  Loader2, 
  ChevronRight, 
  ShieldCheck, 
  Lock,
  Calendar,
  Users,
  MapPin,
  Ticket
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const BookingPaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'instapay'>('card');
  const [walletPhone, setWalletPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = await getToken();
        const found = await bookingService.getBookingById(bookingId!, token || undefined);
        
        if (!found) {
          toast({ title: "عذراً", description: "لم يتم العثور على الحجز", variant: "destructive" });
          navigate("/agency");
          return;
        }

        if (found.paymentStatus === 'paid') {
          toast({ title: "تنبيه", description: "هذا الحجز مدفوع بالفعل" });
          navigate(`/user/${user?.id}?tab=bookings`);
          return;
        }

        setBooking(found);
      } catch (error) {
        console.error("Fetch booking error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) fetchBooking();
  }, [bookingId, getToken, navigate, toast, user?.id]);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const token = await getToken();
      const intention = await paymobService.createPaymentIntention(
        bookingId!,
        paymentMethod,
        token || undefined
      );

      if (intention.paymentKey) {
        const config = await paymobService.getConfig();
        window.location.href = paymobService.buildHostedCheckoutUrl(intention.paymentKey, config.iframeId);
      } else if (intention.clientSecret) {
        window.location.href = `https://accept.paymob.com/unifiedcheckout/?publicKey=${intention.publicKey}&clientSecret=${intention.clientSecret}`;
      } else {
        throw new Error("فشل الحصول على مفتاح الدفع");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({ 
        title: "فشل تهيئة الدفع", 
        description: error.response?.data?.details?.message || error.message || "حدث خطأ غير متوقع", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!booking) return null;

  const paymentMethods = [
    { id: 'card', label: 'بطاقة بنكية', sub: 'فيزا، ماستركارد، ميزة', icon: <CreditCard className="w-5 h-5" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-cairo" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-8 font-bold">
            <span>الرحلات</span>
            <ChevronRight className="w-4 h-4" />
            <span>{booking.tripTitle}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-indigo-600">الدفع الآمن</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Payment Options */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-gray-900">اختر طريقة الدفع</h1>
                    <p className="text-gray-500 font-medium">جميع المعاملات مشفرة وآمنة تماماً</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {paymentMethods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-right",
                        paymentMethod === m.id 
                          ? "border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100/50" 
                          : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        paymentMethod === m.id ? "bg-indigo-600 text-white" : "bg-white text-gray-400 border border-gray-100"
                      )}>
                        {m.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900">{m.label}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">{m.sub}</p>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        paymentMethod === m.id ? "border-indigo-600 bg-indigo-600 scale-110" : "border-gray-300"
                      )}>
                        {paymentMethod === m.id && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                    <div className="text-right">
                      <p className="font-black text-gray-900 text-sm">دفع آمن بنسبة 100%</p>
                      <p className="text-[10px] text-gray-500 font-bold">بوابة الدفع Paymob معتمدة من البنك المركزي</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="w-full sm:w-auto min-w-[200px] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-100"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-5 h-5 animate-spin ml-2" /> جاري التحويل...</>
                    ) : (
                      <>ادفع الآن {booking.totalPrice} ج.م</>
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Right: Booking Summary */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100"
              >
                <div className="bg-indigo-600 p-6 text-white text-center">
                  <Ticket className="w-10 h-10 mx-auto mb-3 opacity-80" />
                  <h3 className="font-black text-xl">ملخص الحجز</h3>
                  <p className="text-indigo-100 text-xs font-medium mt-1">المرجع: {booking.bookingReference}</p>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                         <MapPin className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase">الرحلة</p>
                        <p className="font-bold text-gray-900 truncate">{booking.tripTitle}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                         <Calendar className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">التاريخ</p>
                        <p className="font-bold text-gray-900">{new Date(booking.bookingDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                         <Users className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">عدد الأشخاص</p>
                        <p className="font-bold text-gray-900">{booking.numberOfPeople} أفراد</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-bold">السعر الأساسي</span>
                      <span className="font-black text-gray-900">{(booking.totalPrice + (booking.discountApplied || 0)).toLocaleString()} ج.م</span>
                    </div>
                    {booking.discountApplied > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span className="font-bold">خصم الكوبون</span>
                        <span className="font-black">-{booking.discountApplied.toLocaleString()} ج.م</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                      <span className="font-black text-gray-900 text-lg">الإجمالي</span>
                      <div className="text-right">
                        <p className="text-2xl font-black text-indigo-600">{booking.totalPrice.toLocaleString()} <span className="text-sm">ج.م</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Company Info */}
              <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-4 border border-gray-100 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-black italic">
                   {booking.companyName?.[0]}
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-gray-400">بواسطة</p>
                   <p className="font-bold text-gray-700 text-sm">{booking.companyName}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingPaymentPage;
