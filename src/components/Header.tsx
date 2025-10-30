import { useState } from "react";
import { Search, MapPin, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

const Header = ({ onSearch }: HeaderProps) => {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logo} alt="رحلتي" className="h-14 w-auto sm:h-16" />
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ابحث عن وجهة، مدينة، أو رحلة..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pr-12 h-12 rounded-full border border-input bg-muted/30 focus:bg-background focus:border-secondary transition-all"
              />
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
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ابحث عن وجهة..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pr-12 h-11 rounded-full border border-input bg-muted/30"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
