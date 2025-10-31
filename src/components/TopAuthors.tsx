import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { egyptTrips } from "@/lib/trips-data";

const TopAuthors = () => {
  const map = new Map<string, { author: string; totalLikes: number; authorFollowers: number }>();
  egyptTrips.forEach((t) => {
    const prev = map.get(t.author) || { author: t.author, totalLikes: 0, authorFollowers: t.authorFollowers };
    prev.totalLikes += t.likes;
    prev.authorFollowers = t.authorFollowers;
    map.set(t.author, prev);
  });
  const topAuthors = Array.from(map.values()).sort((a, b) => b.totalLikes - a.totalLikes).slice(0, 3);

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-xl font-bold mb-4">أعلى 3 مسافرين</h3>
        <div className="space-y-4">
          {topAuthors.map((a, idx) => (
            <Link key={a.author} to={`/profile/${a.author.replace(/\s+/g, '-')}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="h-12 w-12 rounded-full bg-gradient-hero text-white font-bold flex items-center justify-center">{a.author.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{a.author}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-3">
                  <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-primary" /> {a.totalLikes} إعجاب إجمالي</span>
                </div>
              </div>
              <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopAuthors;
