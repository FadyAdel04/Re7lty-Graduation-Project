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
  LogOut
} from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { adminService } from "@/services/adminService";
import AdminLayout from "@/components/admin/AdminLayout";
import KPICards from "@/components/admin/KPICards";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const AdminDashboard = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  // Dashboard State
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
    totalCorporateTrips: 0
  });

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
      ] = await Promise.all([
        adminService.getAnalytics(token || undefined),
        adminService.getTopTrips(token || undefined),
        adminService.getWeeklyActivity(token || undefined),
        adminService.getAllUsers(token || undefined),
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
        totalCorporateTrips: analyticsData?.totalCorporateTrips || 0
      });
      
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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* 1. Quick Management Panel (4 cols) */}
          <div className="xl:col-span-4 space-y-6">
             <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-widest px-2">إدارة سريعة</h3>
             <div className="grid grid-cols-1 gap-4">
                {[
                  { title: "إدارة الشركات", desc: "تفعيل وتوثيق حسابات الشركات", icon: Building2, color: "bg-purple-600", path: "/admin/companies" },
                  { title: "الرحلات والباقات", desc: "مراجعة العروض السياحية المضافة", icon: Plane, color: "bg-emerald-600", path: "/admin/trips" },
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
                     <div className="flex-1">
                        <h4 className="font-black text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                        <p className="text-[10px] font-bold text-gray-400">{item.desc}</p>
                     </div>
                     <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 rotate-180 transition-all" />
                  </motion.div>
                ))}
             </div>
          </div>

          {/* 2. Top Performing Trips (8 cols) */}
          <div className="xl:col-span-8">
             <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-xl shadow-gray-200/20 p-8 h-full">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                         <Star className="w-5 h-5 fill-current" />
                      </div>
                      <h3 className="text-xl font-black text-gray-900">أفضل الرحلات أداءً</h3>
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
                         <div className="flex-1 min-w-0">
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
          </div>
        </div>

        {/* 3. Global Activity & Users */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Activity Log */}
           <div className="lg:col-span-7 bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
              <h3 className="text-xl font-black mb-6 relative z-10">النشاط الأسبوعي للمنصة</h3>
              <div className="space-y-3 relative z-10">
                 {weeklyActivity.map((day, idx) => (
                   <div key={idx} className="flex items-center gap-6 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/5 hover:bg-white/20 transition-all">
                      <span className="w-16 font-black text-indigo-100">{day.dayName}</span>
                      <div className="flex-1 flex gap-6 text-sm">
                         <div className="flex items-center gap-2"><UsersIcon className="w-4 h-4 text-blue-300" /> <span className="font-black">{day.users}</span></div>
                         <div className="flex items-center gap-2"><Plane className="w-4 h-4 text-emerald-300" /> <span className="font-black">{day.trips}</span></div>
                         <div className="flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-rose-300" /> <span className="font-black">{day.reactions}</span></div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Recent Users List */}
           <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-xl shadow-gray-200/20">
              <h3 className="text-xl font-black text-gray-900 mb-6">أحدث الأعضاء</h3>
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
    </AdminLayout>
  );
};

export default AdminDashboard;
