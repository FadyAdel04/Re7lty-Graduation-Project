import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getFollowingStories, StoryUserGroup } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface StoriesBarProps {
  onUserClick?: (user: StoryUserGroup) => void;
}

export function StoriesBar({ onUserClick }: StoriesBarProps) {
  const { isSignedIn, getToken } = useAuth();
  const [groups, setGroups] = useState<StoryUserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!isSignedIn) return;
      setIsLoading(true);
      setHasError(false);
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getFollowingStories(token);
        if (isMounted && data?.users) {
          setGroups(data.users);
        }
      } catch (err) {
        console.error("Error loading stories:", err);
        if (isMounted) setHasError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [isSignedIn, getToken]);

  if (!isSignedIn) return null;

  return (
    <div className="mb-4 sm:mb-6">
      <h2 className="text-sm font-semibold mb-2">قصص من الأشخاص الذين تتابعهم</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {isLoading && (
          <>
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-16 w-16 rounded-full" />
          </>
        )}
        {!isLoading && !groups.length && !hasError && (
          <p className="text-xs text-muted-foreground">لا توجد قصص متاحة الآن.</p>
        )}
        {!isLoading &&
          groups.map((user) => (
            <button
              key={user.userId}
              type="button"
              className="flex flex-col items-center gap-1 focus:outline-none"
              onClick={() => onUserClick?.(user)}
            >
              <div
                className={`p-[2px] rounded-full ${
                  user.hasUnseen
                    ? "bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500"
                    : "bg-muted"
                }`}
              >
                <Avatar className="h-14 w-14 border-2 border-background">
                  {user.imageUrl ? <AvatarImage src={user.imageUrl} alt={user.fullName} /> : null}
                  <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[11px] max-w-[80px] truncate">{user.fullName}</span>
            </button>
          ))}
        {hasError && (
          <p className="text-xs text-destructive">تعذر تحميل القصص حالياً.</p>
        )}
      </div>
    </div>
  );
}

