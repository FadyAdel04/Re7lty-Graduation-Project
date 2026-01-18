import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services/adminService";
import { 
  LayoutDashboard, 
  FileText, 
  Building2, 
  Plane,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface StatsState {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  companies?: { total: number; active: number; inactive: number };
  trips?: { total: number; active: number; inactive: number };
}

const AdminDashboard = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsState>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin (specific email)
    const checkAdmin = () => {
      const adminEmail = 'e79442457@gmail.com';
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
      const [statsData, submissionsData, companyStats, tripStats] = await Promise.all([
        adminService.getSubmissionStats(token || undefined),
        adminService.getSubmissions(token || undefined, 'all'),
        adminService.getCompanyStats(token || undefined),
        adminService.getTripStats(token || undefined)
      ]);
      
      setStats({
        ...statsData,
        companies: companyStats,
        trips: tripStats
      });
      // Take top 5 recent submissions
      setRecentSubmissions(submissionsData.submissions.slice(0, 5));
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">لوحة التحكم</h1>
          <p className="text-gray-600">مرحباً {user?.fullName || user?.firstName}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Submission Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                طلبات قيد الانتظار
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.pending}</div>
              <p className="text-xs text-gray-500 mt-1">تحتاج إلى مراجعة</p>
            </CardContent>
          </Card>

           {/* Company Stats */}
           <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                إجمالي الشركات
              </CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.companies?.total || 0}</div>
              <div className="flex gap-2 text-xs mt-1">
                <span className="text-green-600">{stats.companies?.active || 0} نشط</span>
                <span className="text-gray-400">|</span>
                <span className="text-red-600">{stats.companies?.inactive || 0} غير نشط</span>
              </div>
            </CardContent>
          </Card>

          {/* Trip Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                إجمالي الرحلات
              </CardTitle>
              <Plane className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.trips?.total || 0}</div>
              <div className="flex gap-2 text-xs mt-1">
                 <span className="text-green-600">{stats.trips?.active || 0} نشط</span>
                 <span className="text-gray-400">|</span>
                 <span className="text-red-600">{stats.trips?.inactive || 0} غير نشط</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                إجمالي الطلبات
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">جميع الطلبات</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/submissions')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">إدارة الطلبات</h3>
                  <p className="text-sm text-gray-500">مراجعة طلبات الشركات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/companies')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">إدارة الشركات</h3>
                  <p className="text-sm text-gray-500">عرض وتعديل الشركات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/trips')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Plane className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">إدارة الرحلات</h3>
                  <p className="text-sm text-gray-500">عرض وتعديل الرحلات</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Submissions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>أحدث الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">لا توجد طلبات حديثة</p>
            ) : (
              <div className="space-y-4">
                {recentSubmissions.map((submission: any) => (
                  <div key={submission._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-bold text-gray-900">{submission.companyName}</h4>
                      <p className="text-sm text-gray-500">{submission.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        submission.status === 'approved' ? 'bg-green-100 text-green-700' :
                        submission.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {submission.status === 'approved' ? 'موافق عليه' :
                         submission.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => navigate('/admin/submissions')}>
                        تفاصل
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
