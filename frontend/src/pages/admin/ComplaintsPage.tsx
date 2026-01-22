import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  MessageSquare, 
  Flag, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Mail,
  Trash2,
  ExternalLink
} from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { complaintsService } from "@/services/complaintsService";
import { contentReportsService } from "@/services/contentReportsService";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";

// Types
interface Complaint {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
}

interface ContentReport {
  _id: string;
  tripId: {
    _id: string;
    title: string;
    destination: string;
    author: string;
  };
  reportedBy: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
}

const ComplaintsPage = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("complaints");
  
  // State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check admin access
  useEffect(() => {
    const adminEmail = 'supermincraft52@gmail.com';
    const isAdmin = user?.emailAddresses?.some(email => email.emailAddress === adminEmail);
    
    if (user && !isAdmin) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      if (activeTab === "complaints") {
        const data = await complaintsService.getComplaints(token);
        setComplaints(data);
      } else {
        const data = await contentReportsService.getReports(token);
        setReports(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [activeTab, user]);

  // Actions
  const handleUpdateStatus = async (
    id: string, 
    type: 'complaint' | 'report', 
    status: 'resolved' | 'dismissed' | 'pending'
  ) => {
    setActionLoading(id);
    try {
      const token = await getToken();
      if (!token) return;

      if (type === 'complaint') {
        await complaintsService.updateComplaint(id, { status }, token);
        setComplaints(prev => prev.map(c => c._id === id ? { ...c, status } : c));
      } else {
        await contentReportsService.updateReport(id, { status }, token);
        setReports(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      }

      toast({
        title: "تم التحديث",
        description: "تم تحديث الحالة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحديث الحالة",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, type: 'complaint' | 'report') => {
    if (!confirm("هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.")) return;

    setActionLoading(id);
    try {
      const token = await getToken();
      if (!token) return;

      if (type === 'complaint') {
        await complaintsService.deleteComplaint(id, token);
        setComplaints(prev => prev.filter(c => c._id !== id));
      } else {
        await contentReportsService.deleteReport(id, token);
        setReports(prev => prev.filter(r => r._id !== id));
      }

      toast({
        title: "تم الحذف",
        description: "تم الحذف بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل الحذف",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Render Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-500 hover:bg-green-600">تم الحل</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">تم التجاهل</Badge>;
      default:
        return <Badge variant="destructive">قيد الانتظار</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">مركز الدعم والإبلاغات</h1>
            <p className="text-muted-foreground mt-1">إدارة رسائل التواصل وبلاغات المحتوى</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="complaints" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              رسائل التواصل
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              بلاغات المحتوى
            </TabsTrigger>
          </TabsList>

          <TabsContent value="complaints" className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : complaints.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mb-4 opacity-20" />
                  <p>لا توجد رسائل حالياً</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {complaints.map((complaint) => (
                  <Card key={complaint._id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(complaint.status)}
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(complaint.createdAt)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(complaint._id, 'complaint')}
                            disabled={actionLoading === complaint._id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-xl mt-2">{complaint.subject || 'بدون عنوان'}</CardTitle>
                      <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-semibold text-foreground">{complaint.name}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{complaint.email}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="bg-muted/20 p-4 rounded-md mb-4 whitespace-pre-wrap text-sm leading-relaxed">
                        {complaint.message}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 justify-end border-t pt-4">
                        {complaint.status !== 'resolved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            onClick={() => handleUpdateStatus(complaint._id, 'complaint', 'resolved')}
                            disabled={actionLoading === complaint._id}
                          >
                            <CheckCircle2 className="h-4 w-4 ml-2" />
                            تحديد كمحلول
                          </Button>
                        )}
                        {complaint.status !== 'dismissed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 hover:text-gray-700"
                            onClick={() => handleUpdateStatus(complaint._id, 'complaint', 'dismissed')}
                            disabled={actionLoading === complaint._id}
                          >
                            <XCircle className="h-4 w-4 ml-2" />
                            تجاهل
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <Flag className="h-12 w-12 mb-4 opacity-20" />
                  <p>لا توجد بلاغات حالياً</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {reports.map((report) => (
                  <Card key={report._id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(report.status)}
                          <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                            {report.reason === 'spam' ? 'احتيال/Spam' : 
                             report.reason === 'inappropriate' ? 'غير لائق' : 
                             report.reason === 'misleading' ? 'مضلل' : 'أخرى'}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(report.createdAt)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(report._id, 'report')}
                            disabled={actionLoading === report._id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-2 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        بلاغ عن رحلة: {report.tripId ? report.tripId.title : 'رحلة محذوفة'}
                      </CardTitle>
                      {report.tripId && (
                        <CardDescription>
                          <Link to={`/trips/${report.tripId._id}`} className="flex items-center gap-1 text-primary hover:underline w-fit">
                            عرض الرحلة <ExternalLink className="h-3 w-3" />
                          </Link>
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-4">
                      {report.description && (
                        <div className="bg-muted/20 p-4 rounded-md mb-4 text-sm">
                          <span className="font-semibold block mb-1">تفاصيل البلاغ:</span>
                          {report.description}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 justify-end border-t pt-4">
                         {report.status !== 'resolved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            onClick={() => handleUpdateStatus(report._id, 'report', 'resolved')}
                            disabled={actionLoading === report._id}
                          >
                            <CheckCircle2 className="h-4 w-4 ml-2" />
                            تحديد كمحلول
                          </Button>
                        )}
                        {report.status !== 'dismissed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 hover:text-gray-700"
                            onClick={() => handleUpdateStatus(report._id, 'report', 'dismissed')}
                            disabled={actionLoading === report._id}
                          >
                            <XCircle className="h-4 w-4 ml-2" />
                            تجاهل
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ComplaintsPage;
