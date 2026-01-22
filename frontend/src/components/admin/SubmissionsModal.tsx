import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminService } from "@/services/adminService";
import { CheckCircle, XCircle, Trash2, Loader2, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SubmissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SubmissionsModal = ({ open, onOpenChange }: SubmissionsModalProps) => {
  const { getToken } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (open) {
      fetchSubmissions();
    }
  }, [open, filter]);

  const fetchSubmissions = async () => {
    setLoading(true);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-orange-600" />
            إدارة طلبات الانضمام
          </DialogTitle>
          <DialogDescription>
             مراجعة واعتماد طلبات تسجيل الشركات الجديدة
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="px-6 py-4 bg-gray-50 border-b flex gap-2 overflow-x-auto">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
            className="whitespace-nowrap"
          >
            الكل
          </Button>
          <Button 
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            size="sm"
            className="whitespace-nowrap"
          >
            قيد الانتظار
          </Button>
          <Button 
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
            size="sm"
            className="whitespace-nowrap"
          >
            موافق عليها
          </Button>
          <Button 
            variant={filter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setFilter('rejected')}
            size="sm"
            className="whitespace-nowrap"
          >
            مرفوضة
          </Button>
        </div>

        {/* List */}
        <ScrollArea className="flex-1 p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-4" />
              <p className="text-gray-500">جاري تحميل الطلبات...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                 <MessageSquare className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900">لا توجد طلبات</p>
              <p className="text-gray-500">لم يتم العثور على طلبات في هذه الفئة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission._id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                  <div className={`h-1.5 w-full ${
                    submission.status === 'approved' ? 'bg-green-500' :
                    submission.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">{submission.companyName}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                           <span>تم التقديم: {new Date(submission.createdAt).toLocaleDateString('ar-SA')}</span>
                        </p>
                      </div>
                      {getStatusBadge(submission.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">البريد الإلكتروني</p>
                        <p className="font-medium text-sm break-all">{submission.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">الهاتف</p>
                        <p className="font-medium text-sm" dir="ltr">{submission.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">واتساب</p>
                        <p className="font-medium text-sm" dir="ltr">{submission.whatsapp}</p>
                      </div>
                       <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">نوع الرحلات</p>
                        <p className="font-medium text-sm">{submission.tripTypes}</p>
                      </div>
                    </div>
                    
                    {submission.message && (
                      <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-2">رسالة الشركة:</p>
                        <div className="bg-white border rounded-md p-3 text-sm text-gray-600 leading-relaxed">
                          {submission.message}
                        </div>
                      </div>
                    )}

                    {submission.status === 'pending' && (
                      <div className="flex flex-wrap gap-3 pt-2 border-t mt-4">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(submission._id)}
                        >
                          <CheckCircle className="h-4 w-4 ml-2" />
                          موافقة وانشاء حساب
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReject(submission._id)}
                        >
                          <XCircle className="h-4 w-4 ml-2" />
                          رفض الطلب
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="mr-auto text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                          onClick={() => handleDelete(submission._id)}
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف نهائي
                        </Button>
                      </div>
                    )}

                    {submission.status === 'rejected' && submission.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                        <strong>سبب الرفض:</strong> {submission.rejectionReason}
                      </div>
                    )}
                     {submission.status !== 'pending' && (
                        <div className="flex justify-end pt-2 border-t mt-4">
                           <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-gray-400 hover:text-red-600"
                          onClick={() => handleDelete(submission._id)}
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف من القائمة
                        </Button>
                        </div>
                     )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
        <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionsModal;
