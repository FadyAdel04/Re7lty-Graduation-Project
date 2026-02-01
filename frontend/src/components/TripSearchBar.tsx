import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TripSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TripSearchBar = ({ value, onChange, placeholder = "ابحث عن رحلتك القادمة..." }: TripSearchBarProps) => {
  return (
    <div className="relative group">
      <div className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-orange-600 transition-colors">
        <Search className="h-full w-full" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-12 pl-4 h-14 rounded-2xl border-zinc-200 bg-white/50 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 text-right font-medium placeholder:text-zinc-400 text-zinc-900 transition-all shadow-sm"
      />
    </div>
  );
};

export default TripSearchBar;
