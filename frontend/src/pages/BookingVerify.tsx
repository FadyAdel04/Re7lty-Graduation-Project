import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { bookingService, type Booking } from "@/services/bookingService";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  CheckCircle2, 
  MapPin, 
  Users, 
  Calendar, 
  Building2, 
  Phone, 
  Mail, 
  User, 
  CreditCard,
  AlertCircle,
  Bus,
  ArrowRight,
  ShieldCheck,
  Plane,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const BookingVerify = () => {
  const { reference } = useParams<{ reference: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchRef, setSearchRef] = useState("");
  const [data, setData] = useState<{ booking: Booking; trip: any; company: any } | null>(null);

  const fetchBooking = async (ref: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await bookingService.getBookingByReference(ref);
      if (res.success) {
        setData(res);
      } else {
        setError("لم يتم العثور على الحجز");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "حدث خطأ أثناء جلب البيانات أو المرجع غير صحيح");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reference) {
      fetchBooking(reference);
    } else {
      setLoading(false);
    }
  }, [reference]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef.trim()) {
      fetchBooking(searchRef.trim());
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] font-cairo" dir="rtl">
        <Header />
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-bold">جاري التحقق من صحة الحجز...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle case where no reference is provided OR error occurs
  if (!reference && !data) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] font-cairo pb-20" dir="rtl">
        <Header />
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-indigo-50"
          >
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-8 mx-auto">
              <ShieldCheck className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-4">التحقق من الحجز</h1>
            <p className="text-gray-500 font-medium mb-10 italic">أدخل مرجع الحجز الخاص بك للتأكد من صحة البيانات وتفاصيل الرحلة</p>
            
            <form onSubmit={handleLookup} className="space-y-4">
              <div className="relative group">
                <input 
                  type="text" 
                  value={searchRef}
                  onChange={(e) => setSearchRef(e.target.value)}
                  placeholder="مثال: BK-72H9-X..."
                  className="w-full h-18 rounded-2xl border-2 border-gray-100 bg-gray-50/50 px-6 font-black text-xl text-center focus:border-indigo-600 focus:bg-white transition-all outline-none"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-200">
                تحقق الآن
              </Button>
            </form>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600 font-bold justify-center"
              >
                <AlertCircle className="w-5 h-5" />
                {error}
              </motion.div>
            )}
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] font-cairo" dir="rtl">
        <Header />
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4">بيانات غير صحيحة</h1>
          <p className="text-gray-500 max-w-md mb-8">{error || "عذراً، لم نتمكن من العثور على أي حجز بهذا المرجع."}</p>
          <div className="flex gap-4">
            <Button 
               variant="outline" 
               className="rounded-2xl h-14 px-8 border-2 font-black"
               onClick={() => { setError(null); setData(null); setSearchRef(""); }}
            >
              حاول مرة أخرى
            </Button>
            <Link to="/">
              <Button className="rounded-2xl h-14 px-8 bg-indigo-600 hover:bg-indigo-700 font-black">
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { booking, trip, company } = data;

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-cairo pb-20" dir="rtl">
      <Header />
      
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-30 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-100 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-sky-100 rounded-full blur-[120px]" />
      </div>

      <main className="container mx-auto px-4 pt-10 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Status Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-[2.5rem] p-8 mb-8 text-center shadow-xl border-2 flex flex-col items-center gap-4",
              booking.status === 'accepted' ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
            )}
          >
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center shadow-lg mb-2",
              booking.status === 'accepted' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
            )}>
              {booking.status === 'accepted' ? <ShieldCheck className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">
                {booking.status === 'accepted' ? "حجز مؤكد وصحيح ✅" : "حجز بانتظار التأكيد"}
              </h1>
              <p className={cn(
                "font-bold text-lg",
                booking.status === 'accepted' ? "text-emerald-700" : "text-amber-700"
              )}>
                المرجع: {booking.bookingReference}
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Trip Info */}
            <div className="md:col-span-2 space-y-8">
              {/* Trip Details Card */}
              <motion.section 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-gray-100 shadow-xl"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Plane className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">تفاصيل الرحلة</h3>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Trip Information</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">اسم الرحلة</span>
                    <p className="text-xl font-black text-gray-800">{booking.tripTitle}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">الوجهة</span>
                    <p className="text-xl font-black text-gray-800 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-orange-400" />
                      {booking.tripDestination}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">الشركة المنظمة</span>
                    <p className="text-xl font-black text-gray-800 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-400" />
                      {booking.companyName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">تاريخ المغادرة</span>
                    <p className="text-xl font-black text-gray-800 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                      {new Date(booking.bookingDate).toLocaleDateString('ar-EG', { dateStyle: 'full' })}
                    </p>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-50 grid grid-cols-2 gap-8">
                   <div className="space-y-1 text-center p-4 bg-indigo-50/50 rounded-2xl">
                      <span className="text-[10px] font-black text-indigo-600">عدد الأفراد</span>
                      <p className="text-3xl font-black text-indigo-900">{booking.numberOfPeople}</p>
                   </div>
                   <div className="space-y-1 text-center p-4 bg-emerald-50/50 rounded-2xl">
                      <span className="text-[10px] font-black text-emerald-600">المبلغ الإجمالي</span>
                      <p className="text-3xl font-black text-emerald-900">{booking.totalPrice} <span className="text-sm">ج.م</span></p>
                   </div>
                </div>
              </motion.section>

              {/* Passenger Info */}
              <motion.section 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-gray-100 shadow-xl"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">بيانات المسافر</h3>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Passenger Data</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase">الاسم الكامل</span>
                      <p className="font-black text-gray-800">{booking.userName}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <Phone className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase">رقم الهاتف</span>
                        <p className="font-black text-gray-800" dir="ltr">{booking.userPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <Mail className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase">البريد الإلكتروني</span>
                        <p className="font-bold text-gray-800 text-sm truncate" dir="ltr">{booking.userEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {(booking.selectedSeats?.length || booking.seatNumber) && (
                  <div className="mt-8 p-6 bg-indigo-50/50 rounded-[2.5rem] border-2 border-dashed border-indigo-100">
                    <h4 className="font-black text-indigo-700 mb-4 flex items-center gap-2">
                       <Bus className="w-5 h-5" />
                       المقاعد المخصصة
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {booking.selectedSeats?.map(s => (
                        <Badge key={s} className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl text-lg font-black">
                           محروس {s}
                        </Badge>
                      ))}
                      {booking.seatNumber && !booking.selectedSeats?.length && (
                        <Badge className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl text-lg font-black">
                           محروس {booking.seatNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </motion.section>
            </div>

            {/* Right Column: Sidebar */}
            <div className="space-y-8">
              {/* Payment Card */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10 space-y-6 text-center">
                  <CreditCard className="w-12 h-12 mx-auto opacity-80" />
                  <div>
                    <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">طريقة الدفع</span>
                    <p className="text-xl font-black mt-1">
                      {booking.paymentMethod === 'cash' ? 'نقدي (Cash)' : 
                       booking.paymentMethod === 'card' ? 'بطاقة ائتمان' : 
                       booking.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'أخرى'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">حالة الدفع</span>
                    <Badge className={cn(
                      "mt-2 px-4 py-1.5 rounded-full font-black text-sm",
                      booking.paymentStatus === 'paid' ? "bg-emerald-500 text-white" : "bg-white/20 text-white border-white/20"
                    )}>
                      {booking.paymentStatus === 'paid' ? "تم الدفع" : 
                       booking.paymentStatus === 'refunded' ? "تم الاسترداد" : "بانتظار الدفع"}
                    </Badge>
                  </div>
                </div>
              </motion.section>

              {/* Company Logo Card */}
              {company && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl text-center"
                >
                  <img src={company.logo} alt={company.name} className="w-24 h-24 object-contain mx-auto mb-4 rounded-3xl shadow-sm" />
                  <h4 className="font-black text-gray-900 text-lg mb-1">{company.name}</h4>
                  <p className="text-sm text-gray-400 font-medium mb-6">الجهة المنظمة والموثقة</p>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full rounded-2xl h-12 gap-2 font-bold" asChild>
                      <a href={`tel:${company.phone}`}>
                        <Phone className="w-4 h-4 text-emerald-500" />
                        اتصال بالشركة
                      </a>
                    </Button>
                  </div>
                </motion.section>
              )}

              {/* Go Home button */}
              <Link to="/" className="block">
                <Button className="w-full h-16 rounded-[1.5rem] bg-gray-100 hover:bg-gray-200 text-gray-900 font-black gap-3 group transition-all">
                  العودة للرئيسية
                  <ArrowRight className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingVerify;
