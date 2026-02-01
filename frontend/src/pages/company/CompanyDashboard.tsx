import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth, useClerk } from "@clerk/clerk-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Activity, Users, Map, Plus, DollarSign, Calendar, LogOut, AlertTriangle, Loader2, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { corporateTripsService } from "@/services/corporateTripsService";
import { bookingService, Booking } from "@/services/bookingService";
import CompanyTripFormDialog from "@/components/company/CompanyTripFormDialog";
import TripCardEnhanced from "@/components/TripCardEnhanced";
import BookingManagementTable from "@/components/company/BookingManagementTable";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { companyService } from "@/services/companyService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const GRADIENT_PRESETS = [
  "from-orange-500 to-red-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-purple-500 to-pink-500",
  "from-yellow-500 to-orange-500",
  "from-gray-700 to-gray-900"
];

const CompanyDashboard = () => {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    // UI State
    const [isSwitchingRole, setIsSwitchingRole] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [acceptedWarning, setAcceptedWarning] = useState(false);

    // Settings State
    const [companyLoading, setCompanyLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsData, setSettingsData] = useState({
        name: "",
        description: "",
        logo: "",
        color: GRADIENT_PRESETS[0],
        tags: "",
        contactInfo: {
            phone: "",
            whatsapp: "",
            email: "",
            website: "",
            address: ""
        }
    });
    
    // Trips State
    const [myTrips, setMyTrips] = useState<any[]>([]);
    const [tripsLoading, setTripsLoading] = useState(true);
    const [openTripDialog, setOpenTripDialog] = useState(false);

    // Bookings State
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [selectedTripForEdit, setSelectedTripForEdit] = useState<any>(null);

    // Fetch Company Data & Trips
    useEffect(() => {
        if (isLoaded && !user) {
            navigate('/auth');
            return;
        }
        
        if (isLoaded && user) {
            const role = user.publicMetadata?.role as string;
            
            if (role === 'company_owner') {
                const fetchAllData = async () => {
                    try {
                        const token = await getToken();
                        
                        // Fetch Company Profile
                        const company = await companyService.getMyCompany(token || undefined);
                        if (company) {
                            setSettingsData({
                                name: company.name || "",
                                description: company.description || "",
                                logo: company.logo || "",
                                color: company.color || GRADIENT_PRESETS[0],
                                tags: company.tags ? company.tags.join(", ") : "",
                                contactInfo: {
                                    phone: company.contactInfo?.phone || "",
                                    whatsapp: company.contactInfo?.whatsapp || "",
                                    email: company.contactInfo?.email || "",
                                    website: company.contactInfo?.website || "",
                                    address: company.contactInfo?.address || ""
                                }
                            });
                            
                            // Fetch Company Trips using the company ID
                            if (company._id) {
                                const trips = await corporateTripsService.getTripsByCompany(company._id);
                                setMyTrips(trips);
                                
                                // Fetch Company Bookings
                                const companyBookings = await bookingService.getCompanyBookings(token || undefined);
                                setBookings(companyBookings);
                                
                                // Fetch Analytics
                                const analyticsData = await bookingService.getAnalytics(token || undefined);
                                setStats(analyticsData);
                            }
                        }
                    } catch (error) {
                        console.error("Failed to fetch dashboard data", error);
                    } finally {
                        setCompanyLoading(false);
                        setTripsLoading(false);
                        setBookingsLoading(false);
                    }
                };
                fetchAllData();
            } else {
                setCompanyLoading(false);
            }
        }
    }, [isLoaded, user, navigate, getToken]);

    const handleCreateTrip = () => {
        setSelectedTripForEdit(null);
        setOpenTripDialog(true);
    };

    const handleEditTrip = (trip: any) => {
        setSelectedTripForEdit(trip);
        setOpenTripDialog(true);
    };

    const handleFormSuccess = async () => {
       // Refresh trips
       try {
           const token = await getToken();
           const company = await companyService.getMyCompany(token || undefined);
           if (company && company._id) {
               const trips = await corporateTripsService.getTripsByCompany(company._id);
               setMyTrips(trips);
           }
       } catch (error) {
           console.error("Error refreshing trips", error);
       }
       setSelectedTripForEdit(null);
    };

    const fetchAnalytics = async () => {
        try {
            const token = await getToken();
            const data = await bookingService.getAnalytics(token || undefined);
            setStats(data);
        } catch (error) {
            console.error("Error fetching analytics", error);
        }
    };

    const handleRefreshBookings = async () => {
        try {
            const token = await getToken();
            const companyBookings = await bookingService.getCompanyBookings(token || undefined);
            setBookings(companyBookings);
            fetchAnalytics();
        } catch (error) {
            console.error("Error refreshing bookings", error);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const handleSwitchProfile = async () => {
        if (!acceptedWarning) return;
        
        setShowConfirmDialog(false);
        setIsSwitchingRole(true);
        try {
            const token = await getToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/me/switch-role`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ targetRole: 'user' })
            });

            const data = await response.json();

            if (!response.ok) {
                 if (response.status === 429) {
                      throw new Error(data.error || `لا يمكن التحويل الآن. متبقى ${data.daysRemaining} يوم.`);
                 }
                 throw new Error(data.error || 'فشل التحويل');
            }

            toast({
                title: "تم التحويل بنجاح",
                description: "أنت الآن تستخدم حساب المستخدم.",
            });
            
            setTimeout(() => window.location.href = `/user/${user?.id}`, 1000);

        } catch (error: any) {
            console.error("Switch role error:", error);
            toast({
                title: "تعذر التحويل",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSwitchingRole(false);
            setAcceptedWarning(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            const token = await getToken();
            const processedData = {
                ...settingsData,
                tags: settingsData.tags.split(",").map(tag => tag.trim()).filter(Boolean)
            };
            
            await companyService.updateMyCompany(processedData, token || undefined);
            
            toast({
                title: "تم الحفظ بنجاح",
                description: "تم تحديث بيانات الشركة بنجاح",
            });
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({
                title: "خطأ في الحفظ",
                description: "حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى",
                variant: "destructive"
            });
        } finally {
            setSavingSettings(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-cairo" dir="rtl">
            <Header />
            
            <CompanyTripFormDialog 
                open={openTripDialog} 
                onOpenChange={(open) => {
                    setOpenTripDialog(open);
                    if (!open) setSelectedTripForEdit(null);
                }} 
                onSuccess={handleFormSuccess}
                initialData={selectedTripForEdit}
            />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">لوحة تحكم الشركة</h1>
                        <p className="text-gray-500">مرحباً بك، {user?.fullName}. أدِر رحلاتك وحجوزاتك من هنا.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={handleSignOut}
                            variant="outline" 
                            className="h-12 border-red-100 text-red-600 hover:bg-red-50 font-bold gap-2 rounded-xl"
                        >
                            <LogOut className="w-5 h-5" />
                            تسجيل خروج
                        </Button>
                        <Button 
                            onClick={() => setShowConfirmDialog(true)} 
                            disabled={isSwitchingRole}
                            variant="outline" 
                            className="h-12 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold gap-2 rounded-xl"
                        >
                            <Users className="w-5 h-5" />
                            التحويل لحساب مسافر
                        </Button>
                        <Button onClick={handleCreateTrip} className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-12 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-200">
                            <Plus className="w-5 h-5" />
                            إضافة رحلة جديدة
                        </Button>
                    </div>
                </div>

                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                  <AlertDialogContent className="font-cairo rounded-[2rem]">
                    <AlertDialogHeader className="text-right">
                      <AlertDialogTitle className="text-xl font-black flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="h-6 w-6" />
                        تنبيه هام جداً
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-right space-y-4 pt-4 text-gray-600 text-base">
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                            <p className="font-bold text-gray-900 mb-2">هل أنت متأكد من التحويل إلى حساب "مسافر"؟</p>
                            <p className="text-sm">بمجرد التحويل، لن تتمكن من العودة واستخدام حساب الشركة مرة أخرى إلا بعد مرور <span className="font-black text-red-600">14 يوماً</span>.</p>
                        </div>
                        <p>خلال هذه الفترة، ستتوقف لوحة تحكم شركتك ولن تتمكن من إدارة أي رحلات أو حجوزات.</p>
                        
                        <div className="flex items-center gap-3 pt-2">
                             <input 
                                type="checkbox" 
                                id="accept-warning" 
                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                checked={acceptedWarning}
                                onChange={(e) => setAcceptedWarning(e.target.checked)}
                             />
                             <label htmlFor="accept-warning" className="text-sm font-bold text-gray-900 cursor-pointer select-none">
                                قرأت التنبيه وأوافق على فترة الانتظار (14 يوم)
                             </label>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                      <AlertDialogCancel className="rounded-xl h-11">إلغاء</AlertDialogCancel>
                      <AlertDialogAction 
                         onClick={(e) => {
                             e.preventDefault();
                             handleSwitchProfile();
                         }} 
                         disabled={!acceptedWarning}
                         className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 font-bold"
                      >
                        تأكيد التحويل
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="rounded-[2rem] border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
                                <Map className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-gray-500 font-bold text-sm">الرحلات النشطة</p>
                                <h3 className="text-3xl font-black text-gray-900 mt-1">{myTrips.length}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-[2rem] border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                                <Users className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-gray-500 font-bold text-sm">إجمالي الحجوزات</p>
                                <h3 className="text-3xl font-black text-gray-900 mt-1">{bookings.length}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-[2rem] border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-orange-50 text-orange-600">
                                <Activity className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-gray-500 font-bold text-sm">المشاهدات</p>
                                <h3 className="text-3xl font-black text-gray-900 mt-1">
                                    {myTrips.reduce((acc, curr) => acc + (curr.views || 0), 0)}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-[2rem] border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-purple-50 text-purple-600">
                                <DollarSign className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-gray-500 font-bold text-sm">الإيرادات</p>
                                <h3 className="text-3xl font-black text-gray-900 mt-1">
                                    {bookings
                                        .filter(b => b.status === 'accepted')
                                        .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0)
                                        .toLocaleString()} ج.م
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card className="rounded-[2.5rem] border-0 shadow-lg overflow-hidden min-h-[500px]">
                    <Tabs defaultValue="trips" className="w-full">
                        <div className="border-b border-gray-100 p-6">
                            <TabsList className="bg-gray-100/50 p-1 rounded-xl">
                                <TabsTrigger value="trips" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold px-6">الرحلات</TabsTrigger>
                                <TabsTrigger value="bookings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold px-6">الحجوزات</TabsTrigger>
                                <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold px-6">التقارير</TabsTrigger>
                                <TabsTrigger value="subscription" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold px-6">الاشتراك</TabsTrigger>
                                <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold px-6 gap-2"><Settings className="w-4 h-4" /> الإعدادات</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="trips" className="p-8">
                             {tripsLoading ? (
                                <div className="text-center py-20">
                                    <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-600" />
                                </div>
                             ) : myTrips.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {myTrips.map(trip => (
                                        <TripCardEnhanced key={trip.id} trip={trip} onEdit={handleEditTrip} />
                                    ))}
                                </div>
                             ) : (
                                <div className="text-center py-20 text-gray-400">
                                    <Map className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-xl font-bold text-gray-700">لا توجد رحلات حالياً</h3>
                                    <p className="mb-6">ابدأ بنشر رحلتك الأولى واستقبل الحجوزات</p>
                                    <Button className="bg-indigo-600 text-white rounded-xl" onClick={handleCreateTrip}>إضافة رحلة</Button>
                                </div>
                             )}
                        </TabsContent>





                        <TabsContent value="settings" className="p-8">
                            <form onSubmit={handleSaveSettings}>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    {/* Right Column: Basic Info */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">المعلومات الأساسية</h3>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">اسم الشركة *</Label>
                                                    <Input 
                                                    id="name" 
                                                    value={settingsData.name} 
                                                    onChange={(e) => setSettingsData({...settingsData, name: e.target.value})}
                                                    required 
                                                    placeholder="شركة السفر والسياحة..."
                                                    className="h-12 rounded-xl"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="description">وصف الشركة *</Label>
                                                    <Textarea 
                                                    id="description" 
                                                    value={settingsData.description} 
                                                    onChange={(e) => setSettingsData({...settingsData, description: e.target.value})}
                                                    required 
                                                    placeholder="نبذة عن الشركة وخدماتها..."
                                                    className="min-h-[120px] rounded-xl"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="tags">تصنيفات الرحلات (مفصولة بفاصلة)</Label>
                                                    <Input 
                                                        id="tags" 
                                                        value={settingsData.tags} 
                                                        onChange={(e) => setSettingsData({...settingsData, tags: e.target.value})}
                                                        placeholder="سفاري, بحر, عائلي..."
                                                        className="h-12 rounded-xl"
                                                    />
                                                    <p className="text-xs text-gray-400">مثال: سفاري, شواطئ, تخييم, عائلي</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 mt-8">الشعار والهوية</h3>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="logo">شعار الشركة (URL) *</Label>
                                                    <Input 
                                                        id="logo" 
                                                        value={settingsData.logo} 
                                                        onChange={(e) => setSettingsData({...settingsData, logo: e.target.value})}
                                                        required 
                                                        placeholder="https://..."
                                                        className="h-12 rounded-xl"
                                                    />
                                                    {settingsData.logo && (
                                                        <div className="mt-4 p-4 border rounded-xl bg-gray-50 flex items-center justify-center">
                                                            <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${settingsData.color} flex items-center justify-center text-white overflow-hidden shadow-lg p-1`}>
                                                                <img src={settingsData.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <Label>طابع الشركة اللوني (يظهر خلف الشعار) *</Label>
                                                    <div className="grid grid-cols-6 gap-2">
                                                        {GRADIENT_PRESETS.map((preset) => (
                                                            <div 
                                                            key={preset}
                                                            className={`h-10 rounded-lg bg-gradient-to-br ${preset} cursor-pointer transition-all ${settingsData.color === preset ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'hover:opacity-80'}`}
                                                            onClick={() => setSettingsData({...settingsData, color: preset})}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Left Column: Contact Info */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">بيانات التواصل</h3>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="phone">رقم الهاتف *</Label>
                                                    <Input 
                                                    id="phone" 
                                                    value={settingsData.contactInfo.phone} 
                                                    onChange={(e) => setSettingsData({...settingsData, contactInfo: {...settingsData.contactInfo, phone: e.target.value}})}
                                                    required 
                                                    placeholder="+966..."
                                                    className="h-12 rounded-xl"
                                                    dir="ltr"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="whatsapp">واتساب *</Label>
                                                    <Input 
                                                    id="whatsapp" 
                                                    value={settingsData.contactInfo.whatsapp} 
                                                    onChange={(e) => setSettingsData({...settingsData, contactInfo: {...settingsData.contactInfo, whatsapp: e.target.value}})}
                                                    required 
                                                    placeholder="+966..."
                                                    className="h-12 rounded-xl"
                                                    dir="ltr"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">البريد الإلكتروني *</Label>
                                                    <Input 
                                                    id="email" 
                                                    type="email"
                                                    value={settingsData.contactInfo.email} 
                                                    onChange={(e) => setSettingsData({...settingsData, contactInfo: {...settingsData.contactInfo, email: e.target.value}})}
                                                    required 
                                                    placeholder="info@company.com"
                                                    className="h-12 rounded-xl"
                                                    dir="ltr"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="website">الموقع الإلكتروني (اختياري)</Label>
                                                    <Input 
                                                    id="website" 
                                                    value={settingsData.contactInfo.website} 
                                                    onChange={(e) => setSettingsData({...settingsData, contactInfo: {...settingsData.contactInfo, website: e.target.value}})}
                                                    placeholder="www.company.com"
                                                    className="h-12 rounded-xl"
                                                    dir="ltr"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="address">العنوان (اختياري)</Label>
                                                    <Input 
                                                    id="address" 
                                                    value={settingsData.contactInfo.address} 
                                                    onChange={(e) => setSettingsData({...settingsData, contactInfo: {...settingsData.contactInfo, address: e.target.value}})}
                                                    placeholder="المدينة، الحي..."
                                                    className="h-12 rounded-xl"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-8">
                                            <Button type="submit" disabled={savingSettings} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 rounded-xl shadow-xl shadow-indigo-100 text-lg">
                                                {savingSettings ? (
                                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> جاري الحفظ...</>
                                                ) : (
                                                    "حفظ التعديلات"
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="bookings" className="p-8">
                             {bookingsLoading ? (
                                <div className="text-center py-20">
                                    <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-600" />
                                </div>
                             ) : (
                                <BookingManagementTable bookings={bookings} onUpdate={() => { handleRefreshBookings(); fetchAnalytics(); }} />
                             )}
                        </TabsContent>

                        <TabsContent value="reports" className="p-8 space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Bookings Status Distribution */}
                                <Card className="p-6 rounded-3xl border-gray-100 shadow-sm">
                                    <CardHeader className="px-0 pt-0">
                                        <CardTitle className="text-lg font-bold">توزيع حالات الحجوزات</CardTitle>
                                    </CardHeader>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'مقبول', value: bookings.filter(b => b.status === 'accepted').length },
                                                        { name: 'قيد الانتظار', value: bookings.filter(b => b.status === 'pending').length },
                                                        { name: 'مرفوض', value: bookings.filter(b => b.status === 'rejected').length },
                                                        { name: 'ملغي', value: bookings.filter(b => b.status === 'cancelled').length },
                                                    ].filter(d => d.value > 0)}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#10b981" />
                                                    <Cell fill="#f59e0b" />
                                                    <Cell fill="#ef4444" />
                                                    <Cell fill="#6b7280" />
                                                </Pie>
                                                <ReTooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>

                                {/* Payment Summary Pie Chart */}
                                <Card className="p-6 rounded-3xl border-gray-100 shadow-sm">
                                    <CardHeader className="px-0 pt-0">
                                        <CardTitle className="text-lg font-bold">حالة التحصيل المالي</CardTitle>
                                    </CardHeader>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'مدفوع', value: stats?.revenue?.paid || 0 },
                                                        { name: 'مطلوب تحصيله', value: stats?.revenue?.pending || 0 },
                                                        { name: 'مسترجع', value: stats?.revenue?.refunded || 0 },
                                                    ].filter(d => d.value > 0)}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#10b981" />
                                                    <Cell fill="#f59e0b" />
                                                    <Cell fill="#ef4444" />
                                                </Pie>
                                                <ReTooltip />
                                                <Legend formatter={(value) => `${value}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <Card className="p-6 rounded-3xl bg-emerald-50 border-0">
                                    <div className="text-emerald-600 text-sm font-bold">المحصل فعلياً</div>
                                    <div className="text-2xl font-black text-emerald-700">{(stats?.revenue?.paid || 0).toLocaleString()} ج.م</div>
                                 </Card>
                                 <Card className="p-6 rounded-3xl bg-orange-50 border-0">
                                    <div className="text-orange-600 text-sm font-bold">قيد التحصيل</div>
                                    <div className="text-2xl font-black text-orange-700">{(stats?.revenue?.pending || 0).toLocaleString()} ج.م</div>
                                 </Card>
                                 <Card className="p-6 rounded-3xl bg-blue-50 border-0">
                                    <div className="text-blue-600 text-sm font-bold">الإجمالي المتوقع</div>
                                    <div className="text-2xl font-black text-blue-700">{(stats?.revenue?.total || 0).toLocaleString()} ج.م</div>
                                 </Card>
                            </div>

                                {/* Trip Views vs Bookings */}
                                <Card className="p-6 rounded-3xl border-gray-100 shadow-sm">
                                    <CardHeader className="px-0 pt-0">
                                        <CardTitle className="text-lg font-bold">المشاهدات مقابل الحجوزات (لكل رحلة)</CardTitle>
                                    </CardHeader>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ReBarChart
                                                data={myTrips.map(trip => ({
                                                    name: trip.title.substring(0, 15) + '...',
                                                    views: trip.views || 0,
                                                    bookings: bookings.filter(b => b.tripId === (trip.id || trip._id)).length
                                                }))}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <ReTooltip />
                                                <Legend />
                                                <Bar dataKey="views" name="المشاهدات" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="bookings" name="الحجوزات" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                            </ReBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>

                            {/* Detailed Performance Table */}
                            <Card className="p-6 rounded-3xl border-gray-100 shadow-sm overflow-hidden">
                                <CardHeader className="px-0 pt-0">
                                    <CardTitle className="text-lg font-bold">أداء الرحلات التفصيلي</CardTitle>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="pb-4 font-bold text-gray-500">الرحلة</th>
                                                <th className="pb-4 font-bold text-gray-500">المشاهدات</th>
                                                <th className="pb-4 font-bold text-gray-500">الحجوزات</th>
                                                <th className="pb-4 font-bold text-gray-500">معدل التحويل</th>
                                                <th className="pb-4 font-bold text-gray-500">الإيرادات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {myTrips.map(trip => {
                                                const tripBookings = bookings.filter(b => b.tripId === (trip.id || trip._id));
                                                const acceptedBookings = tripBookings.filter(b => b.status === 'accepted');
                                                const conversionRate = trip.views ? ((tripBookings.length / trip.views) * 100).toFixed(1) : 0;
                                                const revenue = acceptedBookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
                                                
                                                return (
                                                    <tr key={trip.id || trip._id}>
                                                        <td className="py-4 font-semibold">{trip.title}</td>
                                                        <td className="py-4">{trip.views || 0}</td>
                                                        <td className="py-4">{tripBookings.length}</td>
                                                        <td className="py-4">
                                                            <Badge variant="outline" className="text-indigo-600 bg-indigo-50 border-indigo-100">
                                                                {conversionRate}%
                                                            </Badge>
                                                        </td>
                                                        <td className="py-4 font-bold text-emerald-600">{revenue.toLocaleString()} ج.م</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="subscription" className="p-8">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                 {/* Free Trial / Basic Plan */}
                                 <div className="border-2 border-indigo-600 rounded-3xl p-8 relative bg-indigo-50/50">
                                     <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">الباقة الحالية</div>
                                     <h3 className="text-2xl font-black text-gray-900 mb-2">تجربة مجانية</h3>
                                     <div className="text-3xl font-black text-indigo-600 mb-6">0 <span className="text-sm text-gray-500 font-normal">ج.م / 14 يوم</span></div>
                                     <ul className="space-y-3 mb-8 text-gray-600 text-sm">
                                         <li className="flex gap-2"><Activity className="w-4 h-4 text-emerald-500" /> إضافة رحلات غير محدودة</li>
                                         <li className="flex gap-2"><Activity className="w-4 h-4 text-emerald-500" /> لوحة تحكم أساسية</li>
                                     </ul>
                                     <Button className="w-full rounded-xl bg-gray-900 text-white" disabled>مشترك حالياً</Button>
                                 </div>
                                 
                                 {/* Pro Plan */}
                                 <div className="border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all relative overflow-hidden group">
                                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500" />
                                     <h3 className="text-2xl font-black text-gray-900 mb-2">الباقة الذهبية</h3>
                                     <div className="text-3xl font-black text-gray-900 mb-6">1500 <span className="text-sm text-gray-500 font-normal">ج.م / شهرياً</span></div>
                                     <ul className="space-y-3 mb-8 text-gray-600 text-sm">
                                         <li className="flex gap-2"><Activity className="w-4 h-4 text-emerald-500" /> كل مميزات التجربة</li>
                                         <li className="flex gap-2"><Activity className="w-4 h-4 text-emerald-500" /> أولوية في الظهور</li>
                                         <li className="flex gap-2"><Activity className="w-4 h-4 text-emerald-500" /> دعم فني مباشر</li>
                                     </ul>
                                     <Button className="w-full rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold">ترقية الباقة</Button>
                                 </div>
                             </div>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
            <Footer />
        </div>
    );
};

export default CompanyDashboard;
