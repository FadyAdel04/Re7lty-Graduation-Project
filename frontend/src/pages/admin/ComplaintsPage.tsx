import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Inbox,
  BarChart3,
  PieChart as PieChartIcon,
  Table as TableIcon
} from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { complaintsService } from "@/services/complaintsService";
import { contentReportsService } from "@/services/contentReportsService";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

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
  // Comment States
  const [removedComments, setRemovedComments] = useState<any[]>([]);
  const [commentStats, setCommentStats] = useState<any>(null);
  
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
      } else if (activeTab === "reports") {
        const data = await contentReportsService.getReports(token);
        setReports(data);
      } else if (activeTab === "removed-comments") {
        const data = await complaintsService.getRemovedComments(token);
        setRemovedComments(data.comments);
        const stats = await complaintsService.getCommentStats(token);
        setCommentStats(stats);
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

  // Charts Data Preparation
  const COLORS = ['#10b981', '#f43f5e'];
  const pieData = commentStats ? [
    { name: 'تعليقات سليمة', value: commentStats.totalComments },
    { name: 'تعليقات محذوفة', value: commentStats.removedCount },
  ] : [];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-10" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 font-cairo">مركز <span className="text-indigo-600">الرقابة</span></h1>
              <p className="text-gray-500 font-bold text-sm">إدارة شكاوى المستخدمين، البلاغات، ومراقبة المحتوى المحظور.</p>
           </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-16 bg-white border border-gray-100 p-2 rounded-2xl gap-2 w-full max-w-2xl mb-10 overflow-hidden mx-auto shadow-sm">
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
            <TabsTrigger 
              value="removed-comments" 
              className="flex-1 h-full rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-indigo-100 font-black text-sm gap-2 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              الكومنتات المحذوفة
            </TabsTrigger>
          </TabsList>
          
          {/* Content Sections */}
          
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
                       <Card className="border-0 shadow-2xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden group hover:bg-gray-50/50 transition-colors">
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

                             <div className="p-6 rounded-3xl bg-white border border-gray-100 font-bold text-gray-700 text-sm leading-relaxed mb-4 shadow-sm">
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
                          <Card className="border-0 shadow-2xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden group hover:bg-gray-50/50 transition-colors">
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

                                <div className="p-6 rounded-3xl bg-rose-50/10 border border-rose-100 font-bold text-gray-700 text-sm leading-relaxed mb-4 shadow-sm">
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

          <TabsContent value="removed-comments">
            {commentStats && (
              <div className="mb-10 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-0 shadow-xl rounded-[2rem] bg-gradient-to-br from-indigo-500 to-violet-600 text-white overflow-hidden relative">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <CardContent className="p-8 relative z-10">
                           <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <MessageSquare className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-bold text-indigo-100">إجمالي التعليقات</span>
                           </div>
                           <h3 className="text-4xl font-black">{commentStats.totalComments}</h3>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl rounded-[2rem] bg-gradient-to-br from-rose-500 to-pink-600 text-white overflow-hidden relative">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <CardContent className="p-8 relative z-10">
                           <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Trash2 className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-bold text-rose-100">تعليقات محذوفة</span>
                           </div>
                           <h3 className="text-4xl font-black">{commentStats.removedCount}</h3>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl rounded-[2rem] bg-gradient-to-br from-orange-400 to-amber-500 text-white overflow-hidden relative">
                         <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <CardContent className="p-8 relative z-10">
                           <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-bold text-orange-100">نسبة التعليقات السيئة</span>
                           </div>
                           <h3 className="text-4xl font-black">{commentStats.toxicRatio}%</h3>
                        </CardContent>
                    </Card>
                </div>

                {/* Analysis Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-0 shadow-xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-gray-50/50 pb-2">
                           <CardTitle className="flex items-center gap-2 text-gray-800">
                               <PieChartIcon className="w-5 h-5 text-indigo-500" />
                               توزيع التعليقات
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="h-80 flex items-center justify-center p-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-0 shadow-xl rounded-[2.5rem] overflow-hidden">
                         <CardHeader className="bg-gray-50/50 pb-2">
                           <CardTitle className="flex items-center gap-2 text-gray-800">
                               <BarChart3 className="w-5 h-5 text-indigo-500" />
                               تحليل المشاعر (Sentiment Analysis)
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="h-80 w-full p-6">
                           <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        { name: 'إيجابي', value: commentStats.sentiment?.positive || 0, color: '#10b981' },
                                        { name: 'محايد', value: commentStats.sentiment?.neutral || 0, color: '#94a3b8' },
                                        { name: 'سلبي', value: commentStats.sentiment?.negative || 0, color: '#f43f5e' },
                                    ]}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 12 }} 
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                                        {
                                            [
                                                { name: 'إيجابي', value: commentStats.sentiment?.positive || 0, color: '#10b981' },
                                                { name: 'محايد', value: commentStats.sentiment?.neutral || 0, color: '#94a3b8' },
                                                { name: 'سلبي', value: commentStats.sentiment?.negative || 0, color: '#f43f5e' },
                                            ].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))
                                        }
                                    </Bar>
                                </BarChart>
                           </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
              </div>
            )}

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
               <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                      <TableIcon className="w-6 h-6 text-rose-500" />
                      سجل المحذوفات
                  </h3>
                  <Badge variant="outline" className="rounded-xl px-3 py-1 border-gray-200">
                      آخر {removedComments.length} تعليق
                  </Badge>
               </div>
               
               {loading ? (
                    <div className="p-10 text-center">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                    </div>
                ) : removedComments.length === 0 ? (
                    <div className="text-center py-20">
                        <CheckCircle2 className="h-16 w-16 text-emerald-200 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-gray-900">نظيف تماماً</h3>
                        <p className="text-gray-400 font-bold">لم يتم رصد أي كلمات محظورة.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                           <thead className="bg-gray-50/50 border-b border-gray-200">
                               <tr>
                                   <th className="px-6 py-4 font-black text-gray-900 text-sm rounded-tr-2xl">المستخدم</th>
                                   <th className="px-6 py-4 font-black text-gray-900 text-sm">المحتوى الأصلي</th>
                                   <th className="px-6 py-4 font-black text-gray-900 text-sm">الكلمات المحظورة</th>
                                   <th className="px-6 py-4 font-black text-gray-900 text-sm">التاريخ</th>
                                   <th className="px-6 py-4 font-black text-gray-900 text-sm rounded-tl-2xl">الإجراء</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                               {removedComments.map((c, idx) => (
                                   <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                       <td className="px-6 py-4">
                                           <div className="font-bold text-gray-900">{c.authorName}</div>
                                       </td>
                                       <td className="px-6 py-4">
                                           <div className="max-w-xs truncate text-gray-500 font-medium bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 text-xs">
                                               {c.content}
                                           </div>
                                       </td>
                                       <td className="px-6 py-4">
                                           <div className="flex flex-wrap gap-1">
                                                {c.detectedWords?.map((w: string, i: number) => (
                                                    <span key={i} className="inline-block bg-rose-50 text-rose-600 px-2 py-1 rounded text-[10px] font-black border border-rose-100">
                                                        {w}
                                                    </span>
                                                ))}
                                           </div>
                                       </td>
                                       <td className="px-6 py-4 text-xs font-bold text-gray-400 whitespace-nowrap">
                                           {new Date(c.removedAt).toLocaleString('ar-EG')}
                                       </td>
                                       <td className="px-6 py-4">
                                           {c.tripId && (
                                                <Link to={`/trips/${c.tripId}`} className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-xs font-black">
                                                    عرض الرحلة
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                           )}
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                        </table>
                    </div>
                )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ComplaintsPage;
