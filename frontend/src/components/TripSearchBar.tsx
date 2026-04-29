import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TripSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TripSearchBar = ({ value, onChange, placeholder = "ابحث عن رحلتك القادمة..." }: TripSearchBarProps) => {
  return (
    <div className="relative group font-cairo">
      <div className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors">
        <Search className="h-full w-full" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-14 pl-6 h-16 rounded-[1.5rem] border-border bg-card/50 backdrop-blur-md focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary text-right font-black placeholder:text-muted-foreground/60 text-foreground transition-all shadow-xl shadow-black/5"
      />
    </div>
  );
};

export default TripSearchBar;
