import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/services/adminService";
import { ArrowLeft, CheckCircle, XCircle, Eye, Trash2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import Footer from "@/components/Footer";

const SubmissionsPage = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Check if user is admin
    const adminEmail = 'e79442457@gmail.com';
    const isAdmin = user?.emailAddresses?.some(email => email.emailAddress === adminEmail);
    
    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchSubmissions();
  }, [user, navigate, filter]);

  const fetchSubmissions = async () => {
    try {
      const token = await getToken();
      const data = await adminService.getSubmissions(token || undefined, filter === 'all' ? undefined : filter);
      setSubmissions(data.submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (confirm('هل تريد الموافقة على هذا الطلب؟')) {
      try {
        const token = await getToken();
        await adminService.approveSubmission(id, token || undefined);
        fetchSubmissions();
        alert('تمت الموافقة على الطلب بنجاح');
      } catch (error) {
        alert('حدث خطأ أثناء الموافقة');
      }
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('سبب الرفض:');
    if (reason) {
      try {
        const token = await getToken();
        await adminService.rejectSubmission(id, reason, token || undefined);
        fetchSubmissions();
        alert('تم رفض الطلب');
      } catch (error) {
        alert('حدث خطأ أثناء الرفض');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل تريد حذف هذا الطلب؟')) {
      try {
        const token = await getToken();
        await adminService.deleteSubmission(id, token || undefined);
        fetchSubmissions();
        alert('تم حذف الطلب');
      } catch (error) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    const labels = {
      pending: 'قيد الانتظار',
      approved: 'موافق عليه',
      rejected: 'مرفوض'
    };
    return <Badge className={styles[status as keyof typeof styles]}>{labels[status as keyof typeof labels]}</Badge>;
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
              <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
              <p className="text-gray-600">مراجعة طلبات تسجيل الشركات</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            الكل
          </Button>
          <Button 
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            قيد الانتظار
          </Button>
          <Button 
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
          >
            موافق عليها
          </Button>
          <Button 
            variant={filter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setFilter('rejected')}
          >
            مرفوضة
          </Button>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="p-20 text-center text-gray-500">
              لا توجد طلبات
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => (
              <Card key={submission._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{submission.companyName}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(submission.createdAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                      <p className="font-medium">{submission.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">الهاتف</p>
                      <p className="font-medium">{submission.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">واتساب</p>
                      <p className="font-medium">{submission.whatsapp}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">نوع الرحلات</p>
                      <p className="font-medium">{submission.tripTypes}</p>
                    </div>
                  </div>
                  
                  {submission.message && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">الرسالة</p>
                      <p className="text-gray-800">{submission.message}</p>
                    </div>
                  )}

                  {submission.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(submission._id)}
                      >
                        <CheckCircle className="h-4 w-4 ml-2" />
                        موافقة
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleReject(submission._id)}
                      >
                        <XCircle className="h-4 w-4 ml-2" />
                        رفض
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDelete(submission._id)}
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف
                      </Button>
                    </div>
                  )}

                  {submission.status === 'rejected' && submission.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>سبب الرفض:</strong> {submission.rejectionReason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SubmissionsPage;
