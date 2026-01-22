import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { adminService } from "@/services/adminService";
import { exportReportToPDF } from "@/services/PDFExportService";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Loader2, FileText, TrendingUp, Users, Building2, Heart, Bookmark, UserPlus, Plane, ThumbsUp } from "lucide-react";
import PieChart from "@/components/admin/charts/PieChart";
import BarChart from "@/components/admin/charts/BarChart";
import LineChart from "@/components/admin/charts/LineChart";

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
    // Check if user is admin
    const adminEmail = 'supermincraft52@gmail.com';
    const isAdmin = user?.emailAddresses?.some(email => email.emailAddress === adminEmail);
    
    if (!isAdmin) {
      navigate('/');
      return;
    }

    if (user) {
      fetchReportData();
    }
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
      // Collect all chart elements
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

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value?.toLocaleString() || 0}</p>
            {change !== undefined && (
              <p className="text-sm text-green-600 mt-1">
                +{change?.toLocaleString() || 0} جديد
              </p>
            )}
          </div>
          <div className={`h-14 w-14 rounded-full ${color} flex items-center justify-center`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل التقرير...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-orange-600" />
            التقارير والتحليلات
          </h1>
          <p className="text-gray-600 mt-1">تقارير شاملة عن أداء المنصة</p>
        </div>
        <Button 
          onClick={handleExportPDF} 
          disabled={exporting}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري التصدير...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 ml-2" />
              تصدير PDF
            </>
          )}
        </Button>
      </div>

      {/* Period Filter */}
      <Card className="mb-8">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">الفترة الزمنية:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={period === 'daily' ? 'default' : 'outline'}
                onClick={() => setPeriod('daily')}
                size="sm"
                disabled={loading}
              >
                يومي
              </Button>
              <Button
                variant={period === 'weekly' ? 'default' : 'outline'}
                onClick={() => setPeriod('weekly')}
                size="sm"
                disabled={loading}
              >
                أسبوعي
              </Button>
              <Button
                variant={period === 'monthly' ? 'default' : 'outline'}
                onClick={() => setPeriod('monthly')}
                size="sm"
                disabled={loading}
              >
                شهري
              </Button>
            </div>
            {reportData?.period && (
              <span className="text-sm text-gray-600 sm:mr-auto">
                {reportData.period.label}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي المستخدمين"
          value={reportData?.overview?.totalUsers}
          change={reportData?.overview?.newUsers}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="إجمالي الرحلات"
          value={reportData?.overview?.totalTrips}
          change={reportData?.overview?.newTrips}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="إجمالي الشركات"
          value={reportData?.overview?.totalCompanies}
          change={reportData?.overview?.activeCompanies}
          icon={Building2}
          color="bg-purple-500"
        />
        <StatCard
          title="إجمالي التفاعلات"
          value={reportData?.overview?.totalReactions}
          change={reportData?.overview?.newReactions}
          icon={Heart}
          color="bg-pink-500"
        />
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">الرسوم البيانية</h2>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Trip Distribution */}
          <div ref={chartRefs.tripDistribution}>
            <PieChart
              data={reportData?.charts?.tripDistribution || []}
              title="توزيع أنواع الرحلات"
              colors={['#3b82f6', '#8b5cf6']}
            />
          </div>

          {/* Engagement Distribution */}
          <div ref={chartRefs.engagement}>
            <PieChart
              data={reportData?.charts?.engagementDistribution || []}
              title="توزيع التفاعلات"
              colors={['#ec4899', '#f59e0b', '#10b981']}
            />
          </div>

          {/* Company Activity */}
          <div ref={chartRefs.companyActivity}>
            <BarChart
              data={reportData?.charts?.companyActivity || []}
              xKey="name"
              yKey="value"
              title="نشاط الشركات"
              color="#8b5cf6"
              formatValue={(value) => `${value}`}
            />
          </div>

          {/* Submission Stats */}
          <div ref={chartRefs.submissions}>
            <PieChart
              data={reportData?.charts?.submissionStats || []}
              title="حالة طلبات الانضمام"
              colors={['#10b981', '#f59e0b', '#ef4444']}
            />
          </div>
        </div>

        {/* Daily Activity Line Chart */}
        <div ref={chartRefs.dailyActivity}>
          <LineChart
            data={reportData?.dailyBreakdown || []}
            xKey="dayName"
            lines={[
              { key: 'users', name: 'مستخدمين', color: '#3b82f6' },
              { key: 'trips', name: 'رحلات', color: '#10b981' },
              { key: 'reactions', name: 'تفاعلات', color: '#ec4899' }
            ]}
            title="النشاط اليومي"
          />
        </div>
      </div>

      {/* Top Content Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {/* Top Trips */}
        <Card>
          <CardHeader>
            <CardTitle>أفضل الرحلات أداءً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData?.topContent?.trips?.slice(0, 5).map((trip: any, index: number) => (
                <div key={trip._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 flex-1 w-full">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                      {trip.images && trip.images.length > 0 ? (
                        <img 
                          src={trip.images[0]} 
                          alt={trip.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = `<span class="text-orange-600 font-bold text-sm">${index + 1}</span>`;
                          }}
                        />
                      ) : (
                        <span className="text-orange-600 font-bold text-sm">{index + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{trip.title}</p>
                      <p className="text-sm text-gray-500 truncate">{trip.destination}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 sm:gap-4 text-sm shrink-0">
                    <span className="flex items-center gap-1 text-green-600">
                      <Heart className="h-4 w-4" />
                      {trip.likes || 0}
                    </span>
                    <span className="flex items-center gap-1 text-blue-600">
                      <Bookmark className="h-4 w-4" />
                      {trip.saves || 0}
                    </span>
                  </div>
                </div>
              ))}
              {(!reportData?.topContent?.trips || reportData.topContent.trips.length === 0) && (
                <p className="text-center text-gray-500 py-4">لا توجد رحلات في هذه الفترة</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle>أفضل الشركات أداءً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData?.topContent?.companies?.slice(0, 5).map((company: any, index: number) => (
                <div key={company._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                      {company.logo ? (
                        <img 
                          src={company.logo} 
                          alt={company.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = `<span class="text-purple-600 font-bold text-sm">${index + 1}</span>`;
                          }}
                        />
                      ) : (
                        <span className="text-purple-600 font-bold text-sm">{index + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{company.name}</p>
                      <p className="text-sm text-gray-500 truncate">{company.email}</p>
                    </div>
                  </div>
                  <div className="text-center bg-blue-50 px-4 py-2 rounded-full shrink-0">
                    <span className="text-xs text-gray-600 block">رحلات</span>
                    <span className="font-bold text-blue-600 text-lg">{company.tripsCount || 0}</span>
                  </div>
                </div>
              ))}
              {(!reportData?.topContent?.companies || reportData.topContent.companies.length === 0) && (
                <p className="text-center text-gray-500 py-4">لا توجد شركات</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>التفصيل اليومي</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">التاريخ</th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">مستخدمين</th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">رحلات</th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">تفاعلات</th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">تعليقات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData?.dailyBreakdown?.map((day: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">{day.dayName}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-center text-blue-600 font-medium">{day.users}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-center text-green-600 font-medium">{day.trips}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-center text-pink-600 font-medium">{day.reactions}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-center text-purple-600 font-medium">{day.comments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!reportData?.dailyBreakdown || reportData.dailyBreakdown.length === 0) && (
              <p className="text-center text-gray-500 py-8">لا توجد بيانات</p>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default ReportsPage;
