import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Booking, bookingService } from "@/services/bookingService";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X, Phone, User, Calendar, MessageSquare, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Wallet, Banknote, HelpCircle } from "lucide-react";

interface BookingManagementTableProps {
  bookings: Booking[];
  onUpdate: () => void;
}

const BookingManagementTable = ({ bookings, onUpdate }: BookingManagementTableProps) => {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; bookingId: string | null }>({
    open: false,
    bookingId: null
  });
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; bookingId: string | null }>({
    open: false,
    bookingId: null
  });
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; bookingId: string | null; current?: any }>({
    open: false,
    bookingId: null
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [paymentData, setPaymentData] = useState({ status: "pending", method: "cash" });

  const handleAccept = async (bookingId: string) => {
    setLoadingId(bookingId);
    try {
      const token = await getToken();
      await bookingService.acceptBooking(bookingId, token || undefined);
      toast({
        title: "تم قبول الحجز",
        description: "تم تحديث حالة الحجز وإشعار العميل",
      });
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء قبول الحجز",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.bookingId) return;
    
    setLoadingId(rejectDialog.bookingId);
    try {
      const token = await getToken();
      await bookingService.rejectBooking(rejectDialog.bookingId, rejectionReason, token || undefined);
      toast({
        title: "تم رفض الحجز",
        description: "تم تحديث حالة الحجز وإشعار العميل",
      });
      setRejectDialog({ open: false, bookingId: null });
      setRejectionReason("");
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفض الحجز",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelDialog.bookingId) return;
    
    setLoadingId(cancelDialog.bookingId);
    try {
      const token = await getToken();
      await bookingService.cancelBookingByCompany(cancelDialog.bookingId, cancellationReason, token || undefined);
      toast({
        title: "تم إلغاء الحجز",
        description: "تم إلغاء الحجز وإشعار العميل بالسبب",
      });
      setCancelDialog({ open: false, bookingId: null });
      setCancellationReason("");
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إلغاء الحجز",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdatePayment = async () => {
    if (!paymentDialog.bookingId) return;
    
    setLoadingId(paymentDialog.bookingId);
    try {
      const token = await getToken();
      await bookingService.updatePaymentStatus(paymentDialog.bookingId, { 
        paymentStatus: paymentData.status, 
        paymentMethod: paymentData.method 
      }, token || undefined);
      
      toast({
        title: "تم تحديث الدفع",
        description: "تم تحديث بيانات الدفع لهذا الحجز",
      });
      setPaymentDialog({ open: false, bookingId: null });
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث بيانات الدفع",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <div className="flex flex-col gap-1 items-end">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">مقبول</Badge>
          </div>
        );
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">مرفوض</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">ملغي</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">قيد الانتظار</Badge>;
    }
  };

  const getPaymentBadge = (status: string, method: string) => {
    const statusMap: any = {
      paid: { label: "مدفوع", class: "bg-emerald-100 text-emerald-700" },
      pending: { label: "قيد الدفع", class: "bg-orange-100 text-orange-700" },
      refunded: { label: "مسترجع", class: "bg-blue-100 text-blue-700" },
    };
    
    const methodIcons: any = {
        cash: <Banknote className="w-3 h-3" />,
        card: <CreditCard className="w-3 h-3" />,
        bank_transfer: <Wallet className="w-3 h-3" />,
        other: <HelpCircle className="w-3 h-3" />
    };

    const config = statusMap[status] || { label: status, class: "bg-gray-100" };
    
    return (
        <div className="flex items-center gap-1.5 mt-1.5 opacity-80">
            <Badge variant="outline" className={`${config.class} border-none text-[10px] px-1.5 py-0 h-5 flex items-center gap-1`}>
                {methodIcons[method] || methodIcons.other}
                {config.label}
            </Badge>
        </div>
    );
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm" dir="rtl">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="text-right font-black text-gray-900 w-[300px] px-4">اسم الرحلة</TableHead>
              <TableHead className="text-right font-black text-gray-900 px-4">بيانات العميل</TableHead>
              <TableHead className="text-right font-black text-gray-900 px-4">تاريخ الحجز</TableHead>
              <TableHead className="text-right font-black text-gray-900 px-4">العدد / السعر</TableHead>
              <TableHead className="text-right font-black text-gray-900 px-4">حالة الحجز</TableHead>
              <TableHead className="text-right font-black text-gray-900 w-[80px] px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                  لا توجد حجوزات لعرضها
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking._id} className="group hover:bg-gray-50/50">
                  <TableCell className="text-right font-medium align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-900 font-bold line-clamp-2">{booking.tripTitle}</span>
                      <span className="text-xs text-gray-500">{booking.tripDestination}</span>
                      {booking.specialRequests && (
                        <div className="flex items-start gap-1 mt-1 text-xs text-orange-600 bg-orange-50 p-2 rounded-lg max-w-full">
                          <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{booking.specialRequests}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="font-semibold">{booking.userName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                         <span className="truncate">{booking.userEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-mono" dir="ltr">
                         <span className="text-right flex-1">{booking.userPhone}</span>
                         <Phone className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right align-top text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(booking.bookingDate), "dd MMM yyyy", { locale: ar })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <div className="font-bold">{booking.totalPrice} ج.م</div>
                    <div className="text-xs text-gray-500">{booking.numberOfPeople} أفراد</div>
                  </TableCell>
                   <TableCell className="text-right align-top">
                    {getStatusBadge(booking.status)}
                    {(booking as any).paymentStatus && getPaymentBadge((booking as any).paymentStatus, (booking as any).paymentMethod || "cash")}
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900">
                          <span className="sr-only">فتح القائمة</span>
                          {loadingId === booking._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px] font-cairo">
                        {booking.status === 'pending' && (
                          <>
                            <DropdownMenuItem 
                              className="text-green-600 focus:text-green-700 cursor-pointer gap-2"
                              onClick={() => handleAccept(booking._id)}
                            >
                              <Check className="h-4 w-4" />
                              قبول الحجز
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-700 cursor-pointer gap-2"
                              onClick={() => setRejectDialog({ open: true, bookingId: booking._id })}
                            >
                              <X className="h-4 w-4" />
                              رفض الحجز
                            </DropdownMenuItem>
                          </>
                        )}
                        {booking.status === 'accepted' && (
                           <>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-700 cursor-pointer gap-2"
                              onClick={() => setCancelDialog({ open: true, bookingId: booking._id })}
                            >
                              <X className="h-4 w-4" />
                              إلغاء الحجز
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer gap-2"
                              onClick={() => {
                                setPaymentData({ 
                                    status: (booking as any).paymentStatus || "pending", 
                                    method: (booking as any).paymentMethod || "cash" 
                                });
                                setPaymentDialog({ open: true, bookingId: booking._id });
                              }}
                            >
                              <CreditCard className="h-4 w-4" />
                              تحديث الدفع
                            </DropdownMenuItem>
                           </>
                        )}
                        <DropdownMenuItem 
                          className="cursor-pointer gap-2"
                          onClick={() => window.location.href = `tel:${booking.userPhone}`}
                        >
                          <Phone className="h-4 w-4" />
                          اتصال بالعميل
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="font-cairo text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض الحجز</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رفض هذا الحجز؟ يرجى ذكر سبب الرفض للعميل.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="سبب الرفض (مثال: اكتمال العدد، عدم توفر الرحلة، إلخ...)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, bookingId: null })}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={loadingId !== null}
            >
              {loadingId ? <Loader2 className="h-4 w-4 animate-spin" /> : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="font-cairo text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle>إلغاء الحجز (بعد القبول)</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من إلغاء هذا الحجز؟ سيتم إخطار العميل فوراً.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="سبب الإلغاء..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, bookingId: null })}>
              تراجع
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel}
              disabled={loadingId !== null}
            >
              {loadingId ? <Loader2 className="h-4 w-4 animate-spin" /> : "تأكيد الإلغاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="font-cairo text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle>تحديث بيانات الدفع</DialogTitle>
            <DialogDescription>
              قم بتحديث حالة الدفع وطريقة الحصول على المبلغ.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
                <label className="text-sm font-bold">حالة الدفع</label>
                <Select value={paymentData.status} onValueChange={(val) => setPaymentData({...paymentData, status: val})}>
                    <SelectTrigger className="h-12">
                        <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent className="font-cairo">
                        <SelectItem value="pending">قيد الدفع</SelectItem>
                        <SelectItem value="paid">مدفوع بالكامل</SelectItem>
                        <SelectItem value="refunded">تم الاسترجاع</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold">طريقة الدفع</label>
                <Select value={paymentData.method} onValueChange={(val) => setPaymentData({...paymentData, method: val})}>
                    <SelectTrigger className="h-12">
                        <SelectValue placeholder="اختر الطريقة" />
                    </SelectTrigger>
                    <SelectContent className="font-cairo">
                        <SelectItem value="cash">نقداً</SelectItem>
                        <SelectItem value="card">بطاقة ائتمان</SelectItem>
                        <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPaymentDialog({ open: false, bookingId: null })}>
              إلغاء
            </Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={handleUpdatePayment}
              disabled={loadingId !== null}
            >
              {loadingId ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingManagementTable;
