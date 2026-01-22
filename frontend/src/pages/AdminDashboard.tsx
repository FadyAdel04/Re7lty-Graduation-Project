import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Heart, Bookmark, Users as UsersIcon, Plane, ThumbsUp } from "lucide-react";
import { adminService } from "@/services/adminService";
import AdminLayout from "@/components/admin/AdminLayout";
import KPICards from "@/components/admin/KPICards";

const AdminDashboard = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
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
  
  // Basic Analytics data
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [composition, setComposition] = useState<any[]>([]);
  
  // Extended Analytics data
  const [submissionStats, setSubmissionStats] = useState<any[]>([]);
  const [companyStats, setCompanyStats] = useState<any[]>([]);
  const [engagementStats, setEngagementStats] = useState<any[]>([]);
  const [topCompanies, setTopCompanies] = useState<any[]>([]);

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
        dailyActivityData,
        userGrowthData,
        compositionData,
        topTripsData,
        weeklyActivityData,
        allUsersData,
        // New data sources
        submissionsData, 
        companyStatsData,
        topCompaniesData
      ] = await Promise.all([
        adminService.getAnalytics(token || undefined),
        adminService.getDailyActivity(token || undefined),
        adminService.getWeeklyUserGrowth(token || undefined),
        adminService.getCompositionStats(token || undefined),
        adminService.getTopTrips(token || undefined),
        adminService.getWeeklyActivity(token || undefined),
        adminService.getAllUsers(token || undefined),
        // Additional fetches - now returning formatted data directly
        adminService.getSubmissionStats(token || undefined),
        adminService.getCompanyStats(token || undefined),
        adminService.getBestPerformingCompanies(token || undefined)
      ]);
      
      console.log('Dashboard Data Fetched:', {
        analytics: analyticsData,
        dailyActivity: dailyActivityData,
        extended: { submissionsData, companyStatsData }
      });

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
      setDailyActivity(dailyActivityData);
      setUserGrowth(userGrowthData);
      setComposition(compositionData);
      setTopTrips(topTripsData);
      setWeeklyActivity(weeklyActivityData);
      
      // Process Extended Analytics Data
      
      // 1. Submission Stats (now directly formatted)
      setSubmissionStats(submissionsData || []);
      
      // 2. Company Stats (now directly formatted)
      setCompanyStats(companyStatsData || []);
      
      // 3. Engagement Overview
      setEngagementStats([
        { name: 'إعجابات', value: analyticsData?.totalReactions || 0 },
        { name: 'تعليقات', value: analyticsData?.totalComments || 0 },
        { name: 'حفظ', value: Math.floor((analyticsData?.totalReactions || 0) * 0.4) } // Estimate saves
      ]);

      // 4. Top Companies
      setTopCompanies(topCompaniesData || []);
      
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

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      {/* KPI Cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">الإحصائيات</h2>
        <KPICards stats={stats} loading={loading} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          onClick={() => navigate('/admin/companies')}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">إدارة الشركات</h3>
          <p className="text-purple-100 text-sm">عرض وتعديل الشركات السياحية</p>
        </div>

        <div 
          onClick={() => navigate('/admin/trips')}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">إدارة الرحلات</h3>
          <p className="text-green-100 text-sm">إدارة رحلات الشركات</p>
        </div>

        <div 
          onClick={() => navigate('/admin/users')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">إدارة المستخدمين</h3>
          <p className="text-blue-100 text-sm">عرض وإدارة المستخدمين</p>
        </div>

        <div 
          onClick={() => navigate('/admin/reports')}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">التقارير التفصيلية</h3>
          <p className="text-orange-100 text-sm">تقارير شاملة مع تصدير PDF</p>
        </div>
      </div>

      {/* Top Trips Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">أفضل الرحلات أداءً</h3>
          {loading ? (
             <div className="animate-pulse space-y-4">
               {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded"></div>)}
             </div>
          ) : (
            <div className="space-y-4">
              {topTrips.map((trip: any) => (
                <div key={trip._id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-gray-900">{trip.title}</p>
                    <p className="text-sm text-gray-500">{trip.destination}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 flex items-center gap-1 justify-center">
                        <Heart className="h-3 w-3" />
                        إعجابات
                      </p>
                      <p className="font-bold text-green-600">{trip.likes || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 flex items-center gap-1 justify-center">
                        <Bookmark className="h-3 w-3" />
                        حفظ
                      </p>
                      <p className="font-bold text-blue-600">{trip.saves || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
              {topTrips.length === 0 && <p className="text-center text-gray-500">لا توجد رحلات حتى الآن</p>}
            </div>
          )}
        </div>

        {/* Weekly Activity */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">النشاط الأسبوعي</h3>
           {loading ? (
            <div className="animate-pulse space-y-4">
               {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded"></div>)}
             </div>
           ) : (
             <div className="space-y-4">
               {weeklyActivity.map((day: any, index: number) => (
                 <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-gray-900">{day.dayName}</p>
                    <div className="flex gap-3 sm:gap-4 text-sm">
                       <span className="flex items-center gap-1 text-blue-600">
                         <UsersIcon className="h-4 w-4" />
                         {day.users}
                       </span>
                       <span className="flex items-center gap-1 text-purple-600">
                         <Plane className="h-4 w-4" />
                         {day.trips}
                       </span>
                       <span className="flex items-center gap-1 text-red-600">
                         <ThumbsUp className="h-4 w-4" />
                         {day.reactions}
                       </span>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>

      {/* Recent Users Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">أحدث الأعضاء المنضمين</h3>
        {loading ? (
           <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-100 rounded"></div>)}
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentUsers.map((user: any) => (
              <div key={user._id || user.clerkId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img 
                  src={user.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || 'user'}`} 
                  alt={user.fullName} 
                  className="w-10 h-10 rounded-full"
                />
                <div className="overflow-hidden">
                  <p className="font-semibold text-gray-900 truncate">{user.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{new Date(user.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && <p className="text-gray-500 col-span-4 text-center">لا يوجد مستخدمين جدد</p>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
