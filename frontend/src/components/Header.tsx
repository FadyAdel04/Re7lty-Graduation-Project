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
          "flex items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all duration-300 relative z-10",
          isActive 
            ? "text-indigo-600 font-black bg-indigo-50/60" 
            : "text-gray-500 font-bold hover:text-indigo-600 hover:bg-gray-50/50"
        )}>
          <Icon className={cn("h-4 w-4 transition-all duration-300", 
            isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(79,70,229,0.3)]" : "group-hover:translate-y-[-2px]"
          )} />
          <span className="text-xs">{label}</span>
          {isActive && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/3 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" />
          )}
        </div>
    );

    if (isExternal) {
      return (
        <a href={to} className="relative group px-0.5 flex flex-col items-center justify-center">
          {content}
        </a>
      );
    }

    return (
      <Link to={to} id={id} className="relative group px-0.5 flex flex-col items-center justify-center">
        {content}
      </Link>
    );
  };

  return (
    <>
    <header className={cn(
      "fixed top-0 z-40 w-full transition-all duration-500 font-cairo",
      scrolled 
        ? "bg-white/70 backdrop-blur-2xl border-b border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.04)] h-[5rem] sm:h-[5.25rem] lg:h-[5.5rem]" 
        : "bg-white border-b border-transparent h-[5.5rem] sm:h-24 lg:h-[6.5rem]"
    )} dir="rtl">
      <div className="container mx-auto px-3 sm:px-4 h-full">
        
        {/* Main Content Area */}
        <div className="flex items-center justify-between h-full gap-2 sm:gap-4 xl:gap-8 min-w-0 sticky top-0 z-40">
          
          {/* 1. Logo Section */}
          <Link to="/" className="flex items-center flex-shrink-0 group relative transition-all duration-500">
            <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src={logo}
              alt="رحلتي"
              width="100"
              height="100"
              loading="eager"
              decoding="async"
              className={cn(
                "w-auto transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 object-contain relative z-10",
                scrolled ? "h-14 sm:h-16 md:h-20" : "h-16 sm:h-20 md:h-24"
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
          <div className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-2 min-w-0">
            
            {/* Nav Links */}
            <nav className="flex items-center gap-0.5 shrink-0">
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

            {/* Premium Search Bar - wider for normal users */}
            <div className="relative w-full flex-1 lg:max-w-[280px] xl:max-w-[360px] 2xl:max-w-[420px]" ref={searchContainerRef}>
              <div className="relative group">
                <Input
                  type="text"
                  placeholder="ابحث عن مغامرتك..."
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => { if (searchValue.trim()) setShowDropdown(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                  className="w-full h-10 sm:h-11 pl-4 pr-11 sm:pr-12 text-sm sm:text-base font-bold text-gray-900 placeholder:text-gray-500 min-w-0 bg-gray-50/80 border-gray-100 rounded-xl sm:rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all shadow-sm text-right"
                />
                <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none shrink-0" aria-hidden="true" />
                
                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {showDropdown && searchValue.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-3 w-full bg-gray-50/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/20 overflow-hidden z-50 py-2"
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
                  <Button className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs gap-1.5 shadow-lg">
                    <Shield className="h-4 w-4 shrink-0" />
                    <span>لوحة الإدارة</span>
                  </Button>
                </Link>
              ) : user?.publicMetadata?.role === 'company_owner' ? (
                <Link to="/company/dashboard" className="hidden sm:block" id="nav-company-dashboard">
                  <Button className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs gap-1.5 shadow-lg">
                    <Shield className="h-4 w-4 shrink-0" />
                    <span>لوحة الشركة</span>
                  </Button>
                </Link>
              ) : (
                <Link to="/trips/new" className="hidden sm:block" id="nav-create-trip">
                  <Button className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs gap-1.5 shadow-lg">
                    <Plus className="h-4 w-4 shrink-0" />
                    <span className="hidden lg:inline">أنشئ رحلة</span>
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
              <SheetContent side="right" className="w-80 font-cairo p-0 border-0 flex flex-col" dir="rtl">
                <div className="flex-1 min-h-0 flex flex-col pt-12 overflow-hidden">
                  <SheetHeader className="text-right px-8 mb-4 border-b border-gray-50 pb-4 shrink-0">
                    <SheetTitle className="text-3xl font-black bg-gradient-to-l from-indigo-600 to-purple-600 bg-clip-text text-transparent">القائمة</SheetTitle>
                  </SheetHeader>
                  <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-1">
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
                            "flex items-center gap-4 p-3 rounded-2xl transition-all duration-300",
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
                      <Link to="/admin/dashboard" className="flex items-center gap-4 p-3 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 transition-all mt-2 border border-rose-100/50" onClick={() => document.dispatchEvent(new CustomEvent('sheet-close'))}>
                        <Shield className="h-5 w-5" />
                        <span className="text-base">لوحة التحكم</span>
                      </Link>
                    )}
                  </nav>
                  
                  <div className="p-4 border-t border-gray-100 shrink-0 bg-white">
                    <SignedIn>
                       <div className="px-2 py-2 mb-2 border-b border-gray-50">
                          {user && user.publicMetadata?.role !== 'company_owner' && !isAdmin && (
                            <Link 
                              to={`/user/${user.id}`} 
                              className="flex items-center gap-3 p-3 rounded-2xl text-indigo-600 font-black bg-indigo-50 shadow-sm"
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
                        <Link to="/admin/dashboard" onClick={() => document.dispatchEvent(new CustomEvent('sheet-close'))}>
                          <Button className="w-full h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black flex items-center justify-center gap-2 shadow-lg">
                            <Shield className="h-5 w-5" />
                            لوحة الإدارة
                          </Button>
                        </Link>
                       ) : user?.publicMetadata?.role === 'company_owner' ? (
                         <Link to="/company/dashboard" onClick={() => document.dispatchEvent(new CustomEvent('sheet-close'))}>
                          <Button className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black flex items-center justify-center gap-2 shadow-lg">
                            <Shield className="h-5 w-5" />
                            لوحة الشركة
                          </Button>
                         </Link>
                       ) : (
                         <Link to="/trips/new" onClick={() => document.dispatchEvent(new CustomEvent('sheet-close'))}>
                          <Button className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black flex items-center justify-center gap-2 shadow-lg">
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

      {/* Mobile Search Overlay - always light bg, dark text for readability */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mobile-search-overlay fixed inset-0 bg-white z-[6000] p-4 sm:p-6 lg:hidden"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
               <div className="flex-1 min-w-0 relative">
                  <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500 pointer-events-none" />
                  <Input
                    autoFocus
                    placeholder="ابحث عن رحلة..."
                    value={searchValue}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                    className="mobile-search-input h-12 sm:h-14 pl-4 pr-12 sm:pr-14 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100 text-gray-900 placeholder:text-gray-500 text-base font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50"
                  />
               </div>
               <Button variant="ghost" size="icon" onClick={() => setMobileSearchOpen(false)} className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 shrink-0">
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
               </Button>
            </div>
            {/* Mobile Results - same design as desktop dropdown */}
            <div className="mobile-search-results overflow-y-auto h-[calc(100vh-160px)] sm:h-[calc(100vh-180px)] custom-scrollbar bg-gray-50/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/20 py-2">
               {isSearching ? (
                 <div className="p-8 text-center flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-sm font-black text-gray-400">نبحث لك عن الأفضل...</p>
                 </div>
               ) : (searchResults.length > 0 || userResults.length > 0) ? (
                 <div className="max-h-full overflow-y-auto">
                  {searchResults.length > 0 && (
                    <div className="mb-2">
                      <span className="px-5 py-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">الرحلات الأكثر طلباً</span>
                      {searchResults.map(trip => (
                        <button
                          key={trip._id || trip.id}
                          type="button"
                          onClick={() => handleTripClick(String(trip._id || trip.id))}
                          className="w-full px-5 py-3 hover:bg-indigo-50/50 active:bg-indigo-50 transition-all flex items-center gap-4 text-right"
                        >
                          <div className="h-12 w-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 shadow-inner">
                            {trip.image ? <img src={trip.image} alt="" className="h-full w-full object-cover" /> : <MapPin className="h-6 w-6 m-auto text-gray-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
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
                      {userResults.map(u => (
                        <button
                          key={u.clerkId}
                          type="button"
                          onClick={() => handleUserClick(u.clerkId)}
                          className="w-full px-5 py-3 hover:bg-orange-50/50 active:bg-orange-50 transition-all flex items-center gap-4 text-right"
                        >
                          <div className="h-10 w-10 rounded-full bg-orange-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                            {u.imageUrl ? <img src={u.imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center font-black text-orange-600 text-sm">{u.fullName?.[0]}</span>}
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
                    <p className="text-sm font-black text-gray-400">ابدأ الكتابة للبحث عن مغامرتك</p>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    {/* Spacer so fixed header does not hide first section on any page */}
    <div aria-hidden="true" className="h-[5.5rem] sm:h-24 lg:h-[6.5rem] flex-shrink-0" />
    </>
  );
};

export default Header;
