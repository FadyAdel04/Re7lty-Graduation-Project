import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";

import { useNavigate } from "react-router-dom";
import { useUser, useAuth, useClerk } from "@clerk/clerk-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Activity, Users, Map, Plus, DollarSign, Calendar, LogOut, AlertTriangle, Loader2, Settings, Bus, Check, RefreshCcw, Bell, MessageCircle, Ticket, BookOpen, ChevronRight, ChevronLeft, FileDown, Edit3, ListChecks, Send, LayoutGrid, TrendingUp, Clock, Download, Filter, Search, MoreVertical, QrCode, Camera, Upload, ShieldCheck, XCircle, MapPin } from "lucide-react";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import BusSeatLayout from "@/components/company/BusSeatLayout";
import { useToast } from "@/components/ui/use-toast";
import { corporateTripsService } from "@/services/corporateTripsService";
import { bookingService, Booking } from "@/services/bookingService";
import CompanyTripFormDialog from "@/components/company/CompanyTripFormDialog";
import TripCardEnhanced from "@/components/TripCardEnhanced";
import BookingManagementTable from "@/components/company/BookingManagementTable";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { companyService } from "@/services/companyService";
import { CompanyChat } from "@/components/company/CompanyChat";
import { chatService } from "@/services/chatService";
import { getTripGroups } from "@/lib/tripGroupApi";
import { createPusherClient } from "@/lib/pusher-client";
import CouponManagement from "@/components/company/CouponManagement";
import { exportTripDetailsToPDF } from "@/services/TripExportService";
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
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const CompanyDashboard = () => {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    // UI State
    const [isSwitchingRole, setIsSwitchingRole] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showGuideDialog, setShowGuideDialog] = useState(false);
    const [guideStep, setGuideStep] = useState(0);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const GUIDE_SECTIONS: { id: string; label: string; icon: typeof Map; text: string; color: string; actionIcons: { icon: typeof Plus; label: string }[] }[] = [
        { id: 'trips', label: 'الرحلات', icon: Map, color: 'from-orange-500 to-red-500', text: 'عرض جميع رحلاتك، إضافة رحلة جديدة، تعديل بيانات أي رحلة، تصدير تفاصيل الرحلة كملف PDF.', actionIcons: [{ icon: Map, label: 'عرض الرحلات' }, { icon: Plus, label: 'إضافة رحلة' }, { icon: Edit3, label: 'تعديل' }, { icon: FileDown, label: 'تصدير PDF' }] },
        { id: 'bookings', label: 'الحجوزات', icon: Users, color: 'from-green-500 to-emerald-500', text: 'رؤية طلبات الحجز من المسافرين، قبول أو رفض الطلبات. الطلبات الجديدة بشارة حمراء.', actionIcons: [{ icon: Users, label: 'طلبات الحجز' }, { icon: Check, label: 'قبول' }, { icon: Clock, label: 'قيد الانتظار' }] },
        { id: 'seats', label: 'توزيع المقاعد', icon: Bus, color: 'from-purple-500 to-pink-500', text: 'اختيار رحلة لرؤية مخطط المقاعد، تعيين المقاعد يدوياً للحجوزات.', actionIcons: [{ icon: Bus, label: 'مخطط المقاعد' }, { icon: LayoutGrid, label: 'توزيع' }] },
        { id: 'coupons', label: 'كوبونات الخصم', icon: Ticket, color: 'from-yellow-500 to-orange-500', text: 'إنشاء كوبونات خصم (نسبة مئوية أو مبلغ ثابت)، تحديد الرحلات وتاريخ انتهاء الكوبون.', actionIcons: [{ icon: Ticket, label: 'كوبونات' }, { icon: DollarSign, label: 'خصم' }] },
        { id: 'contact', label: 'الرسائل', icon: MessageCircle, color: 'from-blue-500 to-cyan-500', text: 'التواصل مع المسافرين عبر المحادثات.', actionIcons: [{ icon: MessageCircle, label: 'محادثات' }, { icon: Send, label: 'إرسال' }] },
        { id: 'qr-scanner', label: 'التحقق من QR', icon: QrCode, color: 'from-cyan-500 to-blue-500', text: 'مسح رمز QR الخاص بالحجز للتحقق من صحته وتأكيد الحضور.', actionIcons: [{ icon: QrCode, label: 'مسح الكود' }, { icon: ShieldCheck, label: 'تحقق' }] },
        { id: 'reports', label: 'التقارير', icon: BarChart, color: 'from-red-500 to-pink-500', text: 'عرض إحصائيات المبيعات والإيرادات وعدد الحجوزات.', actionIcons: [{ icon: BarChart, label: 'إحصائيات' }, { icon: DollarSign, label: 'الإيرادات' }, { icon: ListChecks, label: 'الحجوزات' }] },
        { id: 'settings', label: 'الإعدادات', icon: Settings, color: 'from-gray-700 to-gray-900', text: 'تعديل بيانات شركتك: الاسم، الشعار، وصف الشركة.', actionIcons: [{ icon: Settings, label: 'الإعدادات' }, { icon: Edit3, label: 'تعديل البيانات' }] },
    ];
    
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
    const [currentBusIndex, setCurrentBusIndex] = useState(0);
    const [isSavingSeats, setIsSavingSeats] = useState(false);

    // QR Scanner State
    const [qrResult, setQrResult] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scannerObject, setScannerObject] = useState<Html5Qrcode | null>(null);
    const [verifiedBooking, setVerifiedBooking] = useState<any>(null);
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        setCurrentBusIndex(0);
    }, [selectedTripForSeats]);

    const canAddTrip = true;

    // Messages unread count
    const [messagesUnreadCount, setMessagesUnreadCount] = useState(0);

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
                            
                            if (company._id) {
                                const trips = await corporateTripsService.getTripsByCompany(company._id);
                                setMyTrips(trips);
                                
                                const companyBookings = await bookingService.getCompanyBookings(token || undefined);
                                setBookings(companyBookings);
                                
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
    
    // Real-time Messages Unread Count
    useEffect(() => {
        if (!isLoaded || !user) return;
        
        let isMounted = true;
        let pusher: any = null;
        let channels: string[] = [];

        const fetchTotalUnread = async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const [conversations, groups] = await Promise.all([
                    chatService.getConversations(token, true).catch(() => []),
                    getTripGroups(token).catch(() => [])
                ]);
                if (isMounted) {
                    const convs = (conversations as any[]) || [];
                    const grps = (groups as any[]) || [];
                    const total = convs.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0) + 
                                  grps.reduce((acc: number, g: any) => acc + (g.unreadCount || 0), 0);
                    if (activeTab !== 'contact') {
                        setMessagesUnreadCount(total);
                    } else {
                        setMessagesUnreadCount(0);
                    }
                }
            } catch (err) {
                console.error("Error fetching total unread:", err);
            }
        };

        const initializePusher = async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const groups = await getTripGroups(token).catch(() => []);
                
                fetchTotalUnread();

                pusher = createPusherClient(import.meta.env.VITE_PUSHER_KEY, import.meta.env.VITE_PUSHER_CLUSTER || 'eu');
                
                const directChannelName = `user-chats-${user.id}`;
                const directChannel = pusher.subscribe(directChannelName);
                channels.push(directChannelName);
                
                directChannel.bind('update-conversation', () => { fetchTotalUnread(); });
                directChannel.bind('new-message', () => { fetchTotalUnread(); });

                groups.forEach((group: any) => {
                    const groupChannelName = `trip-group-${group._id}`;
                    const groupChannel = pusher.subscribe(groupChannelName);
                    channels.push(groupChannelName);
                    
                    groupChannel.bind('new-message', () => { fetchTotalUnread(); });
                    groupChannel.bind('messages-read', () => { fetchTotalUnread(); });
                });

            } catch (err) {
                console.error("Pusher init error in dashboard", err);
            }
        };

        initializePusher();

        const interval = setInterval(fetchTotalUnread, 60000);

        return () => {
            isMounted = false;
            clearInterval(interval);
            if (pusher) {
                channels.forEach(name => pusher.unsubscribe(name));
            }
        };
    }, [isLoaded, user, getToken, activeTab]);

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

    const handleExportTrip = async (trip: any) => {
        try {
            toast({
                title: "جاري التحضير",
                description: "يتم الآن إنشاء ملف PDF لتفاصيل الرحلة...",
            });
            await exportTripDetailsToPDF(trip);
            toast({
                title: "تم الاستخراج",
                description: "تم تحميل ملف تفاصيل الرحلة بنجاح.",
            });
        } catch (error) {
            console.error("Export error", error);
            toast({
                title: "خطأ",
                description: "فشل استخراج ملف PDF، يرجى المحاولة مرة أخرى.",
                variant: "destructive"
            });
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
            const response = await fetch(`${API_BASE_URL}/api/users/me/switch-role`, {
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
            
            const bookingsWithBusIndex = newBookings.map(b => ({ ...b, busIndex: currentBusIndex }));
            
            const otherBusBookings = (selectedTripForSeats.seatBookings || []).filter((s: any) => (s.busIndex || 0) !== currentBusIndex);
            const combinedBookings = [...otherBusBookings, ...bookingsWithBusIndex];

            const response = await fetch(`${API_BASE_URL}/api/corporate/trips/${selectedTripForSeats._id || selectedTripForSeats.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ seatBookings: combinedBookings })
            });

            if (!response.ok) throw new Error("Failed to save seats");

            toast({
                title: "تم حفظ المقاعد",
                description: "تم تحديث مخطط المقاعد بنجاح وسيتم إخطار المسافرين.",
            });
            
            const updatedTrips = myTrips.map(t => (t._id === selectedTripForSeats._id || t.id === selectedTripForSeats.id) ? { ...t, seatBookings: combinedBookings } : t);
            setMyTrips(updatedTrips);
            setSelectedTripForSeats(prev => ({ ...prev, seatBookings: combinedBookings }));
            
        } catch (error) {
            console.error(error);
            toast({ title: "خطأ", description: "فشل حفظ المقاعد", variant: "destructive" });
        } finally {
            setIsSavingSeats(false);
        }
    };

    // Filter trips based on search
    const filteredTrips = myTrips.filter(trip => 
        trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate KPIs
    const totalRevenue = stats?.revenue?.total || 0;
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const acceptedBookings = bookings.filter(b => b.status === 'accepted').length;
    const totalTrips = myTrips.length;
    const totalViews = myTrips.reduce((acc, t) => acc + (t?.views ?? 0), 0);

    // QR Scanning Logic
    const startScanner = async () => {
        if (isScanning || isValidating) return; // Prevent multiple starts
        
        setIsScanning(true);
        setQrResult(null);
        setScanError(null);
        setVerifiedBooking(null);
        
        // Wait for DOM
        setTimeout(async () => {
            try {
                const readerElement = document.getElementById("reader");
                if (!readerElement) {
                    setIsScanning(false);
                    return;
                }
                
                const html5QrCode = new Html5Qrcode("reader");
                setScannerObject(html5QrCode);
                
                const qrCodeSuccessCallback = (decodedText: string) => {
                    handleScanSuccess(decodedText);
                    html5QrCode.stop().then(() => {
                        setIsScanning(false);
                        setScannerObject(null);
                    }).catch(err => {
                        // "Cannot stop, scanner is not running or paused" is safe to ignore if we're trying to stop anyway
                        if (!err?.toString().includes("is not running")) {
                            console.error("Error stopping scanner", err);
                        }
                        setIsScanning(false);
                        setScannerObject(null);
                    });
                };
                
                const config = { fps: 10, qrbox: { width: 250, height: 250 } };
                
                // If mobile/tablet, prefer back camera
                await html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, undefined);
            } catch (err: any) {
                console.error("Scanner start error", err);
                let message = "تعذر فتح الكاميرا.";
                if (err?.name === "NotAllowedError" || err?.toString().includes("Permission dismissed")) {
                    message = "تم رفض إذن الكاميرا. يرجى تفعيل الإذن من إعدادات المتصفح.";
                } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                    message = "يجب استخدام اتصال آمن (HTTPS) لتشغيل الكاميرا.";
                }
                setScanError(message);
                setIsScanning(false);
                toast({ title: "خطأ في الكاميرا", description: message, variant: "destructive" });
            }
        }, 300);
    };

    const stopScanner = async () => {
        if (scannerObject) {
            try {
                // Check if it's actually running before stopping to avoid "Cannot stop" error
                if (scannerObject.getState() === 2) { // 2 = SCANNING
                    await scannerObject.stop();
                }
                setScannerObject(null);
            } catch (err) {
                console.error("Error stopping scanner", err);
            }
        }
        setIsScanning(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setScanError(null);
        setQrResult(null);
        setVerifiedBooking(null);
        
        const html5QrCode = new Html5Qrcode("reader");
        try {
            const decodedText = await html5QrCode.scanFile(file, true);
            handleScanSuccess(decodedText);
        } catch (err) {
            console.error("File scan error", err);
            setScanError("لم يتم العثور على رمز QR في الصورة. يرجى تجربة صورة أوضح.");
        }
    };

    const handleScanSuccess = async (decodedText: string) => {
        if (isValidating) return;
        setQrResult(decodedText);
        setScanError(null);
        toast({ title: "تم المسح بنجاح", description: "جاري التحقق من الحجز..." });
        
        let reference = decodedText.trim();
        if (decodedText.includes('/verify-booking/')) {
            const parts = decodedText.split('/verify-booking/');
            reference = parts.pop() || decodedText;
            // Clean up reference: remove query params, hashes, and trailing slashes
            reference = reference.split('?')[0].split('#')[0].replace(/\/+$/, '').trim();
        }

        setIsValidating(true);
        try {
            const token = await getToken();
            const response = await fetch(`${API_BASE_URL}/api/bookings/verify/${reference}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (response.ok) {
                setVerifiedBooking(data);
                toast({ title: "حجز صالح", description: `تم التحقق من حجز ${data.booking.userName}`, variant: "default" });
            } else {
                setScanError(data.error || "عذراً، هذا الحجز غير صالح أو ملغي.");
            }
        } catch (error) {
            console.error("Verification error", error);
            setScanError("حدث خطأ أثناء الاتصال بالخادم.");
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-cairo" dir="rtl">
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

            <div className="container mx-auto px-4 py-6 lg:py-8">
                {/* Header Section with Glassmorphism */}
                <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black">لوحة تحكم الشركة</h1>
                                    <p className="text-white/80">مرحباً بعودتك، {user?.fullName || 'مدير الشركة'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button 
                                onClick={refreshAllData}
                                variant="secondary" 
                                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur rounded-xl gap-2"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                تحديث
                            </Button>
                            <Button 
                                onClick={handleCreateTrip} 
                                disabled={!canAddTrip}
                                className="bg-white text-indigo-600 hover:bg-white/90 font-bold rounded-xl gap-2 shadow-lg"
                            >
                                <Plus className="h-4 w-4" />
                                رحلة جديدة
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur rounded-xl">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                                    <DropdownMenuItem onClick={() => setShowGuideDialog(true)}>
                                        <BookOpen className="ml-2 h-4 w-4" />
                                        دليل الاستخدام
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setShowConfirmDialog(true)}>
                                        <Users className="ml-2 h-4 w-4" />
                                        التحويل لحساب مسافر
                                    </DropdownMenuItem>
                                    <Separator />
                                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                                        <LogOut className="ml-2 h-4 w-4" />
                                        تسجيل الخروج
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="relative z-10 grid grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                            <div className="text-white/70 text-sm">إجمالي الرحلات</div>
                            <div className="text-2xl font-black">{totalTrips}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                            <div className="text-white/70 text-sm">إجمالي الحجوزات</div>
                            <div className="text-2xl font-black">{totalBookings}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                            <div className="text-white/70 text-sm">قيد الانتظار</div>
                            <div className="text-2xl font-black text-yellow-300">{pendingBookings}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                            <div className="text-white/70 text-sm">الإيرادات</div>
                            <div className="text-2xl font-black">{totalRevenue.toLocaleString()} ج.م</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                            <div className="text-white/70 text-sm">المشاهدات</div>
                            <div className="text-2xl font-black">{totalViews}</div>
                        </div>
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

                {/* Main Content Area with Modern Layout */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar - Modern Navigation Cards */}
                    <aside className={cn(
                        "transition-all duration-300 relative",
                        sidebarCollapsed ? "lg:w-20" : "lg:w-80"
                    )}>
                        <Card className="rounded-3xl border-0 shadow-xl sticky top-24 overflow-hidden bg-white/80 backdrop-blur">
                            {/* Sidebar Toggle Button - Fixed positioning */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="absolute -left-3 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8 p-0 bg-white border shadow-md hover:bg-gray-50 z-10 hidden lg:flex"
                            >
                                {sidebarCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>

                            {/* Company Profile Summary - Only show when expanded */}
                            {!sidebarCollapsed && (
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16 rounded-2xl border-2 border-indigo-200">
                                            <AvatarImage src={settingsData.logo} />
                                            <AvatarFallback className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-xl">
                                                {settingsData.name?.charAt(0) || 'شركة'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-black text-gray-900">{settingsData.name || 'اسم الشركة'}</h3>
                                            <p className="text-sm text-gray-500">{settingsData.contactInfo.email || 'البريد الإلكتروني'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Items */}
                            <nav className="p-4 space-y-2">
                                {GUIDE_SECTIONS.map((tab, idx) => {
                                    const Icon = tab.icon;
                                    const badge = tab.id === 'bookings' ? pendingBookings : tab.id === 'contact' ? messagesUnreadCount : undefined;
                                    const isGuideHighlight = showGuideDialog && GUIDE_SECTIONS[guideStep]?.id === tab.id;
                                    
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                if (tab.id === 'contact') setMessagesUnreadCount(0);
                                                if (showGuideDialog) setGuideStep(idx);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all relative group",
                                                isGuideHighlight && "ring-2 ring-amber-400 ring-offset-2",
                                                activeTab === tab.id 
                                                    ? `bg-gradient-to-l ${tab.color} text-white shadow-lg` 
                                                    : "hover:bg-gray-100 text-gray-600"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                                                activeTab === tab.id ? "bg-white/20" : "bg-gray-100 group-hover:bg-white"
                                            )}>
                                                <Icon className={cn("w-4 h-4", activeTab === tab.id ? "text-white" : `text-${tab.color.split(' ')[0].replace('from-', '')}`)} />
                                            </div>
                                            {!sidebarCollapsed && (
                                                <>
                                                    <span className="flex-1 text-right">{tab.label}</span>
                                                    {badge ? (
                                                        <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-pulse shrink-0">
                                                            {badge}
                                                        </span>
                                                    ) : null}
                                                </>
                                            )}
                                            {/* Show badge as dot when collapsed */}
                                            {sidebarCollapsed && badge && (
                                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>

                            {/* Commission Info - Only show when expanded */}
                            {!sidebarCollapsed && (
                                <div className="p-4 mt-4 border-t border-gray-100">
                                    <div className="p-4 rounded-2xl bg-gradient-to-l from-orange-50 to-white border border-orange-100">
                                        <p className="text-xs font-bold text-orange-600 mb-2">نظام العمولات</p>
                                        <p className="text-xs text-gray-600">تطبق عمولة 5% على كل حجز ناجح</p>
                                        <Button variant="link" className="text-orange-600 p-0 h-auto text-xs font-black mt-2">اعرف المزيد</Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Guide Panel (if shown) */}
                        {showGuideDialog && (
                            <Card className="mb-6 rounded-3xl border-2 border-amber-200 shadow-xl bg-white overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-16 h-16 rounded-2xl bg-gradient-to-l flex items-center justify-center text-white",
                                                GUIDE_SECTIONS[guideStep]?.color
                                            )}>
                                                {(() => {
                                                    const Icon = GUIDE_SECTIONS[guideStep]?.icon;
                                                    return <Icon className="w-8 h-8" />;
                                                })()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-amber-600 mb-1">دليل الاستخدام</p>
                                                <h3 className="text-2xl font-black text-gray-900">{GUIDE_SECTIONS[guideStep]?.label}</h3>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowGuideDialog(false)}
                                            className="rounded-full"
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                    <p className="mt-4 text-gray-600 leading-relaxed">{GUIDE_SECTIONS[guideStep]?.text}</p>
                                    {GUIDE_SECTIONS[guideStep]?.actionIcons?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {GUIDE_SECTIONS[guideStep].actionIcons.map((item, i) => {
                                                const ActionIcon = item.icon;
                                                return (
                                                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                                                        <ActionIcon className="w-3.5 h-3.5" />
                                                        {item.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-gray-100">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const next = Math.max(0, guideStep - 1);
                                                setGuideStep(next);
                                                setActiveTab(GUIDE_SECTIONS[next].id);
                                                if (GUIDE_SECTIONS[next].id === 'contact') setMessagesUnreadCount(0);
                                            }}
                                            disabled={guideStep === 0}
                                            className="rounded-xl gap-2"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                            السابق
                                        </Button>
                                        <span className="text-sm font-bold text-gray-400">{guideStep + 1} / {GUIDE_SECTIONS.length}</span>
                                        <Button
                                            onClick={() => {
                                                if (guideStep >= GUIDE_SECTIONS.length - 1) {
                                                    setShowGuideDialog(false);
                                                    setGuideStep(0);
                                                    return;
                                                }
                                                const next = guideStep + 1;
                                                setGuideStep(next);
                                                setActiveTab(GUIDE_SECTIONS[next].id);
                                                if (GUIDE_SECTIONS[next].id === 'contact') setMessagesUnreadCount(0);
                                            }}
                                            className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            {guideStep >= GUIDE_SECTIONS.length - 1 ? 'إنهاء' : 'التالي'}
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Content Area */}
                        <Card className="rounded-3xl border-0 shadow-xl overflow-hidden bg-white">
                            {/* Hidden Tabs for functionality */}
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="hidden">
                                    {GUIDE_SECTIONS.map(section => (
                                        <TabsTrigger key={section.id} value={section.id}>{section.label}</TabsTrigger>
                                    ))}
                                </TabsList>

                                {/* Tab Contents */}
                                <TabsContent value="trips" className="p-6 m-0 focus-visible:outline-none">
                                    <>
                                        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-8">
                                            <div className="flex items-center gap-4">
                                                <h2 className="text-2xl font-black text-gray-900">إدارة الرحلات</h2>
                                                <Button variant="ghost" size="icon" onClick={handleRefreshTrips} className="rounded-full hover:bg-gray-100">
                                                    <RefreshCcw className={`w-5 h-5 ${tripsLoading ? 'animate-spin' : ''}`} />
                                                </Button>
                                            </div>
                                            
                                            {/* Search Bar */}
                                            <div className="relative w-full lg:w-96">
                                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <Input
                                                    placeholder="بحث عن رحلة..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pr-10 h-12 rounded-xl border-gray-200"
                                                />
                                            </div>

                                            <Badge variant="outline" className="rounded-full px-4 py-1 text-indigo-600 border-indigo-100 bg-indigo-50">
                                                {filteredTrips.length} رحلة
                                            </Badge>
                                        </div>

                                        {tripsLoading ? (
                                            <div className="text-center py-20">
                                                <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-600" />
                                            </div>
                                        ) : filteredTrips.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {filteredTrips.map(trip => (
                                                    <TripCardEnhanced 
                                                        key={trip.id} 
                                                        trip={trip} 
                                                        onEdit={handleEditTrip} 
                                                        onExport={handleExportTrip} 
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 text-gray-400">
                                                <Map className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                                <h3 className="text-xl font-bold text-gray-700">لا توجد رحلات</h3>
                                                <p className="mb-6">ابدأ بنشر رحلتك الأولى</p>
                                                <Button className="bg-indigo-600 text-white rounded-xl" onClick={handleCreateTrip}>
                                                    إضافة رحلة
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                </TabsContent>

                                <TabsContent value="bookings" className="p-6 m-0 focus-visible:outline-none">
                                    <>
                                        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-8">
                                            <div className="flex items-center gap-4">
                                                <h2 className="text-2xl font-black text-gray-900">طلبات الحجز</h2>
                                                {pendingBookings > 0 && (
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full border border-red-200">
                                                        <Bell className="w-4 h-4 text-red-600" />
                                                        <span className="text-xs font-bold text-red-700">{pendingBookings} طلب جديد</span>
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
                                                {pendingBookings > 0 && (
                                                    <div className="mb-6 p-6 bg-gradient-to-l from-indigo-50 to-white border border-indigo-100 rounded-3xl flex items-center justify-between shadow-sm">
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                                <Activity className="w-4 h-4 text-indigo-600" />
                                                                ملخص الطلبات الجديدة
                                                            </h3>
                                                            <p className="text-sm text-gray-500">
                                                                لديك <span className="font-bold text-indigo-600">{pendingBookings}</span> طلبات حجز قيد الانتظار
                                                            </p>
                                                        </div>
                                                        <div className="text-left">
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
                                    </>
                                </TabsContent>

                                <TabsContent value="seats" className="p-6 m-0 focus-visible:outline-none">
                                    <>
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <h2 className="text-2xl font-black text-gray-900">توزيع مقاعد الركاب</h2>
                                                <Button variant="ghost" size="icon" onClick={handleRefreshTrips} className="rounded-full hover:bg-gray-100">
                                                    <RefreshCcw className={`w-5 h-5 ${tripsLoading ? 'animate-spin' : ''}`} />
                                                </Button>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-400">اختر رحلة لتنظيم مقاعدها</p>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <div className="lg:col-span-1 space-y-4">
                                                <Input
                                                    placeholder="بحث عن رحلة..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="h-12 rounded-xl border-gray-200"
                                                />
                                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                                    {filteredTrips.map(trip => {
                                                        const totalCap = trip.transportations?.length > 0 
                                                            ? trip.transportations.reduce((sum: number, t: any) => sum + (t.capacity * (t.count || 1)), 0)
                                                            : (trip.transportationType === 'van-14' ? 14 : trip.transportationType === 'minibus-28' ? 28 : 48);
                                                        
                                                        return (
                                                            <button 
                                                                key={trip.id || trip._id}
                                                                onClick={() => setSelectedTripForSeats(trip)}
                                                                className={cn(
                                                                    "w-full p-4 rounded-2xl text-right transition-all border-2",
                                                                    selectedTripForSeats?.id === trip.id || selectedTripForSeats?._id === trip._id 
                                                                        ? 'border-indigo-600 bg-indigo-50 shadow-lg' 
                                                                        : 'border-gray-100 hover:border-gray-200 bg-white'
                                                                )}
                                                            >
                                                                <p className="font-black text-gray-900 mb-1">{trip.title}</p>
                                                                <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(trip.startDate).toLocaleDateString()}
                                                                    <span className="mx-1">•</span>
                                                                    <Bus className="w-3 h-3" />
                                                                    {totalCap} مقعد
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="lg:col-span-2">
                                                {selectedTripForSeats ? (
                                                    <Card className="p-8 border-gray-100 rounded-3xl shadow-xl bg-white">
                                                        <div className="w-full flex items-center justify-between mb-8">
                                                            <div>
                                                                <h3 className="text-xl font-black text-gray-900">{selectedTripForSeats.title}</h3>
                                                                <p className="text-xs font-bold text-gray-400 mt-1">
                                                                    اضغط على المقعد لتسجيل اسم المسافر
                                                                </p>
                                                            </div>
                                                            {isSavingSeats && <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />}
                                                        </div>

                                                        {/* Bus Selection Tabs */}
                                                        {selectedTripForSeats.transportations?.length > 0 && (
                                                            <div className="w-full mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-wrap gap-2">
                                                                {selectedTripForSeats.transportations.map((unit: any, idx: number) => (
                                                                    <Button
                                                                        key={idx}
                                                                        variant={currentBusIndex === idx ? "default" : "outline"}
                                                                        className={cn(
                                                                            "rounded-xl h-10 font-bold transition-all",
                                                                            currentBusIndex === idx ? "bg-indigo-600 text-white shadow-md" : "bg-white hover:border-indigo-200"
                                                                        )}
                                                                        onClick={() => setCurrentBusIndex(idx)}
                                                                    >
                                                                        <Bus className="w-4 h-4 ml-2" />
                                                                        {unit.type === 'bus-48' ? 'حافلة' : unit.type === 'minibus-28' ? 'ميني باص' : 'ميكروباص'} 
                                                                        {unit.count > 1 ? ` (${idx + 1})` : ''}
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        
                                                        <BusSeatLayout 
                                                            type={
                                                                selectedTripForSeats.transportations?.length > 0 
                                                                ? selectedTripForSeats.transportations[currentBusIndex].type 
                                                                : (selectedTripForSeats.transportationType || 'bus-48')
                                                            } 
                                                            bookedSeats={(selectedTripForSeats.seatBookings || []).filter((s: any) => (s.busIndex || 0) === currentBusIndex)}
                                                            isAdmin={true}
                                                            onSaveSeats={handleSaveSeats}
                                                            totalBookedPassengers={bookings.filter(b => (b.tripId as any) === (selectedTripForSeats._id || selectedTripForSeats.id) && b.status === 'accepted').length}
                                                            tripBookings={bookings.filter(b => (b.tripId as any) === (selectedTripForSeats._id || selectedTripForSeats.id) && b.status === 'accepted')}
                                                        />
                                                    </Card>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-gray-100 rounded-[3rem] text-gray-400">
                                                        <Bus className="w-16 h-16 opacity-20 mb-4" />
                                                        <p className="font-bold">اختر رحلة من القائمة لبدء توزيع المقاعد</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                </TabsContent>

                                <TabsContent value="coupons" className="p-6 m-0 focus-visible:outline-none">
                                    <>
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-2xl font-black text-gray-900">إدارة الكوبونات</h2>
                                        </div>
                                        <CouponManagement />
                                    </>
                                </TabsContent>

                                <TabsContent value="contact" className="p-6 m-0 focus-visible:outline-none">
                                    <CompanyChat onUnreadChange={setMessagesUnreadCount} />
                                </TabsContent>

                                <TabsContent value="reports" className="p-6 m-0 focus-visible:outline-none">
                                    <>
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-2xl font-black text-gray-900">التقارير والإحصائيات</h2>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" onClick={handleRefreshReports} className="rounded-full hover:bg-gray-100">
                                                    <RefreshCcw className="w-5 h-5" />
                                                </Button>
                                                <Button variant="outline" className="rounded-xl gap-2">
                                                    <Download className="w-4 h-4" />
                                                    تصدير
                                                </Button>
                                                <Button variant="outline" className="rounded-xl gap-2">
                                                    <Filter className="w-4 h-4" />
                                                    تصفية
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                <Card className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-white border-0 shadow-md">
                                                    <div className="text-emerald-600 text-sm font-bold mb-2">المحصل فعلياً</div>
                                                    <div className="text-2xl font-black text-emerald-700">{(stats?.revenue?.paid || 0).toLocaleString()} ج.م</div>
                                                    <p className="text-xs text-emerald-500 mt-2">+12% عن الشهر الماضي</p>
                                                </Card>
                                                <Card className="p-6 rounded-3xl bg-gradient-to-br from-orange-50 to-white border-0 shadow-md">
                                                    <div className="text-orange-600 text-sm font-bold mb-2">قيد التحصيل</div>
                                                    <div className="text-2xl font-black text-orange-700">{(stats?.revenue?.pending || 0).toLocaleString()} ج.م</div>
                                                </Card>
                                                <Card className="p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-white border-0 shadow-md">
                                                    <div className="text-blue-600 text-sm font-bold mb-2">الإجمالي المتوقع</div>
                                                    <div className="text-2xl font-black text-blue-700">{(stats?.revenue?.total || 0).toLocaleString()} ج.م</div>
                                                </Card>
                                                <Card className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-white border-0 shadow-md">
                                                    <div className="text-purple-600 text-sm font-bold mb-2">معدل التحويل</div>
                                                    <div className="text-2xl font-black text-purple-700">
                                                        {totalViews ? ((totalBookings / totalViews) * 100).toFixed(1) : 0}%
                                                    </div>
                                                </Card>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {/* Bookings Status Distribution */}
                                                <Card className="p-6 rounded-3xl border-gray-100 shadow-md">
                                                    <CardHeader className="px-0 pt-0">
                                                        <CardTitle className="text-lg font-bold">توزيع حالات الحجوزات</CardTitle>
                                                    </CardHeader>
                                                    <div className="h-[300px] w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={[
                                                                        { name: 'مقبول', value: acceptedBookings, color: '#10b981' },
                                                                        { name: 'قيد الانتظار', value: pendingBookings, color: '#f59e0b' },
                                                                        { name: 'مرفوض', value: bookings.filter(b => b.status === 'rejected').length, color: '#ef4444' },
                                                                        { name: 'ملغي', value: bookings.filter(b => b.status === 'cancelled').length, color: '#6b7280' },
                                                                    ].filter(d => d.value > 0)}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={60}
                                                                    outerRadius={80}
                                                                    paddingAngle={5}
                                                                    dataKey="value"
                                                                >
                                                                    {[
                                                                        { name: 'مقبول', value: acceptedBookings, color: '#10b981' },
                                                                        { name: 'قيد الانتظار', value: pendingBookings, color: '#f59e0b' },
                                                                        { name: 'مرفوض', value: bookings.filter(b => b.status === 'rejected').length, color: '#ef4444' },
                                                                        { name: 'ملغي', value: bookings.filter(b => b.status === 'cancelled').length, color: '#6b7280' },
                                                                    ].filter(d => d.value > 0).map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                                    ))}
                                                                </Pie>
                                                                <ReTooltip />
                                                                <Legend />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>

                                                {/* Payment Summary */}
                                                <Card className="p-6 rounded-3xl border-gray-100 shadow-md">
                                                    <CardHeader className="px-0 pt-0">
                                                        <CardTitle className="text-lg font-bold">حالة التحصيل المالي</CardTitle>
                                                    </CardHeader>
                                                    <div className="h-[300px] w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={[
                                                                        { name: 'مدفوع', value: stats?.revenue?.paid || 0, color: '#10b981' },
                                                                        { name: 'مطلوب تحصيله', value: stats?.revenue?.pending || 0, color: '#f59e0b' },
                                                                        { name: 'مسترجع', value: stats?.revenue?.refunded || 0, color: '#ef4444' },
                                                                    ].filter(d => d.value > 0)}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={60}
                                                                    outerRadius={80}
                                                                    paddingAngle={5}
                                                                    dataKey="value"
                                                                >
                                                                    {[
                                                                        { name: 'مدفوع', value: stats?.revenue?.paid || 0, color: '#10b981' },
                                                                        { name: 'مطلوب تحصيله', value: stats?.revenue?.pending || 0, color: '#f59e0b' },
                                                                        { name: 'مسترجع', value: stats?.revenue?.refunded || 0, color: '#ef4444' },
                                                                    ].filter(d => d.value > 0).map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                                    ))}
                                                                </Pie>
                                                                <ReTooltip />
                                                                <Legend />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>
                                            </div>

                                            {/* Trip Views vs Bookings */}
                                            <Card className="p-6 rounded-3xl border-gray-100 shadow-md">
                                                <CardHeader className="px-0 pt-0">
                                                    <CardTitle className="text-lg font-bold">المشاهدات مقابل الحجوزات</CardTitle>
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
                                            <Card className="p-6 rounded-3xl border-gray-100 shadow-md overflow-hidden">
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
                                                                <th className="pb-4 font-bold text-gray-500"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {myTrips.map(trip => {
                                                                const tripBookings = bookings.filter(b => String(b.tripId) === String(trip._id || trip.id));
                                                                const acceptedBookingsForTrip = tripBookings.filter(b => b.status === 'accepted');
                                                                const conversionRate = trip.views ? ((tripBookings.length / trip.views) * 100).toFixed(1) : 0;
                                                                const revenue = acceptedBookingsForTrip.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
                                                                
                                                                return (
                                                                    <tr key={trip.id || trip._id} className="hover:bg-gray-50">
                                                                        <td className="py-4 font-semibold">{trip.title}</td>
                                                                        <td className="py-4">{trip.views || 0}</td>
                                                                        <td className="py-4">{tripBookings.length}</td>
                                                                        <td className="py-4">
                                                                            <Badge variant="outline" className="text-indigo-600 bg-indigo-50 border-indigo-100">
                                                                                {conversionRate}%
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="py-4 font-bold text-emerald-600">{revenue.toLocaleString()} ج.م</td>
                                                                        <td className="py-4">
                                                                            <Button variant="ghost" size="sm" onClick={() => handleExportTrip(trip)}>
                                                                                <Download className="w-4 h-4" />
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Card>
                                        </div>
                                    </>
                                </TabsContent>

                                <TabsContent value="qr-scanner" className="p-6 m-0 focus-visible:outline-none">
                                    <>
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-2xl font-black text-gray-900">التحقق من رمز الحجز</h2>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Left Column: Scanner UI */}
                                            <Card className="p-8 border-gray-100 rounded-[2.5rem] shadow-xl bg-white flex flex-col items-center text-center overflow-hidden relative">
                                                <div className="w-full mb-6">
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2">امسح الكود الآن</h3>
                                                    <p className="text-sm text-gray-500">وجه الكاميرا نحو رمز QR الموجود في واجهة تطبيق المسافر</p>
                                                </div>

                                                <div className="relative w-full aspect-square max-w-[400px] bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden mb-8 group transition-all hover:bg-gray-100/50">
                                                    <div id="reader" className="w-full h-full object-cover"></div>
                                                    
                                                    {!isScanning && !qrResult && (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                                                            <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                                <QrCode className="w-10 h-10 text-indigo-600" />
                                                            </div>
                                                            <div className="space-y-4 w-full">
                                                                <Button 
                                                                    onClick={startScanner} 
                                                                    className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-100 gap-3"
                                                                >
                                                                    <Camera className="w-6 h-6" />
                                                                    فتح الكاميرا
                                                                </Button>
                                                                
                                                                <div className="flex items-center gap-4 py-2">
                                                                    <div className="h-px flex-1 bg-gray-200"></div>
                                                                    <span className="text-xs font-bold text-gray-400">أو</span>
                                                                    <div className="h-px flex-1 bg-gray-200"></div>
                                                                </div>

                                                                <label className="w-full h-14 rounded-2xl border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-black text-lg flex items-center justify-center gap-3 cursor-pointer transition-all">
                                                                    <Upload className="w-6 h-6" />
                                                                    رفع ملف QR
                                                                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {isScanning && (
                                                        <Button 
                                                            onClick={stopScanner} 
                                                            variant="destructive"
                                                            className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full px-6 h-12 font-black shadow-xl"
                                                        >
                                                            إغلاق الكاميرا
                                                        </Button>
                                                    )}
                                                </div>

                                                {scanError && (
                                                    <div className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                                                        <XCircle className="w-5 h-5 flex-shrink-0" />
                                                        <p className="text-sm font-bold text-right">{scanError}</p>
                                                    </div>
                                                )}
                                            </Card>

                                            {/* Right Column: Result UI */}
                                            <div className="space-y-6">
                                                {isValidating ? (
                                                    <Card className="p-12 border-gray-100 rounded-[2.5rem] shadow-xl bg-white flex flex-col items-center justify-center text-center h-full">
                                                        <Loader2 className="w-16 h-16 animate-spin text-indigo-600 mb-6" />
                                                        <h3 className="text-xl font-bold text-gray-900">جاري التحقق من صحة الكود...</h3>
                                                        <p className="text-gray-400 mt-2">يرجى الانتظار قليلاً</p>
                                                    </Card>
                                                ) : verifiedBooking ? (
                                                    <Card className="overflow-hidden border-border/50 rounded-[2.5rem] shadow-2xl bg-white animate-in zoom-in-95 duration-500">
                                                        <div className="p-8 bg-emerald-600 text-white relative">
                                                            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mt-16 blur-3xl"></div>
                                                            <div className="flex items-center gap-4 relative z-10">
                                                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-inner">
                                                                    <ShieldCheck className="w-10 h-10" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-2xl font-black">حجز صالح ومؤكد ✅</h3>
                                                                    <p className="text-emerald-100 font-bold opacity-80">
                                                                        {new Date(verifiedBooking.booking.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <CardContent className="p-8 space-y-6">
                                                            <div className="flex items-center gap-4 p-4 rounded-3xl bg-indigo-50/50 border border-indigo-100 mb-2">
                                                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                                                                    <img src={verifiedBooking.trip.images?.[0]} className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-indigo-400 uppercase">تفاصيل الرحلة</span>
                                                                    <span className="text-lg font-black text-gray-900 leading-tight">{verifiedBooking.trip.title}</span>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <MapPin className="w-3 h-3 text-gray-400" />
                                                                        <span className="text-xs text-gray-500 font-bold">{verifiedBooking.trip.destination}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">اسم المسافر</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <Users className="w-4 h-4 text-indigo-500" />
                                                                        <p className="text-lg font-black text-gray-900">{verifiedBooking.booking.userName}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">الحالة</p>
                                                                    <Badge className={cn(
                                                                        "h-8 px-4 font-black rounded-lg border-0",
                                                                        verifiedBooking.booking.status === 'accepted' ? "bg-emerald-100 text-emerald-600" :
                                                                        verifiedBooking.booking.status === 'pending' ? "bg-amber-100 text-amber-600" :
                                                                        "bg-rose-100 text-rose-600"
                                                                    )}>
                                                                        {verifiedBooking.booking.status === 'accepted' ? 'مؤكد' : 
                                                                         verifiedBooking.booking.status === 'pending' ? 'قيد الانتظار' : 'ملغي'}
                                                                    </Badge>
                                                                </div>
                                                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">عدد الركاب</p>
                                                                    <p className="text-2xl font-black text-indigo-600">{verifiedBooking.booking.numberOfPeople} <span className="text-sm">أفراد</span></p>
                                                                </div>
                                                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">رقم الحجز</p>
                                                                    <p className="text-lg font-black text-gray-900">{verifiedBooking.booking.bookingReference}</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">المبلغ الإجمالي</p>
                                                                    <p className="text-lg font-black text-emerald-600">{verifiedBooking.booking.totalPrice?.toLocaleString()} ج.م</p>
                                                                </div>
                                                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">طريقة الدفع</p>
                                                                    <p className="text-lg font-black text-gray-700">{verifiedBooking.booking.paymentMethod === 'cash' ? 'كاش (نقدي)' : 'بطاقة بنكية'}</p>
                                                                </div>
                                                            </div>

                                                            {verifiedBooking.booking.specialRequests && (
                                                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                                                                    <p className="text-xs text-amber-600 font-bold uppercase mb-2">طلبات خاصة</p>
                                                                    <p className="text-sm font-bold text-gray-700">{verifiedBooking.booking.specialRequests}</p>
                                                                </div>
                                                            )}

                                                            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="text-xs text-indigo-400 font-bold uppercase">المقاعد المخصصة</p>
                                                                    <Bus className="w-4 h-4 text-indigo-400" />
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {verifiedBooking.booking.selectedSeats?.length > 0 ? verifiedBooking.booking.selectedSeats.map((s: string) => (
                                                                        <Badge key={s} className="bg-indigo-600 text-white border-0 font-black px-4 py-2 rounded-xl text-sm shadow-sm">
                                                                            مقعد {s}
                                                                        </Badge>
                                                                    )) : (
                                                                        <Badge className="bg-gray-200 text-gray-600 border-0 font-black px-4 py-1.5 rounded-xl">
                                                                            غير محدد بعد
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-4">
                                                                <Button 
                                                                    onClick={() => { setVerifiedBooking(null); setQrResult(null); }}
                                                                    className="flex-1 h-14 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-black text-lg transition-all active:scale-95"
                                                                >
                                                                    مسح كود آخر
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-gray-100 rounded-[3rem] text-gray-300 text-center">
                                                        <QrCode className="w-20 h-20 opacity-10 mb-6" />
                                                        <h3 className="text-xl font-bold text-gray-400">في انتظار مسح الكود...</h3>
                                                        <p className="max-w-[250px] mt-2 text-sm">سيتم عرض بيانات المسافر وتفاصيل الحجز هنا فور مسح الرمز.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                </TabsContent>

                                <TabsContent value="settings" className="p-6 m-0 focus-visible:outline-none">
                                    <>
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
                                                                <Label htmlFor="tags">تصنيفات الرحلات</Label>
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
                                                            <div className="space-y-4">
                                                                <div className="flex flex-col gap-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label htmlFor="logo">شعار الشركة</Label>
                                                                        <div className="flex gap-2">
                                                                            <Input 
                                                                                type="file"
                                                                                id="logo-upload"
                                                                                className="hidden"
                                                                                accept="image/*"
                                                                                onChange={async (e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (!file) return;
                                                                                    
                                                                                    try {
                                                                                        setSavingSettings(true);
                                                                                        const token = await getToken();
                                                                                        const sigData = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:5000"}/api/trips/cloudinary-signature`, {
                                                                                            headers: { 'Authorization': `Bearer ${token}` }
                                                                                        }).then(res => res.json());

                                                                                        const formData = new FormData();
                                                                                        formData.append('file', file);
                                                                                        formData.append('api_key', sigData.apiKey);
                                                                                        formData.append('timestamp', sigData.timestamp.toString());
                                                                                        formData.append('signature', sigData.signature);
                                                                                        formData.append('folder', sigData.folder);

                                                                                        const response = await fetch(
                                                                                            `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
                                                                                            { method: 'POST', body: formData }
                                                                                        );
                                                                                        const data = await response.json();
                                                                                        setSettingsData({...settingsData, logo: data.secure_url});
                                                                                        toast({ title: "تم رفع الشعار", description: "سيتم حفظ الصورة عند الضغط على حفظ التغييرات" });
                                                                                    } catch (err) {
                                                                                        console.error("Upload error", err);
                                                                                        toast({ title: "فشل الرفع", description: "حدث خطأ أثناء رفع الشعار", variant: "destructive" });
                                                                                    } finally {
                                                                                        setSavingSettings(false);
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Label htmlFor="logo-upload" className="h-10 px-4 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-indigo-100 transition-colors">
                                                                                <Camera className="w-4 h-4 ml-2" /> رفع شعار جديد
                                                                            </Label>
                                                                        </div>
                                                                    </div>
                                                                    <Input 
                                                                        id="logo" 
                                                                        value={settingsData.logo} 
                                                                        onChange={(e) => setSettingsData({...settingsData, logo: e.target.value})}
                                                                        required 
                                                                        placeholder="رابط الشعار أو ارفعه..."
                                                                        className="h-12 rounded-xl"
                                                                    />
                                                                </div>
                                                                {settingsData.logo && (
                                                                    <div className="mt-4 p-6 border border-gray-100 rounded-[2rem] bg-gray-50/50 flex items-center justify-center animate-in zoom-in-95">
                                                                        <div className={cn("h-32 w-32 rounded-[2rem] bg-gradient-to-br flex items-center justify-center text-white overflow-hidden shadow-2xl p-2", settingsData.color)}>
                                                                            <img src={settingsData.logo} alt="Logo" className="w-full h-full object-cover rounded-[1.5rem]" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="space-y-2">
                                                                <Label>طابع الشركة اللوني *</Label>
                                                                <div className="grid grid-cols-6 gap-2">
                                                                    {GRADIENT_PRESETS.map((preset) => (
                                                                        <div 
                                                                            key={preset}
                                                                            className={cn(
                                                                                "h-10 rounded-lg bg-gradient-to-br cursor-pointer transition-all",
                                                                                preset,
                                                                                settingsData.color === preset ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'hover:opacity-80'
                                                                            )}
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
                                                                <Label htmlFor="website">الموقع الإلكتروني</Label>
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
                                                                <Label htmlFor="address">العنوان</Label>
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
                                                        <Button type="submit" disabled={savingSettings} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 rounded-xl shadow-xl text-lg">
                                                            {savingSettings ? (
                                                                <><Loader2 className="ml-2 h-5 w-5 animate-spin" /> جاري الحفظ...</>
                                                            ) : (
                                                                "حفظ التعديلات"
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </>
                                </TabsContent>
                            </Tabs>
                        </Card>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default CompanyDashboard;
