import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { adminService } from "@/services/adminService";
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Loader2, 
  MessageSquare, 
  Clock, 
  Mail, 
  Phone, 
  ShieldCheck,
  ChevronRight,
  ClipboardList
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SubmissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SubmissionsModal = ({ open, onOpenChange }: SubmissionsModalProps) => {
  const { getToken } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (open) fetchSubmissions();
  }, [open, filter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await adminService.getSubmissions(token || undefined, filter === 'all' ? undefined : filter);
      setSubmissions(data.submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (confirm('هل تريد الموافقة على هذا الطلب؟')) {
      try {
        const token = await getToken();
        await adminService.approveSubmission(id, token || undefined);
        fetchSubmissions();
      } catch (error) {
        alert('حدث خطأ');
      }
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('سبب الرفض:');
    if (reason) {
      try {
        const token = await getToken();
        await adminService.rejectSubmission(id, reason, token || undefined);
        fetchSubmissions();
      } catch (error) {
        alert('حدث خطأ');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل تريد حذف هذا الطلب؟')) {
      try {
        const token = await getToken();
        await adminService.deleteSubmission(id, token || undefined);
        fetchSubmissions();
      } catch (error) {
        alert('حدث خطأ');
      }
    }
  };

  const statusMap = {
    pending: { label: 'قيد الانتظار', color: 'text-orange-600', bg: 'bg-orange-50' },
    approved: { label: 'موافق عليه', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    rejected: { label: 'مرفوض', color: 'text-rose-600', bg: 'bg-rose-50' }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden border-0 rounded-[2.5rem] shadow-2xl" dir="rtl">
        <DialogHeader className="px-10 pt-10 pb-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-4 mb-2">
             <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ClipboardList className="w-6 h-6" />
             </div>
             <div>
                <DialogTitle className="text-2xl font-black text-gray-900 font-cairo leading-none">طلبات الانضمام</DialogTitle>
                <DialogDescription className="text-sm font-bold text-gray-400 mt-1">مراجعة والتحقق من ملفات تعريف الشركات المتقدمة.</DialogDescription>
             </div>
          </div>
          
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none">
             {[
               { id: 'all', label: 'الكل' },
               { id: 'pending', label: 'قيد الانتظار' },
               { id: 'approved', label: 'المقبولة' },
               { id: 'rejected', label: 'المرفوضة' }
             ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap",
                    filter === btn.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 font-bold"
                  )}
                >
                   {btn.label}
                </button>
             ))}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-10 py-8 bg-[#FDFDFF]">
           {loading ? (
             <div className="space-y-6">
                {[1,2,3].map(i => <div key={i} className="h-44 bg-white border border-gray-100 rounded-[2rem] animate-pulse" />)}
             </div>
           ) : submissions.length === 0 ? (
             <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <ShieldCheck className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900 leading-none mb-2">لا توجد طلبات هنا</h3>
                <p className="text-gray-400 font-bold text-sm">لم يتم العثor على أي شركة في هذا التصنيف حالياً.</p>
             </div>
           ) : (
             <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                   {submissions.map((s, idx) => {
                     const status = statusMap[s.status as keyof typeof statusMap];
                     return (
                       <motion.div
                         key={s._id}
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: idx * 0.05 }}
                       >
                          <Card className="border border-gray-100 shadow-xl shadow-gray-200/20 rounded-[2rem] overflow-hidden group hover:border-indigo-100 hover:shadow-indigo-500/5 transition-all">
                             <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                   <div className={cn("w-full md:w-2", status.bg.replace('/50', ''))} />
                                   <div className="flex-1 p-6">
                                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                         <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                                               {s.companyName[0]}
                                            </div>
                                            <div>
                                               <h4 className="text-lg font-black text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors leading-none">{s.companyName}</h4>
                                               <div className="flex items-center gap-3">
                                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                                                     <Clock className="w-3 h-3" />
                                                     منذ {new Date(s.createdAt).toLocaleDateString('ar-EG')}
                                                  </span>
                                                  <Badge className={cn("px-2.5 py-0.5 rounded-full border-0 font-black text-[9px] uppercase shadow-inner", status.bg, status.color)}>
                                                     {status.label}
                                                  </Badge>
                                               </div>
                                            </div>
                                         </div>

                                         <div className="flex items-center gap-2">
                                            {s.status === 'pending' ? (
                                              <>
                                                 <Button 
                                                   size="sm" 
                                                   className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] gap-2 shadow-lg shadow-emerald-100"
                                                   onClick={() => handleApprove(s._id)}
                                                 >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    قبول
                                                 </Button>
                                                 <Button 
                                                   size="sm" 
                                                   variant="ghost"
                                                   className="h-10 px-5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-black text-[10px] gap-2 border-0"
                                                   onClick={() => handleReject(s._id)}
                                                 >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    رفض
                                                 </Button>
                                              </>
                                            ) : (
                                              <Button 
                                                size="sm" 
                                                variant="ghost"
                                                className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600 p-0"
                                                onClick={() => handleDelete(s._id)}
                                              >
                                                 <Trash2 className="w-4 h-4" />
                                              </Button>
                                            )}
                                         </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                         {[
                                           { icon: Mail, label: 'البريد', value: s.email },
                                           { icon: Phone, label: 'الهاتف', value: s.phone },
                                           { icon: ShieldCheck, label: 'التخصص', value: s.tripTypes }
                                         ].map((item, i) => (
                                            <div key={i} className="flex gap-3">
                                               <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                                  <item.icon className="w-3.5 h-3.5 text-indigo-400" />
                                               </div>
                                               <div className="min-w-0">
                                                  <p className="text-[10px] font-black text-gray-300 uppercase leading-none mb-1">{item.label}</p>
                                                  <p className="text-xs font-bold text-gray-700 truncate leading-none">{item.value}</p>
                                               </div>
                                            </div>
                                         ))}
                                      </div>

                                      {s.message && (
                                        <div className="mt-6 p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/20 text-xs font-bold text-indigo-700 leading-relaxed">
                                           {s.message}
                                        </div>
                                      )}
                                   </div>
                                </div>
                             </CardContent>
                          </Card>
                       </motion.div>
                     );
                   })}
                </AnimatePresence>
             </div>
           )}
        </ScrollArea>
        
        <div className="px-10 py-6 border-t border-gray-100 bg-white flex justify-end">
           <Button 
            variant="ghost" 
            className="rounded-xl font-black text-sm text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            onClick={() => onOpenChange(false)}
           >
              إغلاق النافذة
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionsModal;
