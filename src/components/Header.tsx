import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { egyptTrips } from "@/lib/trips-data";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

const Header = ({ onSearch }: HeaderProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState(egyptTrips.slice(0, 5));
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
    
    if (value.trim()) {
      const query = value.toLowerCase();
      const results = egyptTrips.filter(
        trip =>
          trip.title.toLowerCase().includes(query) ||
          trip.destination.toLowerCase().includes(query) ||
          trip.city.toLowerCase().includes(query)
      ).slice(0, 5);
      setSearchResults(results);
      setShowDropdown(true);
    } else {
      setSearchResults(egyptTrips.slice(0, 5));
      setShowDropdown(false);
    }
  };

  const handleTripClick = (tripId: string) => {
    navigate(`/trips/${tripId}`);
    setShowDropdown(false);
    setSearchValue("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
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
            <img src={logo} alt="رحلتي" className="h-14 w-auto sm:h-16" />
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-2xl" ref={dropdownRef}>
            <div className="relative w-full">
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                type="search"
                placeholder="ابحث عن وجهة، مدينة، أو رحلة..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                className="w-full pr-12 h-12 rounded-full border border-input bg-muted/30 focus:bg-background focus:border-secondary transition-all"
              />
              
              {/* Search Results Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-2xl shadow-lg z-50 overflow-hidden">
                  {searchResults.map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => handleTripClick(trip.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-secondary-light transition-colors text-right"
                    >
                      <img
                        src={trip.image}
                        alt={trip.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{trip.title}</p>
                        <p className="text-xs text-muted-foreground">{trip.destination}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
                القوالب
              </Button>
            </Link>
            <Link to="/trips/new" className="hidden sm:block">
              <Button variant="secondary" className="rounded-full">
                <MapPin className="h-4 w-4 ml-2" />
                أنشئ رحلة
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="default" className="rounded-full">
                تسجيل الدخول
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden rounded-full">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              type="search"
              placeholder="ابحث عن وجهة..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              className="w-full pr-12 h-11 rounded-full border border-input bg-muted/30"
            />
            
            {/* Mobile Search Results Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-2xl shadow-lg z-50 overflow-hidden">
                {searchResults.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => handleTripClick(trip.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-secondary-light transition-colors text-right"
                  >
                    <img
                      src={trip.image}
                      alt={trip.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{trip.title}</p>
                      <p className="text-xs text-muted-foreground">{trip.destination}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
