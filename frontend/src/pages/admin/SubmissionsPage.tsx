import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/services/adminService";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Trash2, 
  Clock, 
  FileCheck, 
  FileX, 
  Building2,
  Mail,
  Phone,
  MessageSquare
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SubmissionsPage = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const adminEmail = 'supermincraft52@gmail.com';
    const isAdmin = user?.emailAddresses?.some(email => email.emailAddress === adminEmail);
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchSubmissions();
  }, [user, navigate, filter]);

  const fetchSubmissions = async () => {
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
        alert('حدث خطأ أثناء الموافقة');
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
        alert('حدث خطأ أثناء الرفض');
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
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const statusMap = {
    pending: { label: 'قيد الانتظار', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    approved: { label: 'موافق عليه', icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    rejected: { label: 'مرفوض', icon: FileX, color: 'text-rose-600', bg: 'bg-rose-50' }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-10" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 font-cairo">طلبات <span className="text-indigo-600">التدقيق</span></h1>
              <p className="text-gray-500 font-bold text-sm">مراجعة والتحقق من أوراق الشركات الراغبة في الانضمام للمنصة.</p>
           </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
           {[
             { id: 'all', label: 'الكل', count: submissions.length },
             { id: 'pending', label: 'قيد الانتظار', count: submissions.filter(s => s.status === 'pending').length },
             { id: 'approved', label: 'تمت الموافقة', count: submissions.filter(s => s.status === 'approved').length },
             { id: 'rejected', label: 'المرفوضة', count: submissions.filter(s => s.status === 'rejected').length },
           ].map((btn) => (
             <button
               key={btn.id}
               onClick={() => setFilter(btn.id)}
               className={cn(
                 "h-12 px-6 rounded-2xl font-black text-sm transition-all flex items-center gap-3",
                 filter === btn.id 
                   ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                   : "bg-white border border-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
               )}
             >
               {btn.label}
               <span className={cn(
                 "px-2 py-0.5 rounded-lg text-[10px] font-black",
                 filter === btn.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
               )}>
                 {btn.count}
               </span>
             </button>
           ))}
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="grid gap-6">
             {[1,2,3].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse shadow-sm" />)}
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-10 h-10 text-gray-200" />
             </div>
             <h3 className="text-xl font-black text-gray-900">لا توجد طلبات للعرض</h3>
             <p className="text-gray-400 font-bold">كل شيء يبدو منظماً، لا توجد طلبات {filter !== 'all' && `بترشيح: ${statusMap[filter as keyof typeof statusMap].label}`}.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            <AnimatePresence>
              {submissions.map((s, idx) => {
                const status = statusMap[s.status as keyof typeof statusMap];
                return (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                     <Card className="border-0 shadow-2xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden group hover:scale-[1.01] transition-all duration-500">
                        <CardContent className="p-0">
                           <div className="flex flex-col lg:flex-row">
                             
                             {/* Side Status Bar */}
                             <div className={cn("w-full lg:w-3 border-b lg:border-b-0 lg:border-l border-gray-100", status.bg.replace('/50', ''))} />
                             
                             <div className="flex-1 p-8">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                                   <div className="flex items-center gap-5">
                                      <div className="w-16 h-16 rounded-[1.25rem] bg-gray-50 flex items-center justify-center text-indigo-600 font-black text-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                                         {s.companyName[0]}
                                      </div>
                                      <div>
                                         <h3 className="text-2xl font-black text-gray-900 mb-1">{s.companyName}</h3>
                                         <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                               <Clock className="w-3.5 h-3.5" />
                                               تم التقديم في {new Date(s.createdAt).toLocaleDateString('ar-EG')}
                                            </span>
                                            <Badge className={cn("px-3 py-1 rounded-full border-0 font-black text-[10px] uppercase shadow-inner", status.bg, status.color)}>
                                               {status.label}
                                            </Badge>
                                         </div>
                                      </div>
                                   </div>

                                   <div className="flex items-center gap-2">
                                      {s.status === 'pending' ? (
                                        <>
                                           <Button 
                                             onClick={() => handleApprove(s._id)}
                                             className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-2 shadow-lg shadow-emerald-100"
                                           >
                                              <CheckCircle className="w-4 h-4" />
                                              موافقة
                                           </Button>
                                           <Button 
                                             onClick={() => handleReject(s._id)}
                                             className="h-12 px-6 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 border-0 font-black text-xs gap-2"
                                           >
                                              <XCircle className="w-4 h-4" />
                                              رفض
                                           </Button>
                                        </>
                                      ) : (
                                        <Button 
                                          onClick={() => handleDelete(s._id)}
                                          className="h-12 px-6 rounded-2xl bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600 border-0 font-black text-xs"
                                        >
                                           <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                   </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                   {[
                                     { icon: Mail, label: 'البريد', value: s.email },
                                     { icon: Phone, label: 'الهاتف', value: s.phone },
                                     { icon: MessageSquare, label: 'واتساب', value: s.whatsapp },
                                     { icon: Building2, label: 'التخصص', value: s.tripTypes },
                                   ].map((item, i) => (
                                      <div key={i} className="p-4 rounded-3xl bg-gray-50/50 border border-gray-100/50 hover:bg-white transition-colors group/item">
                                         <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform">
                                               <item.icon className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{item.label}</span>
                                         </div>
                                         <p className="text-sm font-black text-gray-800 truncate">{item.value}</p>
                                      </div>
                                   ))}
                                </div>

                                {s.message && (
                                   <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100/30">
                                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">رسالة التقديم</h4>
                                      <p className="text-sm font-bold text-gray-700 leading-relaxed">{s.message}</p>
                                   </div>
                                )}

                                {s.status === 'rejected' && s.rejectionReason && (
                                   <div className="mt-4 p-6 rounded-3xl bg-rose-50 border border-rose-100">
                                      <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">سبب الرفض كمسؤول نظام</h4>
                                      <p className="text-sm font-bold text-rose-700">{s.rejectionReason}</p>
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
      </div>
    </AdminLayout>
  );
};

export default SubmissionsPage;
