import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
const logo = "/assets/logo.png";
import { search } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleUserButtonClick = () => {
    // Navigate to user profile with Clerk ID when clicking on UserButton avatar
    if (user?.id) {
      navigate(`/user/${user.id}`);
    }
  };

  const handleSearch = async (value: string) => {
    setSearchValue(value);
    onSearch?.(value);

    // Clear previous timeout
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

    // Debounce search - wait 300ms after user stops typing
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await search(value, 10);
        setSearchResults(results.trips || []);
        setUserResults(results.users || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
        // Fallback to empty results on error
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
    setSearchOpen(false);
    setSearchValue("");
  };

  const handleUserClick = (clerkId: string) => {
    navigate(`/user/${clerkId}`);
    setShowDropdown(false);
    setSearchOpen(false);
    setSearchValue("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowDropdown(false), 0);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="رحلتي"
              className="h-20 w-auto sm:h-24 md:h-28 transition-all duration-300 hover:scale-105"
            />
          </Link>

          {/* Search Trigger - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground z-10" />
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="w-full text-right pr-12 h-12 rounded-full border border-input bg-muted/30 hover:bg-muted/50 transition-all px-4"
              >
                {searchValue
                  ? searchValue
                  : "ابحث عن وجهة، مدينة، رحلة أو مسافر..."}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/leaderboard" className="hidden lg:block">
              <Button variant="ghost" className="rounded-full">
                المتصدرين
              </Button>
            </Link>
            <Link to="/templates" className="hidden lg:block">
              <Button variant="ghost" className="rounded-full">
              رحلات الشركات
              </Button>
            </Link>
            <Link to="/timeline" className="hidden lg:block">
              <Button variant="ghost" className="rounded-full">
                استكشف الرحلات
              </Button>
            </Link>
            <SignedIn>
            <Link to="/trips/new" className="hidden sm:block">
              <Button variant="secondary" className="rounded-full">
                <MapPin className="h-4 w-4 ml-2" />
                أنشئ رحلة
              </Button>
            </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="default" className="rounded-full hidden sm:block">
                تسجيل الدخول
              </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <NotificationBell />
              <div className="hidden sm:block cursor-pointer" onClick={handleUserButtonClick}>
                <UserButton />
              </div>
            </SignedIn>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-full"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[420px]">
                <SheetHeader>
                  <SheetTitle>القائمة</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-4">

                  <Link to="/leaderboard" className="block">
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl"
                    >
                      المتصدرين
                    </Button>
                  </Link>
                  <Link to="/templates" className="block">
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl"
                    >
                      القوالب
                    </Button>
                  </Link>
                  <Link to="/timeline" className="block">
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl"
                    >
                      استكشف الرحلات
                    </Button>
                  </Link>
                  <SignedIn>
                  <Link to="/trips/new" className="block">
                    <Button
                      variant="secondary"
                      className="w-full justify-center rounded-xl"
                    >
                      <MapPin className="h-4 w-4 ml-2" /> أنشئ رحلة
                    </Button>
                  </Link>
                  </SignedIn>
                  <SignedOut>
                    <SignInButton mode="modal">
                    <Button
                      variant="default"
                      className="w-full justify-center rounded-xl"
                    >
                      تسجيل الدخول
                    </Button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <div 
                      className="w-full flex justify-center cursor-pointer" 
                      onClick={() => {
                        if (user?.id) {
                          navigate(`/user/${user.id}`);
                        }
                        // Close the mobile menu sheet by finding and clicking close button
                        const sheet = document.querySelector('[data-state="open"]');
                        if (sheet) {
                          const closeButton = sheet.querySelector('button[aria-label="Close"], button:last-child');
                          if (closeButton) {
                            (closeButton as HTMLElement).click();
                          }
                        }
                      }}
                    >
                      <UserButton />
                    </div>
                  </SignedIn>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search shortcut */}
        <div className="md:hidden pb-4">
          <Button
            variant="outline"
            className="w-full rounded-full"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4 ml-2" /> فتح البحث
          </Button>
        </div>
      </div>

      {/* Global Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>ابحث عن الرحلات أو المسافرين</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative" ref={dropdownRef}>
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                type="search"
                placeholder="ابحث عن وجهة، مدينة، رحلة أو مسافر..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pr-8"
              />
            </div>

            {/* Loading State */}
            {isSearching && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p>جاري البحث...</p>
              </div>
            )}

            {/* Users Results */}
            {!isSearching && userResults.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b border-border">
                  <h3 className="font-semibold text-sm">المسافرون</h3>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {userResults.map((user) => (
                    <button
                      key={user.clerkId}
                      onClick={() => handleUserClick(user.clerkId)}
                      className="w-full px-4 py-3 hover:bg-muted/50 transition-colors text-right flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-hero text-white font-bold flex items-center justify-center flex-shrink-0">
                        {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="font-semibold truncate">{user.fullName || user.username || 'مستخدم'}</p>
                        {user.location && (
                          <p className="text-xs text-muted-foreground truncate">{user.location}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trips Results */}
            {!isSearching && searchResults.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b border-border">
                  <h3 className="font-semibold text-sm">الرحلات</h3>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {searchResults.map((trip) => {
                    const tripId = String(trip._id || trip.id);
                    return (
                      <button
                        key={tripId}
                        onClick={() => handleTripClick(tripId)}
                        className="w-full px-4 py-3 hover:bg-muted/50 transition-colors text-right flex items-center gap-3"
                      >
                        {trip.image && (
                          <img
                            src={trip.image}
                            alt={trip.title}
                            className="h-12 w-16 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0 text-right">
                          <p className="font-semibold truncate">{trip.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{trip.destination || trip.city}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Results */}
            {!isSearching && searchValue.trim() && searchResults.length === 0 && userResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>لا توجد نتائج</p>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
