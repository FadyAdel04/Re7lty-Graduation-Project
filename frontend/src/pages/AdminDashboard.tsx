import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { 
  Heart, 
  Bookmark, 
  Users as UsersIcon, 
  Plane, 
  ThumbsUp, 
  Building2, 
  ArrowRight, 
  FileText, 
  LayoutDashboard,
  Zap,
  Star,
  MapPin,
  LogOut,
  DollarSign
} from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { adminService } from "@/services/adminService";
import AdminLayout from "@/components/admin/AdminLayout";
import KPICards from "@/components/admin/KPICards";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from "@/lib/utils";

const AdminDashboard = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    weeklyActiveUsers: 0,
    totalTrips: 0,
    weeklyTrips: 0,
    totalReactions: 0,
    weeklyReactions: 0,
    totalComments: 0,
    weeklyComments: 0,
    totalCompanies: 0,
    totalCorporateTrips: 0,
    totalCommission: 0,
    totalGrossValue: 0,
    totalNetValue: 0,
    bookingCount: 0
  });

  const [bookingStats, setBookingStats] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Lists
  const [topTrips, setTopTrips] = useState<any[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    // Check if user is admin (specific email)
    const checkAdmin = () => {
      const adminEmail = 'supermincraft52@gmail.com';
      const userEmail = user?.emailAddresses?.find(email => email.emailAddress === adminEmail);
      
      if (!userEmail) {
        navigate('/');
        return false;
      }
      setIsAdmin(true);
      return true;
    };

    if (user && checkAdmin()) {
      fetchData();
    }
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const token = await getToken();
      
      // Fetch all data in parallel
      const [
        analyticsData,
        topTripsData,
        weeklyActivityData,
        allUsersData,
        bookingAnalytics,
      ] = await Promise.all([
        adminService.getAnalytics(token || undefined),
        adminService.getTopTrips(token || undefined),
        adminService.getWeeklyActivity(token || undefined),
        adminService.getAllUsers(token || undefined),
        adminService.getAdminBookingAnalytics(token || undefined),
      ]);
      
      // Update stats with real data from backend
      setStats({
        totalUsers: analyticsData?.totalUsers || 0,
        weeklyActiveUsers: analyticsData?.weeklyActiveUsers || 0,
        totalTrips: analyticsData?.totalTrips || 0,
        weeklyTrips: analyticsData?.weeklyTrips || 0,
        totalReactions: analyticsData?.totalReactions || 0,
        weeklyReactions: analyticsData?.weeklyReactions || 0,
        totalComments: analyticsData?.totalComments || 0,
        weeklyComments: analyticsData?.weeklyComments || 0,
        totalCompanies: analyticsData?.totalCompanies || 0,
        totalCorporateTrips: analyticsData?.totalCorporateTrips || 0,
        totalCommission: bookingAnalytics?.overview?.totalCommission || 0,
        totalGrossValue: bookingAnalytics?.overview?.totalGrossValue || 0,
        totalNetValue: bookingAnalytics?.overview?.totalNetValue || 0,
        bookingCount: bookingAnalytics?.overview?.bookingCount || 0
      });
      
      setBookingStats(bookingAnalytics);
      
      // Set chart and list data
      setTopTrips(topTripsData || []);
      setWeeklyActivity(weeklyActivityData || []);
      
      // Process recent users (sort by date desc and take top 8)
      const sortedUsers = (allUsersData || [])
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8);
      setRecentUsers(sortedUsers);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-10" dir="rtl">
        
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 font-cairo">نظرة عامة على <span className="text-indigo-600">الأداء</span></h1>
              <p className="text-gray-500 font-bold">مرحباً بك مجدداً، إليك ملخص لأهم مؤشرات المنصة اليوم.</p>
           </div>
           <div className="flex items-center gap-3">
              <button 
                onClick={() => fetchData()}
                className="h-12 px-6 rounded-2xl bg-white border border-gray-100 flex items-center gap-3 font-black text-sm text-gray-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              >
                 <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
                 تحديث البيانات
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                    signOut();
                  }
                }}
                className="h-12 px-6 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 font-black text-sm text-red-600 hover:bg-red-100 transition-all shadow-sm active:scale-95"
              >
                 <LogOut className="h-4 w-4" />
                 تسجيل الخروج
              </button>
           </div>
        </div>

        {/* KPI Cards Section */}
        <KPICards stats={stats} loading={loading} />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column (8/12): Analytics & Performance */}
          <div className="lg:col-span-8 space-y-10">
             
             {/* 0. Platform Revenue Section (New) */}
             <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-8 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                         <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-gray-900 font-cairo">تحليلات الأرباح (عمولة المبيعات)</h3>
                         <p className="text-xs font-bold text-gray-400">تتبع عمولة المنصة (5%) المحصلة من كل حجز فردي خلال الـ 30 يوم الماضية</p>
                      </div>
                   </div>
                   <div className="text-left">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">إجمالي الأرباح</div>
                      <div className="text-2xl font-black text-indigo-600 mt-1">{(stats.totalCommission || 0).toLocaleString()} ج.م</div>
                   </div>
                </div>

                <div className="h-[300px] w-full mt-6">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={bookingStats?.dailyTrends || []}>
                         <defs>
                            <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                               <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                         <XAxis 
                            dataKey="_id" 
                            hide 
                         />
                         <YAxis 
                            tick={{fontSize: 10, fontWeight: 'bold', fill: '#94A3B8'}}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `${value}`}
                         />
                         <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                            itemStyle={{ fontWeight: 'black', fontSize: '12px' }}
                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px', display: 'none' }}
                            formatter={(value: any) => [`${value.toLocaleString()} ج.م`, 'عمولة المنصة']}
                         />
                         <Area 
                            type="monotone" 
                            dataKey="commission" 
                            stroke="#4F46E5" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorComm)" 
                            animationDuration={2000}
                         />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
                
                <div className="flex items-center justify-around p-4 bg-gray-50 rounded-3xl border border-gray-100">
                   <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">متوسط الربح اليومي</p>
                      <p className="font-black text-gray-900 text-sm">
                        {bookingStats?.dailyTrends?.length > 0 
                           ? Math.round(stats.totalCommission / bookingStats.dailyTrends.length).toLocaleString() 
                           : 0} ج.م
                      </p>
                   </div>
                   <div className="h-8 w-[1px] bg-gray-200" />
                   <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">أعلى ربح يومي</p>
                      <p className="font-black text-emerald-600 text-sm">
                        {Math.max(...(bookingStats?.dailyTrends?.map((d: any) => d.commission) || [0])).toLocaleString()} ج.م
                      </p>
                   </div>
                </div>
             </div>

             {/* 1. Top Performing Trips */}
             <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-xl shadow-gray-200/20 p-8">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                         <Star className="w-5 h-5 fill-current" />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 font-cairo">أفضل الرحلات أداءً</h3>
                   </div>
                   <button className="text-indigo-600 font-black text-xs hover:underline">عرض الكل</button>
                </div>

                <div className="space-y-4">
                   {loading ? (
                      [1,2,3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-3xl animate-pulse" />)
                   ) : topTrips.map((trip: any, idx: number) => (
                      <div key={trip._id} className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50/50 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all group border border-transparent hover:border-indigo-100">
                         <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shadow-inner shrink-0">
                            <img 
                              src={
                                trip.image || 
                                (trip.images && trip.images[0]) || 
                                (trip.activities && trip.activities[0]?.images && trip.activities[0].images[0]) ||
                                'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=200&h=200'
                              } 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              alt={trip.title}
                            />
                         </div>
                         <div className="flex-1 min-w-0 text-right">
                            <h4 className="font-black text-gray-900 truncate">{trip.title}</h4>
                            <p className="text-xs font-bold text-gray-400">{trip.destination}</p>
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="text-center">
                               <div className="flex items-center gap-1.5 text-rose-500 font-black text-sm mb-1">
                                  <Heart className="w-4 h-4 fill-current" />
                                  {trip.likes || 0}
                               </div>
                               <p className="text-[10px] font-bold text-gray-400">إعجاب</p>
                            </div>
                            <div className="text-center">
                               <div className="flex items-center gap-1.5 text-indigo-600 font-black text-sm mb-1">
                                  <Bookmark className="w-4 h-4 fill-current" />
                                  {trip.saves || 0}
                               </div>
                               <p className="text-[10px] font-bold text-gray-400">حفظ</p>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* 2. Platform Activity Log */}
             <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
                <div className="flex items-center gap-4 mb-8 relative z-10">
                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10 backdrop-blur-md">
                      <Zap className="w-6 h-6 fill-white" />
                   </div>
                   <h3 className="text-2xl font-black font-cairo">نشاط المنصة الأسبوعي</h3>
                </div>
                
                <div className="space-y-4 relative z-10">
                   {weeklyActivity.map((day, idx) => (
                     <div key={idx} className="flex items-center gap-6 p-5 rounded-[2rem] bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 hover:scale-[1.01] transition-all">
                        <span className="w-20 font-black text-indigo-100 text-lg">{day.dayName}</span>
                        <div className="flex-1 flex gap-10 text-sm">
                           <div className="flex flex-col items-center gap-2">
                             <div className="flex items-center gap-1.5 font-black text-blue-300">
                                <UsersIcon className="w-4 h-4" /> {day.users}
                             </div>
                             <span className="text-[10px] uppercase font-black opacity-40">عضو</span>
                           </div>
                           <div className="flex flex-col items-center gap-2">
                             <div className="flex items-center gap-1.5 font-black text-emerald-300">
                                <Plane className="w-4 h-4" /> {day.trips}
                             </div>
                             <span className="text-[10px] uppercase font-black opacity-40">رحلة</span>
                           </div>
                           <div className="flex flex-col items-center gap-2">
                             <div className="flex items-center gap-1.5 font-black text-rose-300">
                                <ThumbsUp className="w-4 h-4" /> {day.reactions}
                             </div>
                             <span className="text-[10px] uppercase font-black opacity-40">تفاعل</span>
                           </div>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Right Column (4/12): Financial Sidebar & Management */}
          <div className="lg:col-span-4 space-y-10">
             
             {/* 1. Detailed Financial Sidebar (Platform Earnings 5%) */}
             <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative">
                   <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mt-16 blur-2xl" />
                   <h3 className="text-xl font-black font-cairo mb-1 relative z-10">أرباح المنصة المباشرة</h3>
                   <p className="text-indigo-100 text-xs font-bold opacity-80 relative z-10">عمولة 5% من جميع الحجوزات</p>
                   
                   <div className="mt-8 relative z-10">
                      <div className="text-4xl font-black mb-1">{(stats.totalCommission || 0).toLocaleString()} <span className="text-lg opacity-60">ج.م</span></div>
                      <div className="flex items-center gap-2 text-indigo-200 text-sm font-bold">
                         <div className="h-2 w-2 bg-emerald-400 rounded-full" />
                         صافي عمولة المنصة
                      </div>
                   </div>
                </div>

                <div className="p-6 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-3xl bg-gray-50 border border-gray-100">
                         <span className="block text-[10px] text-gray-400 font-black uppercase mb-1">إجمالي المبيعات</span>
                         <span className="font-black text-gray-900 text-lg">{(stats.totalGrossValue || 0).toLocaleString()}</span>
                      </div>
                      <div className="p-4 rounded-3xl bg-gray-50 border border-gray-100">
                         <span className="block text-[10px] text-gray-400 font-black uppercase mb-1">صافي الشركات</span>
                         <span className="font-black text-indigo-600 text-lg">{(stats.totalNetValue || 0).toLocaleString()}</span>
                      </div>
                   </div>

                   <Separator className="opacity-50" />

                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">الأرباح حسب الشركة</h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                         {loading ? (
                            [1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-2xl animate-pulse" />)
                         ) : (bookingStats?.companies || []).map((company: any) => (
                           <div key={company._id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                              <div className="min-w-0">
                                 <p className="font-black text-gray-800 text-sm truncate">{company.companyName}</p>
                                 <p className="text-[10px] font-bold text-gray-400">{company.bookingCount} حجز</p>
                              </div>
                              <div className="text-left">
                                 <p className="font-black text-indigo-600">{(company.totalCommission || 0).toLocaleString()}</p>
                                 <p className="text-[8px] font-black text-gray-300 uppercase">ج.م عمولة</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <Button className="w-full h-14 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-0 font-black mt-2">
                     تصدير التقرير المالي
                   </Button>
                </div>
             </div>

             {/* 2. Quick Management Panel */}
             <div className="space-y-4">
                <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-widest px-4">إدارة سريعة</h3>
                <div className="grid grid-cols-1 gap-4 px-2">
                   {[
                     { title: "إدارة الشركات", desc: "تفعيل وتوثيق حسابات الشركات", icon: Building2, color: "bg-purple-600", path: "/admin/companies" },
                     { title: "رحلات الشركات", desc: "مراجعة العروض السياحية المضافة", icon: Plane, color: "bg-emerald-600", path: "/admin/trips" },
                     { title: "قاعدة المستخدمين", desc: "إدارة وحظر الحسابات المخالفة", icon: UsersIcon, color: "bg-blue-600", path: "/admin/users" },
                     { title: "التقارير المالية", desc: "تصدير فواتير وتقارير PDF", icon: FileText, color: "bg-orange-600", path: "/admin/reports" },
                   ].map((item, i) => (
                     <motion.div
                       key={i}
                       whileHover={{ x: -8 }}
                       onClick={() => navigate(item.path)}
                       className="p-5 rounded-3xl bg-white border border-gray-50 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center gap-4"
                     >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white", item.color)}>
                           <item.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-right">
                           <h4 className="font-black text-gray-900 text-sm group-hover:text-indigo-600 transition-colors font-cairo">{item.title}</h4>
                           <p className="text-[10px] font-bold text-gray-400">{item.desc}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 rotate-180 transition-all" />
                     </motion.div>
                   ))}
                </div>
             </div>

             {/* 3. Recent Users List */}
             <div className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-xl shadow-gray-200/20">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-black text-gray-900 font-cairo">أحدث الأعضاء</h3>
                   <UsersIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   {recentUsers.map((u, i) => (
                     <motion.div 
                       key={i} 
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: i * 0.05 }}
                       className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-gray-50 border border-gray-100/50 hover:bg-indigo-50 transition-colors cursor-pointer group"
                       onClick={() => navigate(`/user/${u.clerkId}`)}
                     >
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform ring-4 ring-white">
                           <img src={u.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-center overflow-hidden w-full">
                           <p className="text-xs font-black text-gray-900 truncate">{u.fullName}</p>
                           <p className="text-[10px] font-bold text-gray-400">{new Date(u.createdAt).toLocaleDateString('ar-EG')}</p>
                        </div>
                     </motion.div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
