import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Menu, Trophy, Compass, Briefcase, Home, Plus, X, Sparkles, Globe, Shield, Bell, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { search, getUserById } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignedIn, SignedOut, SignInButton, useUser, SignOutButton } from "@clerk/clerk-react";
import NotificationBell from "@/components/NotificationBell";
import { cn } from "@/lib/utils";
import { seasonalConfig } from "@/config/seasonalConfig";
import { Moon, Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const logo = "/assets/logo.png";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

const Header = ({ onSearch }: HeaderProps) => {
  const { user } = useUser();
  const [searchValue, setSearchValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();

  const fetchDbUser = async () => {
    if (user?.id) {
      try {
        const userData = await getUserById(user.id);
        setDbUser(userData);
      } catch (error) {
        console.error("Error fetching user data for header:", error);
      }
    } else {
      setDbUser(null);
    }
  };

  // Fetch DB user data to get custom profile image
  useEffect(() => {
    fetchDbUser();

    // Listen for custom profile update event
    const handleUpdate = (event: any) => {
      if (event.detail) {
        // Update state directly with the new data passed in the event
        setDbUser((prev: any) => ({ ...prev, ...event.detail }));
      } else {
        // Fallback to fetching if no detail is provided
        fetchDbUser();
      }
    };

    window.addEventListener('userProfileUpdated', handleUpdate);
    return () => window.removeEventListener('userProfileUpdated', handleUpdate);
  }, [user?.id]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if user is admin
  const isAdmin = user?.emailAddresses?.some(email => email.emailAddress === 'supermincraft52@gmail.com');

  const handleUserButtonClick = () => {
    if (user?.id) navigate(`/user/${user.id}`);
  };

  const handleSearch = async (value: string) => {
    setSearchValue(value);
    onSearch?.(value);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!value.trim()) {
      setSearchResults([]);
      setUserResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await search(value, 5);
        setSearchResults(results.trips || []);
        setUserResults(results.users || []);
      } catch (error) {
        setSearchResults([]);
        setUserResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSearchSubmit = () => {
    if (searchValue.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchValue.trim())}`);
      setShowDropdown(false);
      setMobileSearchOpen(false);
    }
  };

  const handleTripClick = (tripId: string) => {
    navigate(`/trips/${tripId}`);
    setShowDropdown(false);
    setMobileSearchOpen(false);
    setSearchValue("");
  };

  const handleUserClick = (clerkId: string) => {
    navigate(`/user/${clerkId}`);
    setShowDropdown(false);
    setMobileSearchOpen(false);
    setSearchValue("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (mobileSearchOpen && mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node) && !(event.target as Element).closest('button[data-mobile-search-trigger]')) {
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileSearchOpen]);

  const NavItem = ({ to, icon: Icon, label, exact = false, id }: { to: string; icon: any; label: string; exact?: boolean; id?: string }) => {
    const isExternal = to.startsWith('http');
    const isActive = !isExternal && (exact ? location.pathname === to : location.pathname.startsWith(to));
    
    const content = (
        <div className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 relative z-10",
          isActive 
            ? "text-indigo-600 font-black bg-indigo-50/60" 
            : "text-gray-500 font-bold hover:text-indigo-600 hover:bg-gray-50/50"
        )}>
          <Icon className={cn("h-4.5 w-4.5 transition-all duration-300", 
            isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(79,70,229,0.3)]" : "group-hover:translate-y-[-2px]"
          )} />
          <span className="text-sm">{label}</span>
          {isActive && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/3 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" />
          )}
        </div>
    );

    if (isExternal) {
      return (
        <a href={to} className="relative group px-1 flex flex-col items-center justify-center">
          {content}
        </a>
      );
    }

    return (
      <Link to={to} id={id} className="relative group px-1 flex flex-col items-center justify-center">
        {content}
      </Link>
    );
  };

  return (
    <>
    <header className={cn(
      "fixed top-0 z-40 w-full transition-all duration-500 font-cairo",
      scrolled 
        ? "bg-white/70 backdrop-blur-2xl border-b border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.04)] h-[4.5rem] lg:h-[5rem]" 
        : "bg-white border-b border-transparent h-20 lg:h-24"
    )} dir="rtl">
      <div className="container mx-auto px-4 h-full">
        
        {/* Main Content Area */}
        <div className="flex items-center justify-between h-full gap-4 xl:gap-8 sticky top-0 z-40">
          
          {/* 1. Logo Section */}
          <Link to="/" className="flex items-center flex-shrink-0 group relative transition-all duration-500">
            <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src={logo}
              alt="رحلتي"
              width="80"
              height="80"
              fetchPriority="high"
              className={cn(
                "w-auto transition-all duration-500 group-hover:scale-125 group-hover:-rotate-3 object-contain relative z-10",
                scrolled ? "h-12 md:h-16" : "h-14 md:h-20"
              )}
            />
            {seasonalConfig.isRamadanTheme && (
              <motion.div 
                className="absolute -top-1 -right-4 text-gold opacity-80"
                animate={{ rotate: [-20, 20, -20], scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Moon size={18} fill="#D4AF37" />
              </motion.div>
            )}
          </Link>

          {/* 2. Navigation & Search (Centered Container) */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-2 xl:gap-6">
            
            {/* Nav Links */}
            <nav className="flex items-center gap-1">
              <NavItem to="/" icon={Home} label="الرئيسية" exact={true} id="nav-home" />
              <NavItem to="/discover" icon={Sparkles} label="اكتشف" id="nav-discover" />
              <NavItem to="/timeline" icon={Compass} label="الرحلات" id="nav-timeline" />
              <NavItem to="/agency" icon={Briefcase} label="الشركات" id="nav-templates" />
              <NavItem to="/leaderboard" icon={Trophy} label="المتصدرين" id="nav-leaderboard" />
              {seasonalConfig.isRamadanTheme && (
                <motion.div 
                  className="px-2"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Star size={14} fill="#D4AF37" color="#D4AF37" />
                </motion.div>
              )}
            </nav>

            {/* Premium Search Bar */}
            <div className="relative w-full lg:max-w-[200px] xl:max-w-[280px]" ref={searchContainerRef}>
              <div className="relative group">
                <Input
                  type="text"
                  placeholder="ابحث عن مغامرتك..."
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => { if (searchValue.trim()) setShowDropdown(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                  className="w-full h-11 px-12 bg-gray-50/80 border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm placeholder:text-gray-400 text-right"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                
                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {showDropdown && searchValue.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-3 w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/20 overflow-hidden z-50 py-2"
                    >
                      {isSearching ? (
                        <div className="p-8 text-center flex flex-col items-center gap-3">
                           <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                           <p className="text-sm font-black text-gray-400">نبحث لك عن الأفضل...</p>
                        </div>
                      ) : (searchResults.length > 0 || userResults.length > 0) ? (
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                          {searchResults.length > 0 && (
                            <div className="mb-2">
                              <span className="px-5 py-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">الرحلات الأكثر طلباً</span>
                              {searchResults.map((trip) => (
                                <button
                                  key={trip._id || trip.id}
                                  onClick={() => handleTripClick(String(trip._id || trip.id))}
                                  className="w-full px-5 py-3 hover:bg-indigo-50/50 transition-all flex items-center gap-4 text-right group/res"
                                >
                                  <div className="h-12 w-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 shadow-inner group-hover/res:scale-110 transition-transform">
                                    {trip.image ? <img src={trip.image} className="h-full w-full object-cover" /> : <MapPin className="h-6 w-6 m-auto text-gray-300" />}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-black text-gray-800 truncate">{trip.title}</p>
                                    <p className="text-xs text-indigo-500 font-bold">{trip.destination || trip.city}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          {userResults.length > 0 && (
                            <div className="pt-2 border-t border-gray-50">
                              <span className="px-5 py-2 text-[10px] font-black text-orange-400 uppercase tracking-widest">المستكشفون</span>
                              {userResults.map((u) => (
                                <button
                                  key={u.clerkId}
                                  onClick={() => handleUserClick(u.clerkId)}
                                  className="w-full px-5 py-3 hover:bg-orange-50/50 transition-all flex items-center gap-4 text-right"
                                >
                                  <div className="h-10 w-10 rounded-full bg-orange-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                                    {u.imageUrl ? <img src={u.imageUrl} className="h-full w-full object-cover" /> : <span className="m-auto font-black text-orange-600">{u.fullName?.[0]}</span>}
                                  </div>
                                  <p className="text-sm font-black text-gray-800">{u.fullName || u.username}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-10 text-center space-y-3">
                           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                              <Search className="h-8 w-8 text-gray-200" />
                           </div>
                           <p className="text-sm font-black text-gray-400">لم نجد ما تبحث عنه، جرب كلمات أخرى</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* 3. Action Buttons & Profile */}
          <div className="flex items-center gap-1 order-3">
            
            <div className="lg:hidden flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-colors" onClick={() => setMobileSearchOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            </div>

            <SignedIn>
              <Link to="/messages" className="hidden sm:block" id="nav-messages">
                <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-colors relative">
                   <MessageSquare className="h-5 w-5" />
                   {/* We can add unread badge logic here later if we want */}
                </Button>
              </Link>
              <NotificationBell />
              
              {isAdmin ? (
                <Link to="/admin/dashboard" className="hidden sm:block" id="nav-admin-dashboard">
                  <Button className="h-12 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm gap-2 shadow-lg shadow-rose-100 hover:shadow-rose-200 transition-all duration-300 relative overflow-hidden group">
                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Shield className="h-5 w-5 relative z-10" />
                    <span className="relative z-10">لوحة الإدارة</span>
                  </Button>
                </Link>
              ) : user?.publicMetadata?.role === 'company_owner' ? (
                <Link to="/company/dashboard" className="hidden sm:block" id="nav-company-dashboard">
                  <Button className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm gap-2 shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all duration-300 relative overflow-hidden group">
                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Shield className="h-5 w-5 relative z-10" />
                    <span className="relative z-10">لوحة الشركة</span>
                  </Button>
                </Link>
              ) : (
                <Link to="/trips/new" className="hidden sm:block" id="nav-create-trip">
                  <Button className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm gap-2 shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all duration-300 relative overflow-hidden group">
                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Plus className="h-5 w-5 relative z-10 shrink-0" />
                    <span className="relative z-10 hidden xl:inline">أنشئ رحلة</span>
                  </Button>
                </Link>
              )}
              
              {user && user.publicMetadata?.role !== 'company_owner' && !isAdmin && (
                <Link to={`/user/${user.id}`} className="hidden md:flex items-center gap-3 pl-1 pr-4 py-1 rounded-2xl bg-gray-50/50 border border-gray-100/50 hover:bg-indigo-50 transition-all group">
                  <div className="text-right hidden xl:block">
                    <p className="text-[10px] font-black text-indigo-500 leading-none mb-1">مرحباً بك</p>
                    <p className="text-xs font-black text-gray-700 leading-none truncate max-w-[100px]">{user.fullName || user.username}</p>
                  </div>
                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                    <AvatarImage src={dbUser?.imageUrl || user.imageUrl} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold text-xs">
                      {user.firstName?.charAt(0) || user.username?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              )}
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <Button className="h-12 px-8 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-sm transition-all shadow-xl shadow-gray-200">
                  انضم إلينا
                </Button>
              </SignInButton>
            </SignedOut>

            {/* Mobile Sidebar */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-12 w-12 rounded-2xl bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 font-cairo p-0 border-0" dir="rtl">
                <div className="h-full bg-white flex flex-col pt-12">
                  <SheetHeader className="text-right px-8 mb-8 border-b border-gray-50 pb-6">
                    <SheetTitle className="text-3xl font-black bg-gradient-to-l from-indigo-600 to-purple-600 bg-clip-text text-transparent">القائمة</SheetTitle>
                  </SheetHeader>
                  <nav className="flex-1 px-4 space-y-2">
                    {[
                      { to: "/", icon: Home, label: "الرئيسية" },
                      { to: "/discover", icon: Sparkles, label: "اكتشف" },
                      { to: "/timeline", icon: Compass, label: "الرحلات" },
                      { to: "/agency", icon: Briefcase, label: "الشركات" },
                      { to: "/leaderboard", icon: Trophy, label: "المتصدرين" },
                      { to: "/messages", icon: MessageSquare, label: "الرسائل" },
                    ].map((item, idx) => {
                      const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
                      return (
                        <Link 
                          key={idx} 
                          to={item.to} 
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300",
                            isActive 
                              ? "bg-indigo-50 text-indigo-600 font-black shadow-sm" 
                              : "text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <item.icon className={cn("h-6 w-6", isActive ? "scale-110" : "")} />
                          <span className="text-lg">{item.label}</span>
                        </Link>
                      );
                    })}
                  {isAdmin && (
                      <Link to="/admin/dashboard" className="flex items-center gap-4 p-4 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 transition-all mt-4 border border-rose-100/50">
                        <Shield className="h-6 w-6" />
                        <span className="text-lg">لوحة التحكم</span>
                      </Link>
                    )}
                  </nav>
                  
                  <div className="p-8 border-t border-gray-100">
                    <SignedIn>
                       <div className="px-4 py-2 mb-2 border-b border-gray-50">
                          {user && user.publicMetadata?.role !== 'company_owner' && !isAdmin && (
                            <Link 
                              to={`/user/${user.id}`} 
                              className="flex items-center gap-4 p-4 rounded-2xl text-indigo-600 font-black bg-indigo-50 shadow-sm"
                            >
                              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                <AvatarImage src={dbUser?.imageUrl || user.imageUrl} />
                                <AvatarFallback className="bg-white text-indigo-600 uppercase">
                                  {user.firstName?.charAt(0) || user.username?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-lg leading-tight">{user.fullName || user.username}</span>
                                <span className="text-[10px] font-bold text-indigo-400">عرض الملف الشخصي</span>
                              </div>
                            </Link>
                          )}
                       </div>
                       
                       {isAdmin ? (
                        <Link to="/admin/dashboard">
                          <Button className="w-full h-15 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black flex items-center justify-center gap-3 shadow-xl shadow-rose-100 transition-all active:scale-95">
                            <Shield className="h-5 w-5" />
                            لوحة الإدارة
                          </Button>
                        </Link>
                       ) : user?.publicMetadata?.role === 'company_owner' ? (
                         <Link to="/company/dashboard">
                          <Button className="w-full h-15 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                            <Shield className="h-5 w-5" />
                            لوحة الشركة
                          </Button>
                         </Link>
                       ) : (
                         <Link to="/trips/new">
                          <Button className="w-full h-15 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                            <Plus className="h-5 w-5" />
                            ابدأ رحلة جديدة
                          </Button>
                         </Link>
                       )}
                    </SignedIn>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[6000] p-6 lg:hidden"
          >
            <div className="flex items-center gap-3 mb-8">
               <div className="flex-1 relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                  <Input
                    autoFocus
                    placeholder="ابحث عن رحلة..."
                    value={searchValue}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                    className="h-14 pr-12 rounded-2xl bg-gray-50 border-0 font-black focus:ring-2 focus:ring-indigo-500/20"
                  />
               </div>
               <Button variant="ghost" size="icon" onClick={() => setMobileSearchOpen(false)} className="h-14 w-14 rounded-2xl bg-gray-50 hover:bg-gray-100">
                  <X className="h-6 w-6" />
               </Button>
            </div>
            {/* Mobile Results */}
            <div className="overflow-y-auto h-[calc(100vh-180px)] custom-scrollbar">
               {isSearching ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="font-black text-gray-400">نبحث لك عن الأفضل...</p>
                 </div>
               ) : (searchResults.length > 0 || userResults.length > 0) ? (
                 <div className="space-y-8">
                  {searchResults.map(trip => (
                    <div key={trip.id} onClick={() => handleTripClick(trip.id)} className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl active:scale-95 transition-all border border-transparent active:border-indigo-100">
                       <div className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-50 shadow-sm flex-shrink-0">
                          {trip.image ? <img src={trip.image} className="w-full h-full object-cover" /> : <MapPin className="m-auto h-6 w-6 text-indigo-300" />}
                       </div>
                       <div className="flex-1">
                          <p className="font-black text-gray-900 leading-tight mb-1">{trip.title}</p>
                          <p className="text-sm text-indigo-500 font-bold">{trip.destination || trip.city}</p>
                       </div>
                    </div>
                  ))}
                  {userResults.map(u => (
                    <div key={u.clerkId} onClick={() => handleUserClick(u.clerkId)} className="flex items-center gap-4 bg-orange-50/50 p-4 rounded-3xl active:scale-95 transition-all">
                       <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                          <img src={u.imageUrl} className="w-full h-full object-cover" />
                       </div>
                       <p className="font-black text-gray-900">{u.fullName || u.username}</p>
                    </div>
                  ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                       <Search className="w-10 h-10 text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-bold">ابدأ الكتابة للبحث عن مغامرتك...</p>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    {/* Spacer so fixed header does not hide first section on any page */}
    <div aria-hidden="true" className="h-20 lg:h-24 flex-shrink-0" />
    </>
  );
};

export default Header;
