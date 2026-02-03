import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth, useClerk } from "@clerk/clerk-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Activity, Users, Map, Plus, DollarSign, Calendar, LogOut, AlertTriangle, Loader2, Settings, Bus, Check, RefreshCcw, Bell } from "lucide-react";
import BusSeatLayout from "@/components/company/BusSeatLayout";
import { useToast } from "@/components/ui/use-toast";
import { corporateTripsService } from "@/services/corporateTripsService";
import { bookingService, Booking } from "@/services/bookingService";
import CompanyTripFormDialog from "@/components/company/CompanyTripFormDialog";
import TripCardEnhanced from "@/components/TripCardEnhanced";
import BookingManagementTable from "@/components/company/BookingManagementTable";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { companyService } from "@/services/companyService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PaymentDialog from "@/components/company/PaymentDialog";
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
    const [activeTab, setActiveTab] = useState('trips');

    const GRADIENT_PRESETS = [
  "from-orange-500 to-red-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-purple-500 to-pink-500",
  "from-yellow-500 to-orange-500",
  "from-gray-700 to-gray-900"
];

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
    const [selectedTripForSeats, setSelectedTripForSeats] = useState<any>(null);
    const [isSavingSeats, setIsSavingSeats] = useState(false);

    // Plan State
    const [currentPlan, setCurrentPlan] = useState<'free' | 'advanced' | 'professional'>('free');
    const PLAN_LIMITS = { free: 3, advanced: 5, professional: 8 };
    const tripsUsed = myTrips.length;
    const tripsLimit = PLAN_LIMITS[currentPlan];
    const tripsLeft = tripsLimit - tripsUsed;
    const canAddTrip = tripsLeft > 0;

    // Payment State
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<{ id: 'advanced' | 'professional', name: string, price: string } | null>(null);

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

    // Data Refresh Handlers
    const refreshAllData = async () => {
        setCompanyLoading(true);
        setTripsLoading(true);
        setBookingsLoading(true);
        try {
            const token = await getToken();
            const company = await companyService.getMyCompany(token || undefined);
            if (company && company._id) {
                const trips = await corporateTripsService.getTripsByCompany(company._id);
                setMyTrips(trips);
                const companyBookings = await bookingService.getCompanyBookings(token || undefined);
                setBookings(companyBookings);
                const analyticsData = await bookingService.getAnalytics(token || undefined);
                setStats(analyticsData);
                
                // Determine Plan (Mock logic or based on company data if available)
                // For now, let's stick to 'free' or check if company has a 'plan' field
                // if (company.plan) setCurrentPlan(company.plan); 
            }
        } catch (error) {
            console.error("Refresh failed", error);
            toast({ title: "خطأ", description: "فشل تحديث البيانات", variant: "destructive" });
        } finally {
            setCompanyLoading(false);
            setTripsLoading(false);
            setBookingsLoading(false);
        }
    };

    const handleRefreshTrips = async () => {
        setTripsLoading(true);
        try {
            const token = await getToken();
            const company = await companyService.getMyCompany(token || undefined);
            if (company && company._id) {
                const trips = await corporateTripsService.getTripsByCompany(company._id);
                setMyTrips(trips);
                toast({ title: "تم التحديث", description: "تم تحديث قائمة الرحلات" });
            }
        } catch (error) {
            toast({ title: "خطأ", description: "فشل تحديث الرحلات", variant: "destructive" });
        } finally {
            setTripsLoading(false);
        }
    };

    const handleRefreshReports = async () => {
         fetchAnalytics();
         toast({ title: "تم التحديث", description: "تم تحديث التقارير" });
    };

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

    const handleSaveSeats = async (newBookings: any[]) => {
        if (!selectedTripForSeats) return;
        setIsSavingSeats(true);
        try {
            const token = await getToken();
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/corporate/trips/${selectedTripForSeats._id || selectedTripForSeats.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ seatBookings: newBookings })
            });

            if (!response.ok) throw new Error("Failed to save seats");

            toast({
                title: "تم حفظ المقاعد",
                description: "تم تحديث مخطط المقاعد بنجاح وسيتم إخطار المسافرين.",
            });
            
            // Update local state
            setMyTrips(prev => prev.map(t => (t._id === selectedTripForSeats._id || t.id === selectedTripForSeats.id) ? { ...t, seatBookings: newBookings } : t));
            
        } catch (error) {
            console.error(error);
            toast({ title: "خطأ", description: "فشل حفظ المقاعد", variant: "destructive" });
        } finally {
            setIsSavingSeats(false);
        }
    };

    const handleUpgradeClick = (id: 'advanced' | 'professional', name: string, price: string) => {
        setSelectedPlanForUpgrade({ id, name, price });
        setShowPaymentDialog(true);
    };

    const handlePaymentSuccess = () => {
        if (selectedPlanForUpgrade) {
            setCurrentPlan(selectedPlanForUpgrade.id);
            toast({
                 title: "مبروك! تمت الترقية بنجاح 🎉",
                 description: `أنت الآن تستمتع بمميزات ${selectedPlanForUpgrade.name}.`,
                 className: "bg-green-50 border-green-200 text-green-900"
            });
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

            <PaymentDialog 
                open={showPaymentDialog}
                onOpenChange={setShowPaymentDialog}
                planName={selectedPlanForUpgrade?.name || ''}
                price={selectedPlanForUpgrade?.price || ''}
                onSuccess={handlePaymentSuccess}
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
                        <Button 
                            onClick={handleCreateTrip} 
                            disabled={!canAddTrip}
                            className={`font-bold h-12 px-6 rounded-xl flex items-center gap-2 shadow-lg transition-all ${canAddTrip ? "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                        >
                            <Plus className="w-5 h-5" />
                            {canAddTrip ? "إضافة رحلة جديدة" : "نفذ رصيد الرحلات"}
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

                {/* Main Content with Sidebar */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-72 shrink-0">
                        <Card className="rounded-[2.5rem] border-0 shadow-lg overflow-hidden p-4 sticky top-24">
                            <nav className="space-y-2">
                                {[
                                    { id: 'trips', label: 'الرحلات', icon: Map },
                                    { id: 'bookings', label: 'الحجوزات', icon: Users, badge: bookings.filter(b => b.status === 'pending').length },
                                    { id: 'seats', label: 'توزيع المقاعد', icon: Bus },
                                    { id: 'reports', label: 'التقارير', icon: BarChart },
                                    { id: 'subscription', label: 'الاشتراك', icon: Activity },
                                    { id: 'settings', label: 'الإعدادات', icon: Settings },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                                            activeTab === tab.id 
                                            ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
                                            : "hover:bg-indigo-50 hover:text-indigo-600 text-gray-500"
                                        }`}
                                        id={`sidebar-tab-${tab.id}`}
                                    >
                                        <tab.icon className="w-5 h-5" />
                                        <span>{tab.label}</span>
                                        {tab.badge ? (
                                            <span className="mr-auto bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                                {tab.badge}
                                            </span>
                                        ) : null}
                                    </button>
                                ))}
                            </nav>
                            
                            <div className="mt-8 pt-6 border-t border-gray-100 px-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                        <span>الباقة الحالية</span>
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">{currentPlan === 'free' ? 'مجانية' : currentPlan === 'advanced' ? 'متقدمة' : 'محترفين'}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold text-gray-900">
                                        <span>الرحلات المستخدمة</span>
                                        <span>{tripsUsed} / {tripsLimit}</span>
                                    </div>
                                    <Progress value={(tripsUsed / tripsLimit) * 100} className="h-2 bg-gray-100" />
                                    {!canAddTrip && <p className="text-[10px] text-red-500 font-bold text-center">وصلت للحد الأقصى للرحلات</p>}
                                </div>
                                
                                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                                    <p className="text-xs font-bold text-orange-600 mb-2">هل تحتاج مساعدة؟</p>
                                    <p className="text-[10px] text-orange-400 leading-relaxed">فريق دعم الرحلتى متواجد لمساعدتك في إدارة شركتك.</p>
                                    <Button variant="link" className="text-orange-600 p-0 h-auto text-[10px] font-black mt-2">تواصل معنا</Button>
                                </div>
                            </div>
                        </Card>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                        <Card className="rounded-[2.5rem] border-0 shadow-lg overflow-hidden min-h-[600px]">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                {/* Hide the default TabsList but keep it for functionality */}
                                <div className="hidden">
                                     <TabsList>
                                        <TabsTrigger value="trips">trips</TabsTrigger>
                                        <TabsTrigger value="bookings">bookings</TabsTrigger>
                                        <TabsTrigger value="seats">seats</TabsTrigger>
                                        <TabsTrigger value="reports">reports</TabsTrigger>
                                        <TabsTrigger value="subscription">subscription</TabsTrigger>
                                        <TabsTrigger value="settings">settings</TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="trips" className="p-8 m-0 focus-visible:outline-none">
                                     <div className="flex items-center justify-between mb-8">
                                         <div className="flex items-center gap-4">
                                            <h2 className="text-2xl font-black text-gray-900">إدارة الرحلات</h2>
                                            <Button variant="ghost" size="icon" onClick={handleRefreshTrips} className="rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600">
                                                <RefreshCcw className={`w-5 h-5 ${tripsLoading ? 'animate-spin' : ''}`} />
                                            </Button>
                                         </div>
                                         <Badge variant="outline" className="rounded-full px-4 py-1 text-indigo-600 border-indigo-100 bg-indigo-50">
                                             {myTrips.length} رحلة
                                         </Badge>
                                     </div>
                                     {tripsLoading ? (
                                        <div className="text-center py-20">
                                            <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-600" />
                                        </div>
                                     ) : myTrips.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                                <TabsContent value="bookings" className="p-8 m-0 focus-visible:outline-none">
                                     <div className="flex items-center justify-between mb-8">
                                         <div className="flex items-center gap-4">
                                            <h2 className="text-2xl font-black text-gray-900">طلبات الحجز</h2>
                                            {bookings.filter(b => b.status === 'pending').length > 0 && (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full border border-red-200">
                                                    <Bell className="w-4 h-4 text-red-600" />
                                                    <span className="text-xs font-bold text-red-700">
                                                        {bookings.filter(b => b.status === 'pending').length} طلب جديد
                                                    </span>
                                                </div>
                                            )}
                                         </div>
                                         <Button 
                                            onClick={handleRefreshBookings} 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-indigo-600 hover:bg-indigo-50 gap-2 font-bold"
                                        >
                                             <Activity className="w-4 h-4" /> تحديث البيانات
                                         </Button>
                                     </div>
                                     {bookingsLoading ? (
                                        <div className="text-center py-20">
                                            <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-600" />
                                        </div>
                                     ) : (
                                        <>
                                            {/* Booking Bill / Summary */}
                                            {bookings.filter(b => b.status === 'pending').length > 0 && (
                                                <div className="mb-6 p-6 bg-gradient-to-l from-indigo-50 to-white border border-indigo-100 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500" />
                                                    <div className="relative z-10">
                                                        <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                            <Activity className="w-4 h-4 text-indigo-600" />
                                                            ملخص الطلبات الجديدة
                                                        </h3>
                                                        <p className="text-sm text-gray-500">لديك <span className="font-bold text-indigo-600">{bookings.filter(b => b.status === 'pending').length}</span> طلبات حجز قيد الانتظار</p>
                                                    </div>
                                                    <div className="relative z-10 text-left">
                                                        <p className="text-xs text-gray-400 font-bold mb-1">إجمالي القيمة المتوقعة</p>
                                                        <p className="text-2xl font-black text-gray-900">
                                                            {bookings
                                                                .filter(b => b.status === 'pending')
                                                                .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0)
                                                                .toLocaleString()} 
                                                            <span className="text-sm font-bold text-gray-500 mr-1">ج.م</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            <BookingManagementTable bookings={bookings} onUpdate={() => { handleRefreshBookings(); fetchAnalytics(); }} />
                                        </>
                                     )}
                                </TabsContent>

                                <TabsContent value="seats" className="p-8 m-0 focus-visible:outline-none">
                                     <div className="flex items-center justify-between mb-8">
                                         <div className="flex items-center gap-4">
                                            <h2 className="text-2xl font-black text-gray-900">توزيع مقاعد الركاب</h2>
                                            <Button variant="ghost" size="icon" onClick={handleRefreshTrips} className="rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600">
                                                <RefreshCcw className={`w-5 h-5 ${tripsLoading ? 'animate-spin' : ''}`} />
                                            </Button>
                                         </div>
                                         <p className="text-sm font-bold text-zinc-400">اختر رحلة لتنظيم مقاعدها</p>
                                     </div>
                                     
                                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                         <div className="lg:col-span-1 space-y-4">
                                            {myTrips.map(trip => (
                                                <button 
                                                    key={trip.id || trip._id}
                                                    onClick={() => setSelectedTripForSeats(trip)}
                                                    className={`w-full p-4 rounded-2xl text-right transition-all border-2 ${selectedTripForSeats?.id === trip.id || selectedTripForSeats?._id === trip._id ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                                >
                                                    <p className="font-black text-gray-900 mb-1">{trip.title}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(trip.startDate).toLocaleDateString()}
                                                        <span className="mx-1">•</span>
                                                        <Bus className="w-3 h-3" />
                                                        {trip.transportationType === 'van-14' ? '14 مقعد' : '50 مقعد'}
                                                    </div>
                                                </button>
                                            ))}
                                         </div>

                                         <div className="lg:col-span-2">
                                            {selectedTripForSeats ? (
                                                <Card className="p-8 border-gray-100 rounded-3xl shadow-xl shadow-zinc-200/50 bg-white flex flex-col items-center">
                                                    <div className="w-full flex items-center justify-between mb-8">
                                                        <div>
                                                           <h3 className="text-xl font-black text-gray-900">{selectedTripForSeats.title}</h3>
                                                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">اضغط على المقعد لتسجيل اسم المسافر</p>
                                                        </div>
                                                        {isSavingSeats && <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />}
                                                    </div>
                                                    
                                                    <BusSeatLayout 
                                                        type={selectedTripForSeats.transportationType || 'bus-48'} 
                                                        bookedSeats={selectedTripForSeats.seatBookings || []}
                                                        isAdmin={true}
                                                        onSaveSeats={handleSaveSeats}
                                                        totalBookedPassengers={bookings.filter(b => (b.tripId as any) === (selectedTripForSeats._id || selectedTripForSeats.id) && b.status === 'accepted').length}
                                                        tripBookings={bookings.filter(b => (b.tripId as any) === (selectedTripForSeats._id || selectedTripForSeats.id) && b.status === 'accepted')}
                                                    />
                                                </Card>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-gray-100 rounded-[3rem] text-gray-400">
                                                    <Bus className="w-16 h-16 opacity-20 mb-4" />
                                                    <p className="font-bold">قم باختيار رحلة من القائمة لبدء توزيع المقاعد</p>
                                                </div>
                                            )}
                                         </div>
                                     </div>
                                </TabsContent>

                                <TabsContent value="reports" className="p-8 m-0 focus-visible:outline-none">
                                    <div className="flex items-center justify-between mb-8">
                                         <h2 className="text-2xl font-black text-gray-900">التقارير والإحصائيات</h2>
                                         <Button variant="ghost" size="icon" onClick={handleRefreshReports} className="rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600">
                                            <RefreshCcw className="w-5 h-5" />
                                         </Button>
                                    </div>
                                    <div className="space-y-8">
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
                                                            bookings: bookings.filter(b => String(b.tripId) === String(trip._id || trip.id)).length
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
                                                            const tripBookings = bookings.filter(b => String(b.tripId) === String(trip._id || trip.id));
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
                                    </div>
                                </TabsContent>

                                <TabsContent value="subscription" className="p-8 m-0 focus-visible:outline-none">
                                     <h2 className="text-2xl font-black text-gray-900 mb-8">خطط الاشتراك</h2>
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                         {/* Basic Plan */}
                                         <div className="border-2 border-indigo-100 rounded-3xl p-6 relative bg-white hover:border-indigo-200 transition-all">
                                             <h3 className="text-xl font-black text-gray-900 mb-2">الباقة الأساسية</h3>
                                             <div className="text-3xl font-black text-indigo-600 mb-6">مجاناً</div>
                                              <ul className="space-y-3 mb-8 text-gray-600 text-sm">
                                                 <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> إدارة وإضافة ٣ رحلات شهرياً</li>
                                                 <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> لوحة تحكم أساسية</li>
                                             </ul>
                                             <Button className="w-full rounded-xl bg-gray-100 text-gray-900 hover:bg-gray-200" disabled>مشترك حالياً</Button>
                                         </div>
                                         
                                         {/* Pro Plan */}
                                         <div className="border-2 border-indigo-600 rounded-3xl p-6 relative bg-indigo-50/30 hover:shadow-xl transition-all scale-105 shadow-lg">
                                             <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">الأكثر طلباً</div>
                                             <h3 className="text-xl font-black text-gray-900 mb-2">الباقة المتقدمة</h3>
                                             <div className="text-3xl font-black text-gray-900 mb-6">2,999 <span className="text-sm text-gray-500 font-normal">ج.م / شهرياً</span></div>
                                             <ul className="space-y-3 mb-8 text-gray-600 text-sm">
                                                 <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> إدارة وإضافة ٥ رحلات شهرياً</li>
                                                 <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> تحليلات متقدمة</li>
                                                 <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> دعم فني ذو أولوية</li>
                                             </ul>
                                             <Button 
                                                 className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
                                                 onClick={() => handleUpgradeClick('advanced', 'الباقة المتقدمة', '2,999')}
                                                 disabled={currentPlan === 'advanced' || currentPlan === 'professional'}
                                             >
                                                 {currentPlan === 'advanced' ? 'باقتك الحالية' : currentPlan === 'professional' ? 'لديك باقة أعلى' : 'اشترك الآن'}
                                             </Button>
                                         </div>

                                          {/* Premium Plan */}
                                         <div className="border border-gray-200 rounded-3xl p-6 hover:shadow-xl transition-all relative overflow-hidden group bg-white">
                                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500" />
                                             <h3 className="text-xl font-black text-gray-900 mb-2">باقة المحترفين</h3>
                                             <div className="text-3xl font-black text-gray-900 mb-6">3,999 <span className="text-sm text-gray-500 font-normal">ج.م / شهرياً</span></div>
                                             <ul className="space-y-3 mb-8 text-gray-600 text-sm">
                                                 <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> إدارة وإضافة ٨ رحلات شهرياً</li>
                                                 <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> جميع المميزات السابقة</li>
                                                 <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> ظهور مميز في الصفحة الرئيسية</li>
                                             </ul>
                                             <Button 
                                                 className="w-full rounded-xl bg-gray-900 hover:bg-black text-white"
                                                 onClick={() => handleUpgradeClick('professional', 'باقة المحترفين', '3,999')}
                                                 disabled={currentPlan === 'professional'}
                                             >
                                                 {currentPlan === 'professional' ? 'باقتك الحالية' : 'اشترك الآن'}
                                             </Button>
                                         </div>
                                     </div>
                                </TabsContent>

                                <TabsContent value="settings" className="p-8 m-0 focus-visible:outline-none">
                                    <h2 className="text-2xl font-black text-gray-900 mb-8">إعدادات الشركة</h2>
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
                            </Tabs>
                        </Card>
                    </div>
                </div>
            </div>
            <div className="mt-12">
                <Footer />
            </div>
        </div>
    );
};

export default CompanyDashboard;
