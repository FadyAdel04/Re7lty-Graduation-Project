import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  MessageSquare, 
  Flag, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Mail,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Inbox
} from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { complaintsService } from "@/services/complaintsService";
import { contentReportsService } from "@/services/contentReportsService";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Types
interface Complaint {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
}

interface ContentReport {
  _id: string;
  tripId: {
    _id: string;
    title: string;
    destination: string;
    author: string;
  };
  reportedBy: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
}

const ComplaintsPage = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("complaints");
  
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const adminEmail = 'supermincraft52@gmail.com';
    const isAdmin = user?.emailAddresses?.some(email => email.emailAddress === adminEmail);
    if (user && !isAdmin) navigate('/');
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      if (activeTab === "complaints") {
        const data = await complaintsService.getComplaints(token);
        setComplaints(data);
      } else {
        const data = await contentReportsService.getReports(token);
        setReports(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [activeTab, user]);

  const handleUpdateStatus = async (id: string, type: 'complaint' | 'report', status: 'resolved' | 'dismissed' | 'pending') => {
    setActionLoading(id);
    try {
      const token = await getToken();
      if (!token) return;

      if (type === 'complaint') {
        await complaintsService.updateComplaint(id, { status }, token);
        setComplaints(prev => prev.map(c => c._id === id ? { ...c, status } : c));
      } else {
        await contentReportsService.updateReport(id, { status }, token);
        setReports(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      }

      toast({
        title: "تم تحديث الحالة بنجاح",
        description: `تم تغيير حالة ${type === 'complaint' ? 'الرسالة' : 'البلاغ'} إلى ${statusMap[status].label}`,
        className: "bg-white border-indigo-100 rounded-[1.5rem] shadow-2xl",
      });
    } catch (error) {
      toast({
        title: "حدث خطأ غير متوقع",
        description: "فشل تحديث الحالة، يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, type: 'complaint' | 'report') => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    setActionLoading(id);
    try {
      const token = await getToken();
      if (!token) return;

      if (type === 'complaint') {
        await complaintsService.deleteComplaint(id, token);
        setComplaints(prev => prev.filter(c => c._id !== id));
      } else {
        await contentReportsService.deleteReport(id, token);
        setReports(prev => prev.filter(r => r._id !== id));
      }
      
      toast({
        title: "تم الحذف نهائياً",
        description: `تم حذف ${type === 'complaint' ? 'الرسالة' : 'البلاغ'} من النظام.`,
        className: "bg-white border-rose-100 rounded-[1.5rem] shadow-2xl",
      });
    } catch (error) {
      toast({
        title: "خطأ في الحذف",
        description: "لا يمكن حذف هذا البند حالياً.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const statusMap = {
    pending: { label: 'قيد الانتظار', color: 'text-rose-600', bg: 'bg-rose-50' },
    resolved: { label: 'تم الحل', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    dismissed: { label: 'تم التجاهل', color: 'text-gray-500', bg: 'bg-gray-100' }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-10" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 font-cairo">مركز <span className="text-indigo-600">البلاغات</span></h1>
              <p className="text-gray-500 font-bold text-sm">إدارة شكاوى المستخدمين والتبليغ عن المحتوى المخالف.</p>
           </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-16 bg-white border border-gray-100 p-2 rounded-2xl gap-2 w-full max-w-sm mb-10 overflow-hidden">
            <TabsTrigger 
              value="complaints" 
              className="flex-1 h-full rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-indigo-100 font-black text-sm gap-2 transition-all"
            >
              <Inbox className="h-4 w-4" />
              الرسائل
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex-1 h-full rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-indigo-100 font-black text-sm gap-2 transition-all"
            >
              <ShieldAlert className="h-4 w-4" />
              البلاغات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="complaints">
            {loading ? (
              <div className="grid gap-6">
                 {[1,2].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse shadow-sm" />)}
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm">
                 <Mail className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                 <h3 className="text-xl font-black text-gray-900">لا توجد رسائل</h3>
                 <p className="text-gray-400 font-bold">صندوق الرسائل فارغ تماماً.</p>
              </div>
            ) : (
              <div className="grid gap-8">
                <AnimatePresence>
                   {complaints.map((c, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                       <Card className="border-0 shadow-2xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden group">
                          <CardContent className="p-8">
                             <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                      <MessageSquare className="w-6 h-6" />
                                   </div>
                                   <div>
                                      <div className="flex items-center gap-3 mb-1">
                                         <h4 className="text-xl font-black text-gray-900">{c.subject || 'رسالة تواصل'}</h4>
                                         <Badge className={cn("px-3 py-1 rounded-full border-0 font-black text-[10px] uppercase shadow-inner", statusMap[c.status as keyof typeof statusMap].bg, statusMap[c.status as keyof typeof statusMap].color)}>
                                            {statusMap[c.status as keyof typeof statusMap].label}
                                         </Badge>
                                      </div>
                                      <p className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                         <span className="text-indigo-600 font-black">{c.name}</span>
                                         <span>•</span>
                                         <span>{c.email}</span>
                                      </p>
                                   </div>
                                </div>
                                 <div className="flex items-center gap-2">
                                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                       {(['pending', 'resolved', 'dismissed'] as const).map((st) => (
                                          <button
                                            key={st}
                                            onClick={() => handleUpdateStatus(c._id, 'complaint', st)}
                                            disabled={actionLoading === c._id || c.status === st}
                                            className={cn(
                                               "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all",
                                               c.status === st 
                                                ? "bg-white text-gray-900 shadow-sm" 
                                                : "text-gray-400 hover:text-gray-600"
                                            )}
                                          >
                                             {statusMap[st].label}
                                          </button>
                                       ))}
                                    </div>
                                    <Button 
                                       size="sm"
                                       variant="ghost" 
                                       className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 p-0"
                                       onClick={() => handleDelete(c._id, 'complaint')}
                                    >
                                       <Trash2 className="h-4 w-4" />
                                    </Button>
                                 </div>
                              </div>

                             <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 font-bold text-gray-700 text-sm leading-relaxed mb-4">
                                {c.message}
                             </div>
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-2 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {new Date(c.createdAt).toLocaleDateString('ar-EG')}
                             </p>
                          </CardContent>
                       </Card>
                    </motion.div>
                   ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports">
             {loading ? (
                <div className="grid gap-6">
                   {[1,2].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse shadow-sm" />)}
                </div>
             ) : reports.length === 0 ? (
               <div className="text-center py-32 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm">
                  <ShieldAlert className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-gray-900">لا توجد بلاغات</h3>
                  <p className="text-gray-400 font-bold">لم يبلغ أحد عن أي محتوى حتى الآن.</p>
               </div>
             ) : (
               <div className="grid gap-8">
                  <AnimatePresence>
                     {reports.map((r, idx) => (
                       <motion.div
                         key={idx}
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: idx * 0.05 }}
                       >
                          <Card className="border-0 shadow-2xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden group">
                             <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                                   <div className="flex items-center gap-4">
                                      <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                         <AlertTriangle className="w-6 h-6" />
                                      </div>
                                      <div>
                                         <div className="flex items-center gap-3 mb-1">
                                            <h4 className="text-xl font-black text-gray-900">بلاغ عن رحلة: {r.tripId?.title || 'رحلة محذوفة'}</h4>
                                            <Badge className={cn("px-3 py-1 rounded-full border-0 font-black text-[10px] uppercase shadow-inner", statusMap[r.status as keyof typeof statusMap].bg, statusMap[r.status as keyof typeof statusMap].color)}>
                                               {statusMap[r.status as keyof typeof statusMap].label}
                                            </Badge>
                                         </div>
                                         <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                            <span className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">
                                               {r.reason === 'spam' ? 'احتيال' : r.reason === 'inappropriate' ? 'غير لائق' : 'مضلل'}
                                            </span>
                                            {r.tripId && (
                                              <Link to={`/trips/${r.tripId._id}`} className="text-indigo-600 hover:underline flex items-center gap-1 font-black">
                                                 رابط الرحلة <ExternalLink className="h-3 w-3" />
                                              </Link>
                                            )}
                                         </div>
                                      </div>
                                   </div>
                                    <div className="flex items-center gap-2">
                                       <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                          {(['pending', 'resolved', 'dismissed'] as const).map((st) => (
                                             <button
                                               key={st}
                                               onClick={() => handleUpdateStatus(r._id, 'report', st)}
                                               disabled={actionLoading === r._id || r.status === st}
                                               className={cn(
                                                  "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all",
                                                  r.status === st 
                                                   ? "bg-white text-gray-900 shadow-sm" 
                                                   : "text-gray-400 hover:text-gray-600"
                                               )}
                                             >
                                                {statusMap[st].label}
                                             </button>
                                          ))}
                                       </div>
                                       <Button 
                                          size="sm"
                                          variant="ghost" 
                                          className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 p-0"
                                          onClick={() => handleDelete(r._id, 'report')}
                                       >
                                          <Trash2 className="h-4 w-4" />
                                       </Button>
                                    </div>
                                 </div>

                                <div className="p-6 rounded-3xl bg-rose-50/30 border border-rose-100 font-bold text-gray-700 text-sm leading-relaxed mb-4">
                                   <span className="text-[10px] font-black text-rose-400 block mb-1 uppercase tracking-widest">وصف البلاغ</span>
                                   {r.description || 'لا يوجد وصف معمق'}
                                </div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-2 flex items-center gap-1.5">
                                   <Clock className="w-3 h-3" />
                                   {new Date(r.createdAt).toLocaleDateString('ar-EG')}
                                </p>
                             </CardContent>
                          </Card>
                       </motion.div>
                     ))}
                  </AnimatePresence>
               </div>
             )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ComplaintsPage;
