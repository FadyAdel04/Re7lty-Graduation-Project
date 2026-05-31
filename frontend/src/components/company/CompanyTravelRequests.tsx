import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  getCompanyTravelRequests,
  updateTravelCompanyRequest,
  confirmTravelCompanyRequest,
} from "@/lib/api";
import { chatService } from "@/services/chatService";
import { TravelRequestDetailsCard } from "@/components/TravelRequestDetailsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  MapPin,
  Calendar,
  Users,
  MessageCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface TravelCompanyRequestItem {
  _id: string;
  userId: string;
  companyId: string;
  companyName: string;
  destination: string;
  travelDates?: { checkIn?: string; checkOut?: string };
  numberOfTravelers?: number;
  budget?: string;
  tripDetails?: Record<string, unknown>;
  status: string;
  conversationId?: string;
  quotedPrice?: number;
  companyNotes?: string;
  message?: string;
  requestedAt: string;
  user?: { fullName?: string; imageUrl?: string };
}

interface CompanyTravelRequestsProps {
  onOpenChat?: (conversationId: string, requestId: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "جديد", className: "bg-amber-100 text-amber-800" },
  viewed: { label: "تمت المشاهدة", className: "bg-blue-100 text-blue-800" },
  responded: { label: "تم الرد", className: "bg-indigo-100 text-indigo-800" },
  confirmed: { label: "مؤكد", className: "bg-emerald-100 text-emerald-800" },
  declined: { label: "مرفوض", className: "bg-rose-100 text-rose-800" },
};

const QUICK_MESSAGES = [
  "مرحباً! شكراً لطلبكم. هل يمكنكم تأكيد عدد المسافرين وأعمارهم؟",
  "نحتاج تفاصيل إضافية عن تفضيلات الإقامة والفندق المطلوب.",
  "هل يمكنكم إرسال جوازات السفر أو بيانات المسافرين لإتمام الحجز؟",
  "سنرسل لكم عرض السعر النهائي خلال 24 ساعة. هل التواريخ مرنة؟",
];

export function CompanyTravelRequests({ onOpenChat }: CompanyTravelRequestsProps) {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TravelCompanyRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<TravelCompanyRequestItem | null>(null);
  const [quotedPrice, setQuotedPrice] = useState("");
  const [companyNotes, setCompanyNotes] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await getCompanyTravelRequests(token);
      setRequests(data);
      if (data.length > 0 && !expandedId) {
        setExpandedId(data[0]._id);
      }
    } catch {
      toast({ title: "خطأ", description: "تعذر تحميل طلبات الرحلات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function markViewed(request: TravelCompanyRequestItem) {
    if (request.status !== "pending") return;
    try {
      const token = await getToken();
      if (!token) return;
      await updateTravelCompanyRequest(request._id, { status: "viewed" }, token);
      setRequests((prev) =>
        prev.map((r) => (r._id === request._id ? { ...r, status: "viewed" } : r))
      );
    } catch {
      /* ignore */
    }
  }

  async function sendMessageToUser(request: TravelCompanyRequestItem, content: string) {
    if (!content.trim() || !request.conversationId) return;
    setSendingId(request._id);
    try {
      const token = await getToken();
      if (!token) return;
      await chatService.sendMessage(request.conversationId, content.trim(), "company", token);
      if (request.status === "pending" || request.status === "viewed") {
        await updateTravelCompanyRequest(request._id, { status: "responded" }, token);
        setRequests((prev) =>
          prev.map((r) => (r._id === request._id ? { ...r, status: "responded" } : r))
        );
      }
      setMessageDrafts((prev) => ({ ...prev, [request._id]: "" }));
      toast({ title: "تم إرسال الرسالة", description: "وصلت رسالتك للمسافر في المحادثة" });
    } catch {
      toast({ title: "خطأ", description: "فشل إرسال الرسالة", variant: "destructive" });
    } finally {
      setSendingId(null);
    }
  }

  async function handleDecline(request: TravelCompanyRequestItem) {
    try {
      const token = await getToken();
      if (!token) return;
      await updateTravelCompanyRequest(request._id, { status: "declined" }, token);
      setRequests((prev) =>
        prev.map((r) => (r._id === request._id ? { ...r, status: "declined" } : r))
      );
      toast({ title: "تم رفض الطلب" });
    } catch {
      toast({ title: "خطأ", description: "فشل رفض الطلب", variant: "destructive" });
    }
  }

  async function handleConfirm() {
    if (!confirmDialog) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await confirmTravelCompanyRequest(
        confirmDialog._id,
        {
          quotedPrice: quotedPrice ? Number(quotedPrice) : undefined,
          companyNotes: companyNotes || undefined,
          replyMessage: replyMessage || undefined,
        },
        token
      );
      setRequests((prev) =>
        prev.map((r) =>
          r._id === confirmDialog._id ? { ...r, status: "confirmed" } : r
        )
      );
      toast({
        title: "تم تأكيد الحجز ✅",
        description: "تم إبلاغ المسافر بالتأكيد عبر المحادثة",
      });
      setConfirmDialog(null);
      setQuotedPrice("");
      setCompanyNotes("");
      setReplyMessage("");
    } catch (err: unknown) {
      toast({
        title: "خطأ",
        description: err instanceof Error ? err.message : "فشل تأكيد الحجز",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function openChat(request: TravelCompanyRequestItem) {
    markViewed(request);
    if (request.conversationId && onOpenChat) {
      onOpenChat(request.conversationId, request._id);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground font-bold text-sm border-2 border-dashed border-border rounded-2xl">
        لا توجد طلبات رحلات مخصصة حالياً
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-muted-foreground">
          {requests.length} طلب{requests.length !== 1 ? "ات" : ""} من المسافرين
        </p>
        <Button variant="outline" size="sm" onClick={fetchRequests} className="gap-2 rounded-xl">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      {requests.map((request) => {
        const statusInfo = STATUS_LABELS[request.status] || STATUS_LABELS.pending;
        const details = request.tripDetails || {};
        const isExpanded = expandedId === request._id;
        const draft = messageDrafts[request._id] ?? "";

        return (
          <div
            key={request._id}
            className={cn(
              "bg-card border-2 rounded-2xl overflow-hidden transition-all",
              request.status === "pending"
                ? "border-amber-200 shadow-md shadow-amber-100/50"
                : "border-border"
            )}
          >
            {/* Header row */}
            <div className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={request.user?.imageUrl} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-black">
                      {(request.user?.fullName || "م")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-lg">{request.user?.fullName || "مسافر"}</span>
                      <Badge className={cn("text-[10px] font-black", statusInfo.className)}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {request.destination}
                      </span>
                      {details.days != null && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {String(details.days)} أيام
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {request.numberOfTravelers || 1} مسافر
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(request.requestedAt), "d MMM yyyy - HH:mm", { locale: ar })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl gap-1 font-black"
                    onClick={() => setExpandedId(isExpanded ? null : request._id)}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {isExpanded ? "إخفاء التفاصيل" : "عرض التفاصيل الكاملة"}
                  </Button>
                  {request.conversationId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl gap-2 font-black"
                      onClick={() => openChat(request)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      فتح المحادثة
                    </Button>
                  )}
                  {request.status !== "confirmed" && request.status !== "declined" && (
                    <>
                      <Button
                        size="sm"
                        className="rounded-xl gap-2 font-black bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          markViewed(request);
                          setConfirmDialog(request);
                          setQuotedPrice(
                            details.estimatedCost != null ? String(details.estimatedCost) : ""
                          );
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        تأكيد الحجز
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-xl gap-2 font-black"
                        onClick={() => handleDecline(request)}
                      >
                        <XCircle className="w-4 h-4" />
                        رفض
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Full trip details + messaging */}
            {isExpanded && (
              <div className="px-5 pb-5 space-y-4 border-t border-border pt-4 bg-muted/20">
                <TravelRequestDetailsCard request={request} />

                {request.conversationId && request.status !== "declined" && (
                  <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                    <p className="text-sm font-black text-foreground">مراسلة المسافر</p>
                    <p className="text-xs text-muted-foreground font-bold">
                      اطلب تفاصيل إضافية أو أرسل عرضاً — ستظهر الرسالة في المحادثة مع المسافر
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {QUICK_MESSAGES.map((msg) => (
                        <button
                          key={msg}
                          type="button"
                          onClick={() =>
                            setMessageDrafts((prev) => ({ ...prev, [request._id]: msg }))
                          }
                          className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-right max-w-full"
                        >
                          {msg.length > 55 ? `${msg.slice(0, 55)}...` : msg}
                        </button>
                      ))}
                    </div>

                    <Textarea
                      value={draft}
                      onChange={(e) =>
                        setMessageDrafts((prev) => ({ ...prev, [request._id]: e.target.value }))
                      }
                      placeholder="اكتب رسالتك للمسافر لطلب تفاصيل إضافية أو إرسال عرض..."
                      className="rounded-xl font-bold min-h-[100px]"
                    />
                    <Button
                      size="sm"
                      disabled={!draft.trim() || sendingId === request._id}
                      className="rounded-xl gap-2 font-black bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => sendMessageToUser(request, draft)}
                    >
                      {sendingId === request._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      إرسال للمسافر
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent dir="rtl" className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-black">تأكيد حجز الرحلة</DialogTitle>
          </DialogHeader>
          {confirmDialog && (
            <TravelRequestDetailsCard request={confirmDialog} compact className="mb-2" />
          )}
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-black text-muted-foreground">السعر المعتمد (ج.م)</label>
              <Input
                type="number"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
                placeholder="مثال: 5000"
                className="mt-1 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-black text-muted-foreground">ملاحظات للمسافر</label>
              <Textarea
                value={companyNotes}
                onChange={(e) => setCompanyNotes(e.target.value)}
                placeholder="تفاصيل إضافية عن الحجز..."
                className="mt-1 rounded-xl font-bold min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-xs font-black text-muted-foreground">رسالة تأكيد (اختياري)</label>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="مرحباً! يسعدنا تأكيد رحلتكم..."
                className="mt-1 rounded-xl font-bold min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(null)} className="rounded-xl">
              إلغاء
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={submitting}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              تأكيد وإرسال للمسافر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
