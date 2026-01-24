import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Menu, Trophy, Compass, Briefcase, Home, Plus, X, Sparkles, Globe, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { search } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/clerk-react";
import NotificationBell from "@/components/NotificationBell";
import { cn } from "@/lib/utils";

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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
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

  const NavItem = ({ to, icon: Icon, label, exact = false }: { to: string; icon: any; label: string; exact?: boolean }) => {
    const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link to={to} className="relative group flex flex-col items-center">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-500",
          isActive 
            ? "text-indigo-600 font-black bg-indigo-50/50" 
            : "text-gray-500 font-bold hover:text-indigo-600 hover:bg-gray-50/50"
        )}>
          <Icon className={cn("h-4.5 w-4.5 transition-transform duration-500", isActive ? "scale-110" : "group-hover:rotate-12")} />
          <span className="text-sm">{label}</span>
        </div>
        {isActive && (
          <motion.div 
            layoutId="header-active"
            className="absolute -bottom-1 w-1/2 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
          />
        )}
      </Link>
    );
  };

  return (
    <header className={cn(
      "sticky top-0 z-[100] w-full transition-all duration-500 font-cairo",
      scrolled 
        ? "bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-xl shadow-indigo-500/5 h-[4.5rem]" 
        : "bg-white border-b border-transparent h-24"
    )} dir="rtl">
      <div className="container mx-auto px-4 h-full">
        
        {/* Main Content Area */}
        <div className="flex items-center justify-between h-full gap-8">
          
          {/* 1. Logo Section */}
          <Link to="/" className="flex items-center flex-shrink-0 group relative">
            <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src={logo}
              alt="رحلتي"
              className="h-14 md:h-20 w-auto transition-all duration-700 group-hover:scale-105 group-hover:-rotate-3 object-contain relative z-10"
            />
          </Link>

          {/* 2. Navigation & Search (Centered Container) */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-6">
            
            {/* Nav Links */}
            <nav className="flex items-center gap-2">
              <NavItem to="/" icon={Home} label="الرئيسية" exact={true} />
              <NavItem to="/discover" icon={Sparkles} label="اكتشف" />
              <NavItem to="/timeline" icon={Compass} label="الرحلات" />
              <NavItem to="/templates" icon={Briefcase} label="الشركات" />
              <NavItem to="/leaderboard" icon={Trophy} label="المتصدرين" />
              {isAdmin && <NavItem to="/admin/dashboard" icon={Shield} label="لوحة التحكم" />}
            </nav>

            {/* Premium Search Bar */}
            <div className="relative w-full max-w-[320px]" ref={searchContainerRef}>
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
                      className="absolute top-full right-0 mt-3 w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-50 overflow-hidden z-50 py-2"
                    >
                      {isSearching ? (
                        <div className="p-8 text-center flex flex-col items-center gap-3">
                           <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                           <p className="text-sm font-black text-gray-400">نبحث لك عن الأفضل...</p>
                        </div>
                      ) : (searchResults.length > 0 || userResults.length > 0) ? (
                        <div className="max-h-[60vh] overflow-y-auto">
                          {searchResults.length > 0 && (
                            <div className="mb-2">
                              <span className="px-5 py-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">الرحلات الأكثر طلباً</span>
                              {searchResults.map((trip) => (
                                <button
                                  key={trip._id || trip.id}
                                  onClick={() => handleTripClick(String(trip._id || trip.id))}
                                  className="w-full px-5 py-3 hover:bg-indigo-50 transition-all flex items-center gap-4 text-right group/res"
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
                                  className="w-full px-5 py-3 hover:bg-orange-50 transition-all flex items-center gap-4 text-right"
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
          <div className="flex items-center gap-4 order-3">
            
            <div className="lg:hidden flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-colors" onClick={() => setMobileSearchOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            </div>

            <SignedIn>
              <NotificationBell />
              
              <Link to="/trips/new" className="hidden sm:block">
                <Button className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm gap-2 shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all duration-300">
                  <Plus className="h-5 w-5" />
                  أنشئ رحلة
                </Button>
              </Link>

              <div className="group relative flex items-center gap-3 pl-1 pr-4 py-1.5 rounded-2xl bg-gray-50/50 hover:bg-indigo-50 transition-all cursor-pointer border border-transparent hover:border-indigo-100/50" onClick={handleUserButtonClick}>
                <div className="text-right hidden md:block">
                  <p className="text-[10px] font-black text-indigo-400 leading-none mb-1">المسافر</p>
                  <p className="text-xs font-black text-gray-700 leading-none">{user?.firstName}</p>
                </div>
                <div className="h-10 w-10 rounded-xl overflow-hidden shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">
                  <img src={user?.imageUrl} alt="Profile" className="h-full w-full object-cover" />
                </div>
              </div>
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
              <SheetContent side="right" className="w-80 font-cairo" dir="rtl">
                <SheetHeader className="text-right mb-8">
                  <SheetTitle className="text-2xl font-black">القائمة</SheetTitle>
                </SheetHeader>
                <nav className="space-y-2">
                  {[
                    { to: "/", icon: Home, label: "الرئيسية" },
                    { to: "/discover", icon: Sparkles, label: "اكتشف" },
                    { to: "/timeline", icon: Compass, label: "الرحلات" },
                    { to: "/templates", icon: Briefcase, label: "الشركات" },
                    { to: "/leaderboard", icon: Trophy, label: "المتصدرين" },
                  ].map((item, idx) => (
                    <Link key={idx} to={item.to} className="flex items-center gap-4 p-4 rounded-2xl text-gray-500 font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                      <item.icon className="h-6 w-6" />
                      {item.label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link to="/admin/dashboard" className="flex items-center gap-4 p-4 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 transition-all">
                      <Shield className="h-6 w-6" />
                      لوحة التحكم
                    </Link>
                  )}
                  
                  <div className="pt-8 mt-8 border-t border-gray-100">
                    <SignedIn>
                       <Link to="/trips/new">
                        <Button className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center gap-3">
                          <Plus className="h-5 w-5" />
                          ابدأ رحلة جديدة
                        </Button>
                       </Link>
                    </SignedIn>
                  </div>
                </nav>
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
            className="fixed inset-0 bg-white z-[200] p-6 lg:hidden"
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
                    className="h-14 pr-12 rounded-2xl bg-gray-50 border-0 font-black"
                  />
               </div>
               <Button variant="ghost" size="icon" onClick={() => setMobileSearchOpen(false)} className="h-14 w-14 rounded-2xl bg-gray-50">
                  <X className="h-6 w-6" />
               </Button>
            </div>
            {/* Mobile Results */}
            <div className="overflow-y-auto h-full pb-20">
               {isSearching ? (
                 <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" /></div>
               ) : (searchResults.length > 0 || userResults.length > 0) ? (
                 <div className="space-y-8">
                  {searchResults.map(trip => (
                    <div key={trip.id} onClick={() => handleTripClick(trip.id)} className="flex items-center gap-4 active:scale-95 transition-transform">
                       <div className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-50"><img src={trip.image} className="w-full h-full object-cover" /></div>
                       <div><p className="font-black text-gray-900">{trip.title}</p><p className="text-sm text-indigo-500 font-bold">{trip.destination}</p></div>
                    </div>
                  ))}
                 </div>
               ) : <p className="text-center text-gray-400 font-bold py-12">ابدأ الكتابة للبحث عن مغامرتك...</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
