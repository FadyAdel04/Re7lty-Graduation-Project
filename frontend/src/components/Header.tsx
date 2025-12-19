import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Menu, Trophy, Compass, Briefcase, Home, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useLocation } from "react-router-dom";
const logo = "/assets/logo.png";
import { search } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import NotificationBell from "@/components/NotificationBell";

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
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const location = useLocation();

  const handleUserButtonClick = () => {
    if (user?.id) {
      navigate(`/user/${user.id}`);
    }
  };

  const handleSearch = async (value: string) => {
    setSearchValue(value);
    onSearch?.(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

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
        console.error('Search error:', error);
        setSearchResults([]);
        setUserResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
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
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
      
      // Close mobile search if clicking outside
      if (
        mobileSearchOpen &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('button[data-mobile-search-trigger]')
      ) {
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [mobileSearchOpen]);

  const NavItem = ({ to, icon: Icon, label, exact = false }: { to: string; icon: any; label: string; exact?: boolean }) => {
    const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link to={to} className="relative group px-1">
        <div className={`
          flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300
          ${isActive 
            ? "text-orange-600 font-bold bg-orange-50" 
            : "text-[#333] hover:text-orange-600 hover:bg-gray-50/50"
          }
        `}>
          <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
          <span className="text-sm">{label}</span>
        </div>
        {isActive && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-orange-500 rounded-full animate-in fade-in zoom-in duration-300" />
        )}
      </Link>
    );
  };

  // Search Results Component
  const SearchResultsList = () => (
    <div className={`
      bg-white shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-200
      ${mobileSearchOpen 
        ? "fixed inset-x-0 top-[calc(5rem+1px)] rounded-b-3xl max-h-[60vh] border-t-0" 
        : "absolute top-full right-0 mt-2 w-full rounded-2xl"
      }
    `}>
      {isSearching ? (
        <div className="p-8 text-center text-gray-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2" />
          <p className="text-xs">جاري البحث...</p>
        </div>
      ) : (searchResults.length > 0 || userResults.length > 0) ? (
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {/* Trips Section */}
          {searchResults.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">الرحلات</div>
              {searchResults.map((trip) => (
                <button
                  key={trip._id || trip.id}
                  onClick={() => handleTripClick(String(trip._id || trip.id))}
                  className="w-full px-4 py-2 hover:bg-orange-50 transition-colors flex items-center gap-3 text-right"
                >
                  <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {trip.image ? (
                      <img src={trip.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <MapPin className="h-5 w-5 m-auto text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{trip.title}</p>
                    <p className="text-xs text-gray-500 truncate">{trip.destination || trip.city}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchResults.length > 0 && userResults.length > 0 && <div className="h-px bg-gray-100 mx-4 my-2" />}

          {/* Users Section */}
          {userResults.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">المسافرون</div>
              {userResults.map((u) => (
                <button
                  key={u.clerkId}
                  onClick={() => handleUserClick(u.clerkId)}
                  className="w-full px-4 py-2 hover:bg-orange-50 transition-colors flex items-center gap-3 text-right"
                >
                  <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {u.imageUrl ? (
                      <img src={u.imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      (u.fullName?.[0] || 'U')
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.fullName || u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">لا توجد نتائج</p>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FFFFFF] border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 h-20 md:h-[5rem]">
        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div ref={mobileSearchRef} className="absolute inset-0 bg-white z-50 flex items-center px-4 animate-in fade-in slide-in-from-top-2">
            <Search className="h-5 w-5 text-gray-400 ml-3" />
            <Input
              autoFocus
              type="text"
              placeholder="ابحث عن رحلة، مدينة، أو نشاط..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent text-base"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchValue("");
                setSearchResults([]);
              }}
              className="mr-2"
            >
              <X className="h-5 w-5 text-gray-500" />
            </Button>
            {/* Show results for mobile */}
            {(showDropdown && searchValue.trim().length > 0) && (
              <div className="absolute top-20 left-0 right-0 px-4">
                 <SearchResultsList />
              </div>
            )}
          </div>
        )}

        {/* Standard Header Content */}
        <div className={`flex items-center justify-between h-full gap-4 ${mobileSearchOpen ? 'invisible' : ''}`}>
          
          {/* Right Section: Logo */}
          <Link to="/" className="flex items-center flex-shrink-0 order-1 group">
            <img
              src={logo}
              alt="رحلتي"
              className="h-14 md:h-20 w-auto transition-transform duration-300 group-hover:scale-105 object-contain"
            />
          </Link>

          {/* Center Section: Navigation Link + Search */}
          <div className="flex-1 hidden lg:flex items-center justify-center gap-6 order-2">
            
            {/* Nav Links */}
            <nav className="flex items-center gap-1">
              <NavItem to="/" icon={Home} label="الرئيسية" exact={true} />
              <NavItem to="/timeline" icon={Compass} label="استكشف الرحلات" />
              <NavItem to="/templates" icon={Briefcase} label="رحلات الشركات" />
              
              <Link to="/leaderboard" className="relative group px-1">
                <div className={`
                  flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300
                  ${location.pathname === "/leaderboard" 
                    ? "text-orange-600 font-bold bg-orange-50" 
                    : "text-[#333] hover:text-orange-600 hover:bg-gray-50/50"
                  }
                `}>
                  <Trophy className={`h-4 w-4 ${
                    location.pathname === "/leaderboard" ? "fill-orange-600/20" : ""
                  }`} />
                  <span className="text-sm">المتصدرين</span>
                </div>
              </Link>
            </nav>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200" />

            {/* Search Bar */}
            <div className="relative w-[320px]" ref={searchContainerRef}>
              <div className="relative group">
                <Input
                  type="text"
                  placeholder="ابحث عن رحلة..."
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => {
                    if (searchValue.trim()) setShowDropdown(true);
                  }}
                  className="w-full pl-4 pr-10 py-2 h-10 bg-gray-50/50 border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm placeholder:text-gray-400"
                />
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              </div>

              {/* Search Results Dropdown */}
              {showDropdown && (searchValue.trim().length > 0) && (
                <SearchResultsList />
              )}
            </div>

          </div>

          {/* Left Section: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 order-3">
            
            {/* Mobile Search Toggle */}
            <div className="lg:hidden relative">
               <Button
                 variant="ghost" 
                 size="icon"
                 data-mobile-search-trigger
                 className="rounded-full text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                 onClick={() => setMobileSearchOpen(true)}
               >
                 <Search className="h-5 w-5" />
               </Button>
            </div>

            <SignedIn>
              <div className="text-gray-600 hover:text-orange-600 transition-colors">
                <NotificationBell />
              </div>
            </SignedIn>

            {/* Create Trip CTA */}
            <SignedIn>
               <Link to="/trips/new" className="hidden sm:block">
                 <Button className="rounded-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 border-0 h-10 px-6">
                   <Plus className="h-5 w-5 ml-2" />
                   <span className="font-semibold">أنشئ رحلة</span>
                 </Button>
               </Link>
            </SignedIn>

            {/* Profile */}
            <SignedIn>
              <div 
                className="hidden sm:flex items-center gap-2 pr-1 pl-1 py-1 rounded-full cursor-pointer hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                onClick={handleUserButtonClick}
              >
                <div className="text-right hidden md:block">
                   <p className="text-xs text-gray-500 px-2 font-medium">حسابي</p>
                </div>
                <div className="h-9 w-9 rounded-full ring-2 ring-white shadow-sm overflow-hidden">
                   <img 
                     src={user?.imageUrl} 
                     alt={user?.fullName || "User"} 
                     className="h-full w-full object-cover"
                   />
                </div>
              </div>
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <Button className="rounded-full bg-gray-900 text-white hover:bg-black">
                  تسجيل الدخول
                </Button>
              </SignInButton>
            </SignedOut>

            {/* Mobile Menu Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden -ml-2 text-gray-600">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-right">القائمة</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-colors">
                    <Home className="h-5 w-5" />
                    الرئيسية
                  </Link>
                  <Link to="/timeline" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-colors">
                    <Compass className="h-5 w-5" />
                    استكشف الرحلات
                  </Link>
                  <Link to="/templates" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-colors">
                    <Briefcase className="h-5 w-5" />
                    رحلات الشركات
                  </Link>
                  <Link to="/leaderboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-colors">
                    <Trophy className="h-5 w-5" />
                    المتصدرين
                  </Link>
                  
                  <div className="my-4 h-px bg-gray-100" />
                  
                  <SignedIn>
                    <Link to="/trips/new" className="block">
                      <Button className="w-full justify-center rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                        <Plus className="h-5 w-5 ml-2" />
                        أنشئ رحلة
                      </Button>
                    </Link>
                  </SignedIn>
                </div>
              </SheetContent>
            </Sheet>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
