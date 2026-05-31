import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Phone,
  Globe,
  Mail,
  Send,
  CheckCircle2,
  Loader2,
  Building2,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { type TravelCompany } from "@/data/travel-companies";
import { getTravelCompanies, sendTripRequestToCompany } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface TravelAgencyRecommendationsProps {
  destination: string;
  days: number | null;
  budget: string | null;
  tripSummary: {
    attractionsCount: number;
    restaurantsCount: number;
    startCity: string;
    hotelNeeded: boolean | null;
    checkIn?: string;
    checkOut?: string;
    estimatedCost: number;
  };
  onBack: () => void;
  onSaveIndependent: () => void;
}

const TravelAgencyRecommendations = ({
  destination,
  days,
  budget,
  tripSummary,
  onBack,
  onSaveIndependent,
}: TravelAgencyRecommendationsProps) => {
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<TravelCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<Record<string, "idle" | "sending" | "sent">>({});
  const [conversationIds, setConversationIds] = useState<Record<string, string>>({});
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getTravelCompanies(destination);
        setCompanies(data);
      } catch (err: any) {
        console.error("Error fetching travel companies:", err);
        setError("تعذر تحميل شركات السياحة. يرجى المحاولة مرة أخرى.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompanies();
  }, [destination]);

  const handleSendRequest = async (company: TravelCompany) => {
    if (!isSignedIn) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لإرسال طلب الحجز",
        variant: "destructive",
      });
      return;
    }

    setRequestStatus((prev) => ({ ...prev, [company.id]: "sending" }));

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("انتهت الجلسة، يرجى إعادة تسجيل الدخول.");
      }

      const result = await sendTripRequestToCompany(
        {
          companyId: company.id,
          companyName: company.nameAr,
          destination,
          travelDates: {
            checkIn: tripSummary.checkIn || "",
            checkOut: tripSummary.checkOut || "",
          },
          numberOfTravelers: 1,
          budget: budget || "متوسطة",
          tripDetails: {
            days,
            attractionsCount: tripSummary.attractionsCount,
            restaurantsCount: tripSummary.restaurantsCount,
            startCity: tripSummary.startCity,
            hotelNeeded: tripSummary.hotelNeeded,
            estimatedCost: tripSummary.estimatedCost,
          },
          message: "هل يمكن لشركتكم إدارة هذه الرحلة وتقديم عرض سعر للمسافر؟",
        },
        token
      );

      setRequestStatus((prev) => ({ ...prev, [company.id]: "sent" }));
      if (result.conversationId) {
        setConversationIds((prev) => ({ ...prev, [company.id]: result.conversationId }));
      }
      toast({
        title: "تم إرسال الطلب ✅",
        description: `تم إرسال تفاصيل رحلتك إلى ${company.nameAr}. يمكنك متابعة الرد في رسائل الشركات.`,
      });
    } catch (err: unknown) {
      setRequestStatus((prev) => ({ ...prev, [company.id]: "idle" }));
      const message =
        err instanceof Error && err.message.includes("Unauthorized")
          ? "انتهت الجلسة، يرجى إعادة تسجيل الدخول والمحاولة مرة أخرى."
          : err instanceof Error && err.message
            ? err.message
            : "تعذر إرسال الطلب، يرجى المحاولة مرة أخرى.";
      toast({
        title: "خطأ في الإرسال",
        description: message,
        variant: "destructive",
      });
    }
  };

  const sentCount = Object.values(requestStatus).filter((s) => s === "sent").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-l from-indigo-600 to-violet-700 p-7 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200/50">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg shrink-0">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black leading-tight">شركات سياحية مقترحة</h3>
            <p className="text-indigo-100 font-bold text-sm mt-0.5">
              {companies.length} شركات متخصصة في {destination}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="rounded-xl font-black text-xs bg-white/10 border-white/20 text-white hover:bg-card hover:text-indigo-600 transition-all gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          تغيير الاختيار
        </Button>
      </div>

      {/* Trip Summary Card */}
      <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-5">
        <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" /> ملخص رحلتك المقترحة
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "الوجهة", value: destination, icon: "📍" },
            { label: "المدة", value: `${days} أيام`, icon: "📅" },
            { label: "الميزانية", value: budget === "low" ? "اقتصادية" : budget === "high" ? "فاخرة" : "متوسطة", icon: "💰" },
            { label: "المعالم", value: `${tripSummary.attractionsCount} مكان`, icon: "🏛️" },
            ...(tripSummary.hotelNeeded ? [{ label: "إقامة", value: "مطلوبة", icon: "🏨" }] : []),
            { label: "التكلفة التقديرية", value: `${tripSummary.estimatedCost.toLocaleString()} ج.م`, icon: "💎" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-white dark:bg-indigo-900/30 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-500/30 text-xs font-black"
            >
              <span>{item.icon}</span>
              <span className="text-muted-foreground">{item.label}:</span>
              <span className="text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sent counter */}
      {sentCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
            تم إرسال تفاصيل رحلتك إلى {sentCount} {sentCount === 1 ? "شركة" : "شركات"}. سنُعلمك عند الرد.
          </p>
        </motion.div>
      )}

      {/* Company Cards */}
      {isLoading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((placeholderIdx) => (
            <div
              key={placeholderIdx}
              className="bg-card border-2 border-border rounded-[2rem] p-5 animate-pulse flex items-start gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
                <div className="flex gap-2">
                  <div className="h-5 bg-muted rounded-[8px] w-12" />
                  <div className="h-5 bg-muted rounded-[8px] w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-100 dark:border-rose-900/30 rounded-[2rem] p-6 text-center space-y-4">
          <p className="text-rose-600 dark:text-rose-400 font-black text-sm">{error}</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-amber-50/50 dark:bg-amber-950/10 border-2 border-dashed border-amber-200 dark:border-amber-900/30 rounded-[2rem] p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto text-amber-500 text-2xl">
            ⚠️
          </div>
          <h4 className="font-black text-foreground text-lg">لم نجد شركات سياحية تدعم {destination} حالياً</h4>
          <p className="text-xs text-muted-foreground font-bold leading-relaxed max-w-sm mx-auto">
            تأكد من أن هناك شركات سياحية مسجلة على المنصة وتقوم بتنظيم رحلات لهذه الوجهة. يمكنك دائماً المتابعة وحفظ الرحلة باستقلالية.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {companies.map((company, idx) => {
            const status = requestStatus[company.id] || "idle";
            const isExpanded = expandedCompany === company.id;

            return (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={cn(
                  "bg-card border-2 rounded-[2rem] overflow-hidden transition-all duration-300",
                  status === "sent"
                    ? "border-emerald-300 dark:border-emerald-600/50 shadow-xl shadow-emerald-100/50"
                    : "border-border hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50"
                )}
              >
                {/* Card Main Row */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 flex items-center justify-center text-3xl shrink-0 border border-indigo-100 dark:border-indigo-500/20 shadow-sm overflow-hidden">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                      ) : (
                        company.logoEmoji || "🏢"
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-foreground text-base">{company.nameAr || company.name}</h4>
                            {company.badge && (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] font-black px-2 py-0.5 rounded-lg dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30">
                                {company.badge}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "w-3 h-3",
                                    i < Math.floor(company.rating)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground/30"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-black text-foreground">{company.rating}</span>
                            <span className="text-[10px] text-muted-foreground font-bold">
                              ({company.reviewCount.toLocaleString()} تقييم)
                            </span>
                          </div>
                        </div>

                        {/* Send Button */}
                        {status === "sent" ? (
                          <div className="flex flex-col gap-2 shrink-0">
                            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-600/30 px-4 py-2 rounded-xl">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">تم الإرسال</span>
                            </div>
                            {conversationIds[company.id] && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl font-black text-xs gap-1"
                                onClick={() =>
                                  navigate(`/messages?tab=company&conv=${conversationIds[company.id]}`)
                                }
                              >
                                <Send className="w-3.5 h-3.5" />
                                متابعة المحادثة
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSendRequest(company)}
                            disabled={status === "sending"}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl gap-2 shadow-lg shadow-indigo-200 shrink-0"
                          >
                            {status === "sending" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            إرسال تفاصيل الرحلة
                          </Button>
                        )}
                      </div>

                      {/* Services chips */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {company.specialties && company.specialties.map((spec) => (
                          <span
                            key={spec}
                            className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedCompany(isExpanded ? null : company.id)}
                    className="w-full flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border text-xs font-black text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? (
                      <>عرض أقل <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>معلومات التواصل <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                </div>

                {/* Expanded Contact Info */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border"
                    >
                      <div className="p-5 space-y-3 bg-muted/30">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {company.phone && (
                            <a
                              href={`tel:${company.phone}`}
                              className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-indigo-200 transition-colors group"
                            >
                              <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span className="text-xs font-black text-foreground group-hover:text-indigo-600 truncate" dir="ltr">
                                {company.phone}
                              </span>
                            </a>
                          )}
                          {company.email && (
                            <a
                              href={`mailto:${company.email}`}
                              className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-indigo-200 transition-colors group"
                            >
                              <Mail className="w-4 h-4 text-violet-500 shrink-0" />
                              <span className="text-xs font-black text-foreground group-hover:text-violet-600 truncate">
                                {company.email}
                              </span>
                            </a>
                          )}
                          {company.website && (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-emerald-200 transition-colors group"
                            >
                              <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="text-xs font-black text-foreground group-hover:text-emerald-600 truncate">
                                الموقع الرسمي
                              </span>
                            </a>
                          )}
                        </div>
                        {company.services && company.services.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                              الخدمات المقدمة
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {company.services.map((s) => (
                                <span
                                  key={s}
                                  className="text-[10px] font-bold bg-muted text-foreground px-2 py-1 rounded-lg border border-border"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer actions */}
      <div className="bg-muted/40 border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-black text-sm text-foreground">
            فضلت السفر بمفردك؟
          </p>
          <p className="text-xs text-muted-foreground font-bold mt-0.5">
            يمكنك حفظ الرحلة الآن والسفر بحرية كاملة.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onSaveIndependent}
          className="rounded-xl font-black border-border gap-2 whitespace-nowrap"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          احفظ الرحلة باستقلالية
        </Button>
      </div>
    </div>
  );
};

export default TravelAgencyRecommendations;
