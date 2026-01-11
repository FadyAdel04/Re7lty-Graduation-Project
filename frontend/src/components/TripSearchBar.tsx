import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TripSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TripSearchBar = ({ value, onChange, placeholder = "ابحث عن رحلة، وجهة، أو شركة..." }: TripSearchBarProps) => {
  return (
    <div className="relative">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10 h-12 rounded-xl border-gray-200 focus-visible:ring-orange-500 text-right"
      />
    </div>
  );
};

export default TripSearchBar;
