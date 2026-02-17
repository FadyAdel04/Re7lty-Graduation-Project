import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/adminService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Trash2,
  ShieldAlert,
  Search,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AdminContentModeration = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'resolved' | 'dismissed'>('pending');
  
  // Delete Dialog State
  const [deleteData, setDeleteData] = useState<{ reportId: string, tripId: string, tripTitle: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [user, statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await adminService.getContentReports(token || undefined, statusFilter);
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل البلاغات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (reportId: string) => {
    try {
       const token = await getToken();
       await adminService.updateReportStatus(reportId, 'dismissed', undefined, token || undefined);
       
       toast({
         title: "تم التجاهل",
         description: "تم تجاهل البلاغ بنجاح",
       });
       
       // Refresh list
       fetchReports();
    } catch (error) {
       console.error("Error dismissing report:", error);
       toast({
         title: "خطأ",
         description: "فشل تحديث حالة البلاغ",
         variant: "destructive",
       });
    }
  };

  const handleDeleteClick = (report: any) => {
     if (!report.tripId) return;
     setDeleteData({
        reportId: report._id,
        tripId: report.tripId._id,
        tripTitle: report.tripId.title
     });
  };

  const confirmDelete = async () => {
     if (!deleteData) return;
     
     setIsDeleting(true);
     try {
        const token = await getToken();
        // Call DELETE /api/trips/:id (which handles notification and report resolution)
        await adminService.deleteUserTrip(deleteData.tripId, token || undefined);
        
        toast({
           title: "تم الحذف",
           description: `تم حذف الرحلة "${deleteData.tripTitle}" وإشعار المستخدم.`,
        });
        
        setDeleteData(null);
        fetchReports();
     } catch (error: any) {
        console.error("Error deleting trip:", error);
        toast({
           title: "خطأ",
           description: error.message || "فشل حذف الرحلة",
           variant: "destructive",
        });
     } finally {
        setIsDeleting(false);
     }
  };

  return (
    <AdminLayout>
       <div className="max-w-7xl mx-auto space-y-8" dir="rtl">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div>
                <h1 className="text-3xl font-black text-gray-900 mb-2 font-cairo flex items-center gap-3">
                   <ShieldAlert className="w-8 h-8 text-rose-600" />
                   إدارة <span className="text-rose-600">المحتوى والبلاغات</span>
                </h1>
                <p className="text-gray-500 font-bold text-sm">مراجعة البلاغات واتخاذ الإجراءات اللازمة للحفاظ على جودة المنصة.</p>
             </div>
             
             <div className="flex gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                {(['pending', 'resolved', 'dismissed'] as const).map((s) => (
                   <button
                     key={s}
                     onClick={() => setStatusFilter(s)}
                     className={cn(
                       "px-4 py-2 rounded-xl text-xs font-black transition-all",
                       statusFilter === s 
                         ? s === 'pending' ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200" :
                           s === 'resolved' ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200" :
                           "bg-gray-100 text-gray-600"
                         : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                     )}
                   >
                      {s === 'pending' ? 'قيد الانتظار' : s === 'resolved' ? 'تم الحل' : 'تم التجاهل'}
                   </button>
                ))}
             </div>
          </div>

          {/* Reports Content */}
          <Card className="border-0 shadow-xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden min-h-[500px]">
             <CardContent className="p-0">
                {loading ? (
                   <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
                      <p className="text-gray-400 font-bold">جاري تحميل البلاغات...</p>
                   </div>
                ) : reports.length > 0 ? (
                   <div className="overflow-x-auto">
                      <table className="w-full text-right">
                         <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                               <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">الرحلة المُبلغ عنها</th>
                               <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">سبب البلاغ</th>
                               <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">التفاصيل</th>
                               <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">تاريخ البلاغ</th>
                               <th className="px-8 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-wider">الإجراءات</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                            {reports.map((report) => (
                               <tr key={report._id} className="group hover:bg-gray-50/30 transition-colors">
                                  <td className="px-8 py-6">
                                     {report.tripId ? (
                                        <div className="flex items-center gap-4">
                                           <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                              <img 
                                                src={
                                                  report.tripId.images?.[0] || 
                                                  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=100&h=100'
                                                } 
                                                className="w-full h-full object-cover" 
                                                alt=""
                                              />
                                           </div>
                                           <div className="min-w-0">
                                              <Link to={`/trips/${report.tripId._id}`} target="_blank" className="font-bold text-gray-900 hover:text-indigo-600 block truncate mb-0.5 flex items-center gap-2">
                                                 {report.tripId.title}
                                                 <ExternalLink className="w-3 h-3 opacity-50" />
                                              </Link>
                                              <p className="text-xs text-gray-400 font-bold">{report.tripId.destination}</p>
                                           </div>
                                        </div>
                                     ) : (
                                        <span className="text-gray-400 italic font-bold">Trip Deleted</span>
                                     )}
                                  </td>
                                  <td className="px-6 py-6">
                                     <span className={cn(
                                        "px-3 py-1 rounded-lg text-xs font-black block w-fit",
                                        report.reason === 'spam' ? "bg-orange-50 text-orange-600" :
                                        report.reason === 'inappropriate' ? "bg-red-50 text-red-600" :
                                        "bg-blue-50 text-blue-600"
                                     )}>
                                        {report.reason === 'spam' ? 'إزعاج / احتيال' :
                                         report.reason === 'inappropriate' ? 'محتوى غير لائق' :
                                         report.reason === 'misleading' ? 'معلومات مضللة' : 'أخرى'}
                                     </span>
                                  </td>
                                  <td className="px-6 py-6">
                                     <p className="text-sm text-gray-600 max-w-[250px] line-clamp-2" title={report.description}>
                                        {report.description || "لا يوجد وصف"}
                                     </p>
                                  </td>
                                  <td className="px-6 py-6">
                                     <span className="text-xs font-bold text-gray-400">
                                        {new Date(report.createdAt).toLocaleDateString('ar-EG')}
                                     </span>
                                  </td>
                                  <td className="px-8 py-6">
                                     {statusFilter === 'pending' ? (
                                        <div className="flex items-center justify-center gap-2">
                                           <Button 
                                             size="sm" 
                                             onClick={() => handleDeleteClick(report)}
                                             className="bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 shadow-sm"
                                           >
                                              <Trash2 className="w-4 h-4 ml-2" />
                                              حذف الرحلة
                                           </Button>
                                           <Button 
                                             size="sm" 
                                             variant="ghost"
                                             onClick={() => handleDismiss(report._id)}
                                             className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                           >
                                              <XCircle className="w-4 h-4 ml-2" />
                                              تجاهل
                                           </Button>
                                        </div>
                                     ) : (
                                        <div className="flex justify-center">
                                           {report.status === 'resolved' ? (
                                              <span className="flex items-center gap-1 text-emerald-600 font-black text-xs bg-emerald-50 px-3 py-1 rounded-lg">
                                                 <CheckCircle className="w-3 h-3" /> تم الحل
                                              </span>
                                           ) : (
                                              <span className="flex items-center gap-1 text-gray-400 font-black text-xs bg-gray-50 px-3 py-1 rounded-lg">
                                                 <XCircle className="w-3 h-3" /> تم التجاهل
                                              </span>
                                           )}
                                        </div>
                                     )}
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                ) : (
                   <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                         <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-1">لا توجد بلاغات {statusFilter === 'pending' ? 'جديدة' : ''}</h3>
                      <p className="text-gray-400">جميع الأمور تجري على ما يرام!</p>
                   </div>
                )}
             </CardContent>
          </Card>

          {/* Delete Dialog */}
          <Dialog open={!!deleteData} onOpenChange={(open) => !open && setDeleteData(null)}>
             <DialogContent className="font-cairo text-right" dir="rtl">
                <DialogHeader>
                   <DialogTitle className="text-xl font-black text-rose-600 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      تأكيد حذف الرحلة
                   </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                   <p className="text-gray-600 font-bold mb-2">هل أنت متأكد من رغبتك في حذف هذه الرحلة؟</p>
                   <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-sm text-rose-800 font-medium">
                      سيتم حذف الرحلة "{deleteData?.tripTitle}" نهائياً من المنصة، وسيتم إشعار صاحب الرحلة بذلك. كما سيتم إغلاق البلاغ تلقائياً.
                   </div>
                </div>
                <DialogFooter className="gap-2 sm:justify-start">
                   <Button 
                     variant="destructive" 
                     onClick={confirmDelete} 
                     disabled={isDeleting}
                     className="bg-rose-600 hover:bg-rose-700 font-bold"
                   >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Trash2 className="w-4 h-4 ml-2" />}
                      حذف نهائي
                   </Button>
                   <Button 
                     variant="outline" 
                     onClick={() => setDeleteData(null)} 
                     disabled={isDeleting}
                     className="font-bold"
                   >
                      إلغاء
                   </Button>
                </DialogFooter>
             </DialogContent>
          </Dialog>

       </div>
    </AdminLayout>
  );
};

export default AdminContentModeration;
