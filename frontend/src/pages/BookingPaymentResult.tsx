import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { paymobService } from "@/services/paymobService";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, ArrowRight, Home, Ticket } from "lucide-react";
import { motion } from "framer-motion";

const BookingPaymentResult = () => {
  const [searchParams] = useSearchParams();
  const { getToken } = useAuth();
  const { user } = useUser();

  // Paymob sends these query params on redirect
  const success = searchParams.get("success");
  const pending = searchParams.get("pending");
  const txnResponseCode = searchParams.get("txn_response_code");
  const orderId = searchParams.get("order");
  const merchantOrderId = searchParams.get("merchant_order_id");
  
  // If success is true, it's successful. If txnResponseCode is provided, it should be APPROVED.
  const isSuccess = success === "true" && (txnResponseCode ? txnResponseCode === "APPROVED" : true);
  const isPending = pending === "true";

  const [status, setStatus] = useState<"loading" | "success" | "pending" | "failed">("loading");
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  useEffect(() => {
    const determineStatus = async () => {
      console.log("[PaymentResult] Starting verification...", { success, pending, txnResponseCode, orderId, merchantOrderId });
      try {
        const token = await getToken();
        console.log("[PaymentResult] Got auth token");
        
        // 1. Initial check from URL
        if (isSuccess) {
          console.log("[PaymentResult] URL indicates SUCCESS");
          setStatus("success");
          return;
        }

        // 2. Aggressive polling for 10 seconds (webhook might be slow)
        const bookingId = merchantOrderId || searchParams.get("merchant_order_id") || orderId;
        console.log("[PaymentResult] Verifying bookingId:", bookingId);

        if (bookingId) {
          let attempts = 0;
          const maxAttempts = 5; 
          
          const pollStatus = async () => {
            try {
              console.log(`[PaymentResult] Polling attempt ${attempts + 1}...`);
              const verify = await paymobService.verifyPayment(bookingId, token || undefined);
              console.log("[PaymentResult] Backend verification response:", verify.paymentStatus);
              if (verify.paymentStatus === 'paid') {
                setStatus("success");
                return true;
              }
            } catch (e: any) {
              console.warn("[PaymentResult] Polling error:", e.response?.data || e.message);
            }
            return false;
          };

          while (attempts < maxAttempts) {
            const found = await pollStatus();
            if (found) return;
            attempts++;
            await new Promise(r => setTimeout(r, 2000));
          }
        }

        console.log("[PaymentResult] Verification timed out or failed. Final status: failed");
        if (isPending) setStatus("pending");
        else setStatus("failed");
      } catch (err: any) {
        console.error("[PaymentResult] Global verification error:", err);
        setStatus(isSuccess ? "success" : "failed");
      }
    };
    determineStatus();
  }, [isSuccess, isPending, success]);

  const statusConfig = {
    loading: {
      icon: <Clock className="w-16 h-16 text-indigo-400 animate-spin" />,
      title: "جاري التحقق من الدفع...",
      description: "يرجى الانتظار بينما نتحقق من حالة معاملتك",
      color: "from-indigo-500 to-indigo-700",
      bg: "bg-indigo-50",
    },
    success: {
      icon: <CheckCircle2 className="w-16 h-16 text-emerald-400" />,
      title: "تم الدفع بنجاح! 🎉",
      description: "تمت معالجة دفعتك بنجاح. تحقق من حجوزاتك للتفاصيل وستصلك رسالة تأكيد قريباً.",
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
    },
    pending: {
      icon: <Clock className="w-16 h-16 text-amber-400" />,
      title: "الدفع قيد المعالجة",
      description: "دفعتك قيد المراجعة. ستصلك رسالة تأكيد خلال دقائق.",
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
    },
    failed: {
      icon: <XCircle className="w-16 h-16 text-rose-400" />,
      title: "فشلت عملية الدفع",
      description: "لم تكتمل عملية الدفع. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.",
      color: "from-rose-500 to-red-700",
      bg: "bg-rose-50",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="min-h-screen bg-gray-50 font-cairo" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 py-16 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className={`${config.bg} rounded-[2.5rem] p-10 shadow-2xl border border-white text-center space-y-6`}>
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              {config.icon}
            </motion.div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-gray-900">{config.title}</h1>
              <p className="text-gray-600 font-medium leading-relaxed">{config.description}</p>
            </div>

            {/* Transaction details */}
            {orderId && (
              <div className="bg-white/70 rounded-2xl p-4 space-y-2 text-sm">
                {orderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold">رقم الطلب</span>
                    <span className="font-black text-gray-900 text-xs" dir="ltr">{orderId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">الحالة</span>
                  <span className={`font-black text-xs px-2 py-0.5 rounded-full ${
                    status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                    status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {status === 'success' ? 'مدفوع ✓' : status === 'pending' ? 'قيد المراجعة' : 'فشل الدفع'}
                  </span>
                </div>
              </div>
            )}

            {/* Paymob badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-bold">
              <span>مدعوم بأمان بواسطة</span>
              <span className="bg-white px-3 py-1 rounded-full border border-gray-100 font-black text-gray-700">Paymob</span>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {status === 'failed' && (
                <Button
                  asChild
                  className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 font-black h-12"
                >
                  <Link to="/agency">
                    حاول مرة أخرى
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant={status === 'success' ? 'default' : 'outline'}
                className={`w-full rounded-xl font-black h-12 gap-2 ${status === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              >
                <Link to="/">
                  <Home className="w-4 h-4" />
                  العودة للرئيسية
                </Link>
              </Button>
              {status === 'success' && (
                <>
                  <Button
                    asChild
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black h-12 gap-2"
                  >
                    <Link to={`/user/${user?.id}?tab=bookings`}>
                      <Ticket className="w-4 h-4" />
                      عرض حجوزاتي
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-xl font-black h-12 gap-2"
                  >
                    <Link to="/agency">
                      تصفح رحلات أخرى
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Support note */}
          <p className="text-center text-xs text-gray-400 mt-6 font-medium">
            هل تواجه مشكلة؟{" "}
            <Link to="/support" className="text-indigo-500 hover:underline font-bold">
              تواصل مع الدعم الفني
            </Link>
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingPaymentResult;
