import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Users, UserPlus } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UserCard from "@/components/UserCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserFollowers, getUserFollowing, getUserById } from "@/lib/api";
import { useAuth, useUser } from "@clerk/clerk-react";

interface User {
  clerkId: string;
  fullName: string;
  username: string;
  imageUrl: string;
  bio?: string;
  location?: string;
  followers?: number;
  tripsCount?: number;
}

const UserConnectionsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useUser();
  
  const type = searchParams.get("type") === "following" ? "following" : "followers";
  
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Fetch user basic info
        let userData = null;
        if (currentUser && currentUser.id === id) {
             userData = {
                 fullName: currentUser.fullName || currentUser.username,
                 username: currentUser.username
             }
        } else {
             userData = await getUserById(id);
        }
        setProfileUser(userData);

        // Fetch both lists (can be optimized to fetch on tab change if needed)
        const [followersData, followingData] = await Promise.all([
            getUserFollowers(id),
            getUserFollowing(id)
        ]);

        setFollowers(Array.isArray(followersData) ? followersData : []);
        setFollowing(Array.isArray(followingData) ? followingData : []);
        
      } catch (error) {
        console.error("Error fetching connections:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, currentUser]);

  const handleTabChange = (value: string) => {
    setSearchParams({ type: value });
  };

  const renderList = (list: User[], emptyMessage: string, icon: any) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
                {emptyMessage}
            </h3>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((user) => (
          <div 
            key={user.clerkId} 
            onClick={() => navigate(`/user/${user.clerkId}`)}
            className="cursor-pointer h-full"
          >
            <UserCard user={{
              clerkId: user.clerkId,
              fullName: user.fullName || user.username,
              username: user.username,
              imageUrl: user.imageUrl,
              bio: user.bio,
              location: user.location,
              followers: user.followers,
              tripsCount: user.tripsCount
            }} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(`/user/${id}`)}
                className="rounded-full hover:bg-white/80"
            >
                <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
                {profileUser && (
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        {profileUser.fullName || profileUser.username}
                    </h1>
                )}
                <p className="text-sm text-gray-500">
                    شبكة التواصل
                </p>
            </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={type} value={type} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-12 mb-8 bg-white border border-gray-200 rounded-xl p-1">
                <TabsTrigger value="followers" className="rounded-lg text-base font-medium">
                    المتابعون ({followers.length})
                </TabsTrigger>
                <TabsTrigger value="following" className="rounded-lg text-base font-medium">
                    يتابع ({following.length})
                </TabsTrigger>
            </TabsList>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
                </div>
            ) : (
                <>
                    <TabsContent value="followers" className="mt-0">
                        {renderList(
                            followers, 
                            "لا يوجد متابعين بعد", 
                            <Users className="h-8 w-8 text-orange-500" />
                        )}
                    </TabsContent>
                    <TabsContent value="following" className="mt-0">
                         {renderList(
                            following, 
                            "لا يتابع أحد بعد", 
                            <UserPlus className="h-8 w-8 text-orange-500" />
                        )}
                    </TabsContent>
                </>
            )}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default UserConnectionsPage;
