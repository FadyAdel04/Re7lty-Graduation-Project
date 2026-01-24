import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/services/adminService";
import { 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Building2, 
  Layers, 
  Star, 
  Phone, 
  MoreVertical,
  ArrowUpRight,
  ClipboardList
} from "lucide-react";
import CompanyFormDialog from "@/components/admin/CompanyFormDialog";
import AdminLayout from "@/components/admin/AdminLayout";
import SubmissionsModal from "@/components/admin/SubmissionsModal";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
      } catch (error) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-10" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 font-cairo">إدارة <span className="text-indigo-600">الشركات</span></h1>
              <p className="text-gray-500 font-bold text-sm">إدارة الشركاء السياحيين، مراجعة الطلبات، وتعديل البيانات.</p>
           </div>
           
           <div className="flex gap-3">
              <Button 
                variant="ghost" 
                className="h-14 px-6 rounded-2xl bg-white border border-gray-100 font-black text-sm text-gray-600 hover:bg-gray-50 transition-all shadow-sm group"
                onClick={() => setIsSubmissionsOpen(true)}
              >
                <div className="relative ml-2">
                   <ClipboardList className="w-5 h-5 text-indigo-500 group-hover:rotate-12 transition-transform" />
                   {recentSubmissions.filter(s => s.status === 'pending').length > 0 && (
                     <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                   )}
                </div>
                مراجعة الطلبات
              </Button>
              <Button 
                className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                onClick={handleCreate}
              >
                <Plus className="h-5 w-5" />
                إضافة شركة
              </Button>
           </div>
        </div>

        {/* 1. Recent Activity Banner */}
        <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
           <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex-1">
                 <h3 className="text-xl font-black mb-2 leading-none">طلبات الانضمام الأخيرة</h3>
                 <p className="text-indigo-100/60 font-medium text-sm">لديك {recentSubmissions.filter(s => s.status === 'pending').length} طلبات جديدة بانتظار المراجعة.</p>
              </div>
              <div className="flex -space-x-4 space-x-reverse">
                 {recentSubmissions.map((s, i) => (
                    <div key={i} className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-xs">
                       {s.companyName[0]}
                    </div>
                 ))}
                 <button 
                  onClick={() => setIsSubmissionsOpen(true)}
                  className="w-12 h-12 rounded-2xl bg-indigo-600 border border-white/20 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                 >
                    <ArrowUpRight className="w-5 h-5" />
                 </button>
              </div>
           </div>
        </div>

        {/* 2. Companies Grid */}
        <div className="space-y-6">
           <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-widest px-2">الشركاء المسجلين</h3>
           
           {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1,2,3].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse" />)}
             </div>
           ) : companies.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm">
                <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-900">لا توجد شركات مسجلة حالياً</h3>
                <p className="text-gray-400 font-bold">ابدأ بإضافة أول شريك سياحي للمنصة.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                  {companies.map((company, idx) => (
                    <motion.div
                      key={company._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                       <Card className={cn(
                          "border-0 shadow-xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden group transition-all duration-500 hover:shadow-indigo-500/10",
                          !company.isActive && "opacity-60 saturate-[0.2]"
                       )}>
                          <CardContent className="p-8">
                             <div className="flex items-start justify-between mb-6">
                                <div className={cn(
                                   "w-20 h-20 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-lg overflow-hidden group-hover:scale-110 transition-transform duration-700",
                                   `bg-gradient-to-br ${company.color}`
                                )}>
                                   {company.logo.startsWith('http') ? (
                                      <img src={company.logo} className="w-full h-full object-cover" />
                                   ) : company.logo}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                   <Badge className={cn(
                                      "px-3 py-1 rounded-full border-0 font-black text-[10px] uppercase tracking-widest",
                                      company.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                                   )}>
                                      {company.isActive ? "نشط" : "معطل"}
                                   </Badge>
                                </div>
                             </div>

                             <h4 className="text-xl font-black text-gray-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{company.name}</h4>
                             <p className="text-xs font-bold text-gray-400 line-clamp-2 mb-6 h-8">{company.description}</p>

                             <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-gray-50/50 rounded-2xl p-3 flex flex-col items-center">
                                   <Star className="w-4 h-4 text-orange-500 fill-orange-500 mb-1" />
                                   <span className="text-sm font-black text-gray-900 leading-none">{company.rating}</span>
                                   <span className="text-[10px] font-bold text-gray-400">التقييم</span>
                                </div>
                                <div className="bg-indigo-50/50 rounded-2xl p-3 flex flex-col items-center">
                                   <Layers className="w-4 h-4 text-indigo-600 mb-1" />
                                   <span className="text-sm font-black text-gray-900 leading-none">{company.tripsCount}</span>
                                   <span className="text-[10px] font-bold text-gray-400">رحلة</span>
                                </div>
                             </div>

                             <div className="flex items-center gap-3">
                                <Button 
                                  size="sm" 
                                  className="flex-1 h-11 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 border-0"
                                  onClick={() => handleToggleActive(company._id)}
                                >
                                  {company.isActive ? <ToggleRight className="h-5 w-5 text-indigo-600" /> : <ToggleLeft className="h-5 w-5" />}
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="flex-1 h-11 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100"
                                  onClick={() => handleEdit(company)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="flex-1 h-11 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border-0"
                                  onClick={() => handleDelete(company._id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                          </CardContent>
                       </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>
           )}
        </div>

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
            if (!open) fetchData();
          }}
        />
      </div>
    </AdminLayout>
  );
};

export default CompaniesManagementPage;
