import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
const logo = "/assets/logo.png";
import { egyptTrips } from "@/lib/trips-data";
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
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

const Header = ({ onSearch }: HeaderProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState(egyptTrips.slice(0, 5));
  const [authorResults, setAuthorResults] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleUserButtonClick = () => {
    // Navigate to user profile when clicking on UserButton avatar
    navigate('/user');
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);

    if (value.trim()) {
      const query = value.toLowerCase();
      const results = egyptTrips
        .filter(
          (trip) =>
            trip.title.toLowerCase().includes(query) ||
            trip.destination.toLowerCase().includes(query) ||
            trip.city.toLowerCase().includes(query)
        )
        .slice(0, 10);
      setSearchResults(results);

      // Authors results
      const uniqueAuthors = Array.from(
        new Set(egyptTrips.map((t) => t.author))
      );
      const authorMatches = uniqueAuthors
        .filter((a) => a.toLowerCase().includes(query))
        .slice(0, 10);
      setAuthorResults(authorMatches);

      setShowDropdown(true);
    } else {
      setSearchResults(egyptTrips.slice(0, 5));
      setAuthorResults([]);
      setShowDropdown(false);
    }
  };

  const handleTripClick = (tripId: string) => {
    navigate(`/trips/${tripId}`);
    setShowDropdown(false);
    setSearchOpen(false);
    setSearchValue("");
  };

  const handleAuthorClick = (author: string) => {
    navigate(`/profile/${author.replace(/\s+/g, "-")}`);
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
                        navigate('/user');
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

            {/* Authors */}
            {authorResults.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="px-3 py-2 text-xs font-bold text-muted-foreground">
                  مسافرون
                </div>
                {authorResults.map((author) => (
                  <button
                    key={author}
                    onClick={() => handleAuthorClick(author)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-secondary-light transition-colors text-right"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-hero text-white font-bold flex items-center justify-center">
                      {author.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="font-bold text-sm truncate">{author}</p>
                      <p className="text-xs text-muted-foreground">
                        الملف الشخصي
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Trips */}
            <div className="max-h-80 overflow-auto border border-border rounded-xl">
              {searchResults.length > 0 ? (
                searchResults.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => handleTripClick(trip.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-secondary-light transition-colors text-right"
                  >
                    <img
                      src={trip.image}
                      alt={trip.title}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-right">
                      <p className="font-bold text-sm truncate">{trip.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {trip.destination} • {trip.city}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  لا توجد نتائج
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
