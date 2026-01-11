import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/services/adminService";
import { ArrowLeft, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import CompanyFormDialog from "@/components/admin/CompanyFormDialog";
import AdminHeader from "@/components/admin/AdminHeader";
import Footer from "@/components/Footer";

const CompaniesManagementPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);

  useEffect(() => {
    // Check if user is admin
    const adminEmail = 'e79442457@gmail.com';
    const isAdmin = user?.emailAddresses?.some(email => email.emailAddress === adminEmail);
    
    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchCompanies();
  }, [user, navigate]);

  const fetchCompanies = async () => {
    try {
      const data = await adminService.getAllCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
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
      await adminService.toggleCompanyActive(id);
      fetchCompanies();
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل تريد حذف هذه الشركة؟ سيتم إلغاء تفعيل جميع رحلاتها.')) {
      try {
        await adminService.deleteCompany(id);
        fetchCompanies();
        alert('تم حذف الشركة');
      } catch (error) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">إدارة الشركات</h1>
              <p className="text-gray-600">عرض وتعديل الشركات السياحية</p>
            </div>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleCreate}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة شركة
          </Button>
        </div>

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
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
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

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{company.name}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{company.description}</p>

                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-gray-600">
                      <strong>التقييم:</strong> {company.rating} ⭐
                    </p>
                    <p className="text-gray-600">
                      <strong>عدد الرحلات:</strong> {company.tripsCount}
                    </p>
                    <p className="text-gray-600">
                      <strong>الهاتف:</strong> {company.contactInfo.phone}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleToggleActive(company._id)}
                    >
                      {company.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEdit(company)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDelete(company._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <CompanyFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        initialData={editingCompany}
        onSuccess={fetchCompanies}
      />
      <Footer />
    </div>
  );
};

export default CompaniesManagementPage;
