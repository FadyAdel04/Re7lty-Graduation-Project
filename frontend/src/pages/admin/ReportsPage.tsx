import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { adminService } from "@/services/adminService";
import { exportReportToPDF } from "@/services/PDFExportService";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Download, 
  Loader2, 
  FileText, 
  TrendingUp, 
  Users, 
  Building2, 
  Heart, 
  Bookmark, 
  Plane, 
  ThumbsUp,
  MapPin,
  Sparkles,
  Zap,
  ArrowUpRight,
  PieChart as PieIcon,
  BarChart as BarIcon,
  Activity
} from "lucide-react";
import PieChart from "@/components/admin/charts/PieChart";
import BarChart from "@/components/admin/charts/BarChart";
import LineChart from "@/components/admin/charts/LineChart";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const ReportsPage = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [period, setPeriod] = useState('weekly');
  const [reportData, setReportData] = useState<any>(null);

  // Refs for chart elements (for PDF export)
  const chartRefs = {
    tripDistribution: useRef<HTMLDivElement>(null),
    engagement: useRef<HTMLDivElement>(null),
    companyActivity: useRef<HTMLDivElement>(null),
    submissions: useRef<HTMLDivElement>(null),
    dailyActivity: useRef<HTMLDivElement>(null)
  };

  useEffect(() => {
    const adminEmail = 'supermincraft52@gmail.com';
    const isAdmin = user?.emailAddresses?.some(email => email.emailAddress === adminEmail);
    if (!isAdmin) {
      navigate('/');
      return;
    }
    if (user) fetchReportData();
  }, [user, navigate, period]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await adminService.getReportsData(token || undefined, period);
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportData) return;
    setExporting(true);
    try {
      const chartElements = Object.values(chartRefs)
        .map(ref => ref.current)
        .filter(el => el !== null) as HTMLElement[];
      await exportReportToPDF(reportData, chartElements);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('حدث خطأ أثناء تصدير التقرير');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-black">جاري تحليل البيانات...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-10" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 font-cairo">تحليلات <span className="text-indigo-600">الأداء</span></h1>
              <p className="text-gray-500 font-bold text-sm">تقارير بيانية مفصلة عن نمو وتفاعل المستخدمين والشركات.</p>
           </div>
           
           <div className="flex gap-3">
              <div className="bg-white border border-gray-100 rounded-2xl p-1.5 flex gap-1">
                 {['daily', 'weekly', 'monthly'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                        period === p ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                      )}
                    >
                       {p === 'daily' ? 'يومي' : p === 'weekly' ? 'أسبوعي' : 'شهري'}
                    </button>
                 ))}
              </div>

              <Button 
                onClick={handleExportPDF} 
                disabled={exporting}
                className="h-14 px-8 rounded-2xl bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 font-black text-sm gap-2 shadow-sm"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-orange-500" />}
                تصدير PDF
              </Button>

           </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
           {[
             { title: "إجمالي المستخدمين", value: reportData?.overview?.totalUsers, change: reportData?.overview?.newUsers, icon: Users, color: "indigo" },
             { title: "الرحلات المضافة", value: reportData?.overview?.totalTrips, change: reportData?.overview?.newTrips, icon: Plane, color: "emerald" },
             { title: "الشركات النشطة", value: reportData?.overview?.totalCompanies, change: reportData?.overview?.activeCompanies, icon: Building2, color: "purple" },
             { title: "إجمالي التفاعلات", value: reportData?.overview?.totalReactions, change: reportData?.overview?.newReactions, icon: Activity, color: "rose" },
             { title: "إجمالي البلاغات", value: reportData?.overview?.totalReports, change: reportData?.overview?.newReports, icon: FileText, color: "orange" },
           ].map((stat, i) => (
             <Card key={i} className="border-0 shadow-xl shadow-gray-200/40 rounded-[2rem] overflow-hidden group">
                <CardContent className="p-6">
                   <div className="flex items-center justify-between mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12",
                        `bg-${stat.color}-50 text-${stat.color}-600`
                      )}>
                         <stat.icon className="w-6 h-6" />
                      </div>
                      <div className="h-8 px-2.5 rounded-xl bg-gray-50 flex items-center gap-1.5 text-[10px] font-black text-gray-400">
                         <Zap className="w-3 h-3 text-orange-500 fill-orange-500" />
                         نشط اليوم
                      </div>
                   </div>
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.title}</h4>
                   <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-gray-900 leading-none">{stat.value?.toLocaleString('ar-EG')}</p>
                      <p className="text-[10px] font-black text-emerald-500">+{stat.change?.toLocaleString('ar-EG')}</p>
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>

        {/* Large Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
           
           {/* 1. Daily Activity Line Chart */}
           <Card className="xl:col-span-2 border-0 shadow-2xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                 <div ref={chartRefs.dailyActivity}>
                    <LineChart
                      data={reportData?.dailyBreakdown || []}
                      xKey="dayName"
                      lines={[
                        { key: 'users', name: 'مستخدمين', color: '#6366f1' },
                        { key: 'trips', name: 'رحلات', color: '#10b981' },
                        { key: 'reactions', name: 'تفاعلات', color: '#f43f5e' }
                      ]}
                      title="النشاط اليومي المقارن"
                    />
                 </div>
              </CardContent>
           </Card>

           {/* 2. Trip Distribution Pie */}
           <Card className="border-0 shadow-xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                 <div ref={chartRefs.tripDistribution}>
                    <PieChart
                      data={reportData?.charts?.tripDistribution || []}
                      title="توزيع أنواع الرحلات"
                      colors={['#6366f1', '#8b5cf6', '#a855f7']}
                    />
                 </div>
              </CardContent>
           </Card>

           {/* 3. Engagement Distribution Pie */}
           <Card className="border-0 shadow-xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                 <div ref={chartRefs.engagement}>
                    <PieChart
                      data={reportData?.charts?.engagementDistribution || []}
                      title="توزيع التفاعلات"
                      colors={['#f43f5e', '#f59e0b', '#10b981']}
                    />
                 </div>
              </CardContent>
           </Card>

           {/* 4. Company Activity Bar */}
           <Card className="border-0 shadow-xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                 <div ref={chartRefs.companyActivity}>
                    <BarChart
                      data={reportData?.charts?.companyActivity || []}
                      xKey="name"
                      yKey="value"
                      title="الشركات الأكثر نشاطاً"
                      color="#6366f1"
                      formatValue={(v) => `${v}`}
                    />
                 </div>
              </CardContent>
           </Card>

           {/* 5. Submission Stats Pie */}
           <Card className="border-0 shadow-xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                 <div ref={chartRefs.submissions}>
                    <PieChart
                      data={reportData?.charts?.submissionStats || []}
                      title="حالة طلبات الانضمام"
                      colors={['#10b981', '#f59e0b', '#ef4444']}
                    />
                 </div>
              </CardContent>
           </Card>

        </div>

        {/* Top Lists Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
           
           {/* Top Trips */}
           <Card className="border-0 shadow-2xl shadow-gray-200/40 rounded-[2.5rem] p-8">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                       <Zap className="h-5 w-5 fill-current" />
                    </div>
                    الرحلات الأعلى تفاعلاً
                 </h3>
              </div>
              <div className="space-y-4">
                 {reportData?.topContent?.trips?.slice(0, 5).map((trip: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50/50 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all group">
                       <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-sm bg-gray-100">
                          <img 
                            src={
                              (trip.images && trip.images[0]) || 
                              trip.image || 
                              (trip.activities?.[0]?.images?.[0]) ||
                              'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=200&h=200'
                            } 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            alt={trip.title}
                          />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="font-black text-sm text-gray-900 truncate">{trip.title}</h4>
                          <p className="text-[10px] font-bold text-gray-400">{trip.destination}</p>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="text-center">
                             <p className="text-sm font-black text-rose-500">{trip.likes}</p>
                             <Heart className="w-3 h-3 text-rose-300 m-auto" />
                          </div>
                          <div className="text-center">
                             <p className="text-sm font-black text-indigo-600">{trip.saves}</p>
                             <Bookmark className="w-3 h-3 text-indigo-300 m-auto" />
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>

           {/* Top Companies */}
           <Card className="border-0 shadow-2xl shadow-gray-200/40 rounded-[2.5rem] p-8">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                       <Building2 className="h-5 w-5 fill-current" />
                    </div>
                    أقوى الشركاء أداءً
                 </h3>
              </div>
              <div className="space-y-4">
                 {reportData?.topContent?.companies?.slice(0, 5).map((c: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50/50 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all group">
                       <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm text-indigo-600 font-black text-xl">
                          {c.logo ? <img src={c.logo} className="w-full h-full object-cover rounded-2xl" /> : c.name[0]}
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="font-black text-sm text-gray-900 truncate">{c.name}</h4>
                          <p className="text-[10px] font-bold text-gray-400">{c.email}</p>
                       </div>
                       <div className="bg-indigo-600 text-white px-5 py-2 rounded-2xl shadow-lg shadow-indigo-100/50">
                          <span className="text-[10px] font-bold opacity-60 block leading-none">رحلات</span>
                          <span className="text-lg font-black leading-none">{c.tripsCount}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>

        </div>

        {/* Daily Breakdown Table */}
        <Card className="border-0 shadow-2xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden">
           <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                       <Activity className="h-5 w-5" />
                    </div>
                    التفصيل اليومي للنشاط
                 </h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full min-w-[700px]">
                    <thead>
                       <tr className="border-b border-gray-100">
                          <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">التاريخ</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">المستخدمين</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">الرحلات</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">التفاعلات</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">التعليقات</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">البلاغات</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {reportData?.dailyBreakdown?.map((day: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                             <td className="px-6 py-4">
                                <span className="font-bold text-gray-900 text-sm">{day.dayName}</span>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <span className="inline-flex h-8 px-3 rounded-lg bg-indigo-50 text-indigo-600 font-black text-xs items-center">{day.users}</span>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <span className="inline-flex h-8 px-3 rounded-lg bg-emerald-50 text-emerald-600 font-black text-xs items-center">{day.trips}</span>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <span className="inline-flex h-8 px-3 rounded-lg bg-rose-50 text-rose-600 font-black text-xs items-center">{day.reactions}</span>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <span className="inline-flex h-8 px-3 rounded-lg bg-purple-50 text-purple-600 font-black text-xs items-center">{day.comments}</span>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <span className="inline-flex h-8 px-3 rounded-lg bg-orange-50 text-orange-600 font-black text-xs items-center">{day.reports}</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 {(!reportData?.dailyBreakdown || reportData.dailyBreakdown.length === 0) && (
                    <div className="text-center py-10">
                       <p className="text-gray-400 font-bold">لا توجد بيانات متاحة حالياً.</p>
                    </div>
                 )}
              </div>
           </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
};

export default ReportsPage;
