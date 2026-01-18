import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/services/adminService";
import { ArrowLeft, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import TripFormDialog from "@/components/admin/TripFormDialog";
import AdminHeader from "@/components/admin/AdminHeader";
import Footer from "@/components/Footer";

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

  useEffect(() => {
    // Check if user is admin
    const adminEmail = 'e79442457@gmail.com';
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

  const handleDelete = async (id: string) => {
    if (confirm('هل تريد حذف هذه الرحلة؟')) {
      try {
        const token = await getToken();
        await adminService.deleteTrip(id, token || undefined);
        fetchData();
        alert('تم حذف الرحلة');
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
              <h1 className="text-3xl font-bold text-gray-900">إدارة الرحلات</h1>
              <p className="text-gray-600">عرض وتعديل رحلات الشركات</p>
            </div>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleCreate}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة رحلة
          </Button>
        </div>

        {/* Trips List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : trips.length === 0 ? (
          <Card>
            <CardContent className="p-20 text-center text-gray-500">
              لا توجد رحلات
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card key={trip._id} className={!trip.isActive ? 'opacity-60' : ''}>
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    {trip.images && trip.images[0] ? (
                      <img src={trip.images[0]} alt={trip.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        لا توجد صورة
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 flex-1">{trip.title}</h3>
                      <Badge variant={trip.isActive ? 'default' : 'secondary'}>
                        {trip.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4 text-sm">
                      <p className="text-gray-600">
                        <strong>الوجهة:</strong> {trip.destination}
                      </p>
                      <p className="text-gray-600">
                        <strong>المدة:</strong> {trip.duration}
                      </p>
                      <p className="text-gray-600">
                        <strong>السعر:</strong> {trip.price}
                      </p>
                      <p className="text-gray-600">
                        <strong>التقييم:</strong> {trip.rating} ⭐
                      </p>
                      {trip.companyId && (
                        <p className="text-gray-600">
                          <strong>الشركة:</strong> {trip.companyId.name || 'غير محدد'}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleToggleActive(trip._id)}
                      >
                        {trip.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(trip)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDelete(trip._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <TripFormDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingTrip}
        companies={companies}
        onSuccess={fetchData}
      />

      <Footer />
    </div>
  );
};

export default TripsManagementPage;
