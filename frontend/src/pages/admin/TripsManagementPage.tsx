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
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  Building2,
  Image as ImageIcon,
  MoreVertical
} from "lucide-react";
import TripFormDialog from "@/components/admin/TripFormDialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TripsManagementPage = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [tripToDelete, setTripToDelete] = useState<any>(null);

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
      const [tripsData, companiesData] = await Promise.all([
        adminService.getAllTrips(token || undefined),
        adminService.getAllCompanies(token || undefined)
      ]);
      setTrips(tripsData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTrip(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (trip: any) => {
    setEditingTrip(trip);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (id: string) => {
    try {
      const token = await getToken();
      await adminService.toggleTripActive(id, token || undefined);
      fetchData();
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const handleDelete = async () => {
    if (!tripToDelete) return;

    try {
      setLoading(true);
      const token = await getToken();
      await adminService.deleteTrip(tripToDelete._id, token || undefined);
      setTripToDelete(null);
      fetchData();
    } catch (error) {
      alert('حدث خطأ أثناء الحذف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-10" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 font-cairo">إدارة <span className="text-indigo-600">الرحلات</span></h1>
              <p className="text-gray-500 font-bold text-sm">مراجعة الرحلات المضافة من قبل الشركات، تعديل الأسعار والتفاصيل.</p>
           </div>
           
           <Button 
             className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
             onClick={handleCreate}
           >
             <Plus className="h-5 w-5" />
             إضافة رحلة جديدة
           </Button>
        </div>

        {/* Trips List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1,2,3].map(i => <div key={i} className="h-96 bg-white rounded-[2.5rem] animate-pulse shadow-sm" />)}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-gray-200" />
             </div>
             <h3 className="text-xl font-black text-gray-900">لا توجد رحلات مسجلة</h3>
             <p className="text-gray-400 font-bold">ابدأ بإضافة أول رحلة سياحية للنظام.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {trips.map((trip, idx) => (
                <motion.div
                  key={trip._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                   <Card className={cn(
                      "border-0 shadow-xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden group transition-all duration-500 hover:shadow-indigo-500/10",
                      !trip.isActive && "opacity-60 saturate-[0.2]"
                   )}>
                      <CardContent className="p-0">
                         {/* Image Section */}
                         <div className="h-56 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                            {trip.images && trip.images[0] ? (
                               <img src={trip.images[0]} alt={trip.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                               <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                                  <ImageIcon className="w-12 h-12" />
                               </div>
                            )}
                            <div className="absolute bottom-5 right-5 z-20 flex flex-col">
                               <h4 className="text-white font-black text-lg leading-none mb-1 drop-shadow-md">{trip.title}</h4>
                               <div className="flex items-center gap-2 text-indigo-100 text-[10px] font-black uppercase tracking-widest drop-shadow-md">
                                  <MapPin className="w-3 h-3 text-emerald-400" />
                                  {trip.destination}
                               </div>
                            </div>
                            <Badge className={cn(
                               "absolute top-5 left-5 z-20 h-8 px-4 rounded-full border-0 font-black text-[10px] uppercase tracking-widest leading-none flex items-center justify-center",
                               trip.isActive ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
                            )}>
                               {trip.isActive ? "نشط" : "معطل"}
                            </Badge>
                         </div>

                         {/* Details Section */}
                         <div className="p-6">
                            <div className="grid grid-cols-2 gap-3 mb-6">
                               <div className="bg-gray-50 rounded-2xl p-3 flex flex-col items-center border border-gray-100/50">
                                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 mb-1" />
                                  <span className="text-sm font-black text-gray-900 leading-none">{trip.price}</span>
                                  <span className="text-[10px] font-bold text-gray-400">السعر</span>
                               </div>
                               <div className="bg-indigo-50/50 rounded-2xl p-3 flex flex-col items-center border border-indigo-100/20">
                                  <Clock className="w-3.5 h-3.5 text-indigo-600 mb-1" />
                                  <span className="text-sm font-black text-gray-900 leading-none">{trip.duration}</span>
                                  <span className="text-[10px] font-bold text-gray-400">المدة</span>
                               </div>
                            </div>

                            <div className="flex items-center justify-between px-2 mb-8">
                               <div className="flex items-center gap-3">
                                  {trip.companyId && (
                                    <>
                                       <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-black text-[10px]">
                                          {trip.companyId.logo ? <img src={trip.companyId.logo} className="w-full h-full object-cover rounded-lg" /> : <Building2 className="w-4 h-4" />}
                                       </div>
                                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{trip.companyId.name}</span>
                                    </>
                                  )}
                               </div>
                               <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 rounded-full">
                                  <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                                  <span className="text-xs font-black text-orange-600">{trip.rating}</span>
                               </div>
                            </div>

                            <div className="flex items-center gap-2">
                               <Button 
                                 size="sm" 
                                 className="flex-1 h-12 rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-100 border-0"
                                 onClick={() => handleToggleActive(trip._id)}
                               >
                                 {trip.isActive ? <ToggleRight className="h-5 w-5 text-indigo-600" /> : <ToggleLeft className="h-5 w-5" />}
                               </Button>
                               <Button 
                                 size="sm" 
                                 className="flex-1 h-12 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                                 onClick={() => handleEdit(trip)}
                               >
                                 <Edit className="h-4 w-4" />
                               </Button>
                               <Button 
                                 size="sm" 
                                 className="flex-1 h-12 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 border-0"
                                 onClick={() => setTripToDelete(trip)}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                            </div>
                         </div>
                      </CardContent>
                   </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <TripFormDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingTrip}
        companies={companies}
        onSuccess={fetchData}
      />

      {/* Trip Deletion Confirmation Modal */}
      <AlertDialog open={!!tripToDelete} onOpenChange={(open) => !open && setTripToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden max-w-md bg-white">
          <div className="bg-rose-500 h-2 w-full" />
          <div className="p-8">
            <AlertDialogHeader>
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-600 mb-6 mx-auto animate-bounce">
                <Trash2 className="w-10 h-10" />
              </div>
              <AlertDialogTitle className="text-2xl font-black text-gray-900 text-center font-cairo">
                حذف الرحلة نهائياً؟
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 font-bold text-center mt-2 leading-relaxed">
                أنت على وشك حذف رحلة <span className="text-gray-900">{tripToDelete?.title}</span>. 
                سيتم إزالة كافة تفاصيل الرحلة من قاعدة البيانات ولا يمكن استرجاعها.
                <br />
                <span className="text-rose-600 font-black mt-2 block italic text-xs">احذر: هذا الإجراء نهائي!</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-10 flex flex-col gap-3 sm:flex-row-reverse sm:gap-4">
              <Button 
                onClick={handleDelete}
                className="h-14 flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-xl shadow-rose-100 transition-all active:scale-95"
              >
                نعم، احذف الرحلة
              </Button>
              <AlertDialogCancel asChild>
                <Button 
                  variant="ghost"
                  className="h-14 flex-1 rounded-2xl bg-gray-50 text-gray-500 font-black hover:bg-gray-100 transition-all"
                >
                  إلغاء
                </Button>
              </AlertDialogCancel>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default TripsManagementPage;
