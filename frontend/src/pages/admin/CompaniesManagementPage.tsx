import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/services/adminService";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import CompanyFormDialog from "@/components/admin/CompanyFormDialog";
import AdminLayout from "@/components/admin/AdminLayout";
import SubmissionsModal from "@/components/admin/SubmissionsModal";

const CompaniesManagementPage = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);

  useEffect(() => {
    // Check if user is admin
    const adminEmail = 'supermincraft52@gmail.com';
    const isAdmin = user?.emailAddresses?.some(email => email.emailAddress === adminEmail);
    
    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const [companiesData, submissionsData] = await Promise.all([
        adminService.getAllCompanies(token || undefined),
        adminService.getSubmissions(token || undefined, 'all')
      ]);
      setCompanies(companiesData);
      setRecentSubmissions(submissionsData.submissions.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCompany(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (company: any) => {
    setEditingCompany(company);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (id: string) => {
    try {
      const token = await getToken();
      await adminService.toggleCompanyActive(id, token || undefined);
      fetchData();
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل تريد حذف هذه الشركة؟ سيتم إلغاء تفعيل جميع رحلاتها.')) {
      try {
        const token = await getToken();
        await adminService.deleteCompany(id, token || undefined);
        fetchData();
        alert('تم حذف الشركة');
      } catch (error) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">إدارة الشركات</h1>
          <p className="text-gray-600">عرض وتعديل الشركات السياحية</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 md:flex-none"
            onClick={() => setIsSubmissionsOpen(true)}
          >
            <span className="relative">
              إدارة الطلبات
              {recentSubmissions.filter(s => s.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-2 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </span>
          </Button>
          <Button 
            className="bg-orange-600 hover:bg-orange-700 flex-1 md:flex-none" 
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة شركة
          </Button>
        </div>
      </div>

      {/* Recent Submissions Section */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>أحدث الطلبات</CardTitle>
          <Button variant="link" size="sm" onClick={() => setIsSubmissionsOpen(true)}>
             عرض الكل
          </Button>
        </CardHeader>
        <CardContent>
          {recentSubmissions.length === 0 ? (
            <p className="text-center text-gray-500 py-4">لا توجد طلبات حديثة</p>
          ) : (
            <div className="space-y-4">
              {recentSubmissions.map((submission: any) => (
                <div key={submission._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900">{submission.companyName}</h4>
                    <p className="text-sm text-gray-500">{submission.email}</p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      submission.status === 'approved' ? 'bg-green-100 text-green-700' :
                      submission.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {submission.status === 'approved' ? 'موافق عليه' :
                       submission.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setIsSubmissionsOpen(true)}>
                      تفاصيل
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Companies List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="p-20 text-center text-gray-500">
            لا توجد شركات
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card key={company._id} className={!company.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0 overflow-hidden`}>
                    {company.logo.startsWith('http') ? (
                       <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                     ) : (
                       company.logo
                     )}
                  </div>
                  <Badge variant={company.isActive ? 'default' : 'secondary'}>
                    {company.isActive ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate" title={company.name}>{company.name}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{company.description}</p>

                <div className="space-y-2 mb-4 text-sm">
                  <p className="text-gray-600 flex justify-between">
                    <strong>التقييم:</strong> <span>{company.rating} ⭐</span>
                  </p>
                  <p className="text-gray-600 flex justify-between">
                    <strong>عدد الرحلات:</strong> <span>{company.tripsCount}</span>
                  </p>
                  <p className="text-gray-600 flex justify-between">
                    <strong>الهاتف:</strong> <span className="truncate ml-2" dir="ltr">{company.contactInfo.phone}</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleToggleActive(company._id)}
                    title={company.isActive ? 'تعطيل' : 'تفعيل'}
                  >
                    {company.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(company)}
                    title="تعديل"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(company._id)}
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CompanyFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        initialData={editingCompany}
        onSuccess={fetchData}
      />

      <SubmissionsModal 
        open={isSubmissionsOpen}
        onOpenChange={(open) => {
          setIsSubmissionsOpen(open);
          if (!open) fetchData(); // Refresh recent list when closed
        }}
      />
    </AdminLayout>
  );
};

export default CompaniesManagementPage;
