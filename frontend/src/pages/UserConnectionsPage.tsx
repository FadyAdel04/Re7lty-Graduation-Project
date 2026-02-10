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
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/contexts/LoadingContext";
import PremiumLoader from "@/components/PremiumLoader";

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
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      startLoading();
      try {
        // Fetch user basic info
        let userData = null;
        if (currentUser && currentUser.id === id) {
             userData = {
                 fullName: currentUser.fullName || currentUser.username,
                 username: currentUser.username,
                 imageUrl: currentUser.imageUrl
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
        stopLoading();
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
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50"
        >
            <div className="bg-orange-600/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                {icon}
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                {emptyMessage}
            </h3>
            <p className="text-gray-500 max-w-xs mx-auto font-medium">
               ابدأ بتوسيع شبكتك واكتشف مسافرين جدد يشاركونك نفس الشغف!
            </p>
        </motion.div>
      );
    }

    return (
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <AnimatePresence>
            {list.map((user, index) => (
              <motion.div 
                key={user.clerkId} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                layout
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
              </motion.div>
            ))}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFEFF] font-cairo flex flex-col items-center" dir="rtl">
      <Header />
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-sky-100/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-orange-100/20 rounded-full blur-[120px]" />
      </div>

      <main className="flex-1 w-full max-w-5xl px-4 py-12 relative">
        {/* Page Header Redesign */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-6">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => navigate(`/user/${id}`)}
                    className="h-14 w-14 rounded-2xl border-gray-200 bg-white shadow-xl shadow-gray-100 hover:scale-110 transition-transform active:scale-95"
                >
                    <ArrowRight className="h-6 w-6 text-gray-700" />
                </Button>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Users className="h-5 w-5 text-orange-600" />
                        <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">شبكة التواصل</span>
                    </div>
                    {isLoading ? (
                        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg" />
                    ) : (
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            {profileUser?.fullName || profileUser?.username}
                        </h1>
                    )}
                </div>
            </div>
            
            {/* Optional Stats Summary */}
            {!isLoading && (
              <div className="flex gap-4">
                 <div className="bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/50 shadow-sm">
                    <span className="block text-2xl font-black text-gray-900 leading-none">{followers.length}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase">متابع</span>
                 </div>
                 <div className="bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/50 shadow-sm">
                    <span className="block text-2xl font-black text-gray-900 leading-none">{following.length}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase">يتابع</span>
                 </div>
              </div>
            )}
        </div>

        {/* Custom Tabs Design */}
        <Tabs defaultValue={type} value={type} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full relative h-[72px] grid grid-cols-2 p-1.5 bg-gray-100/50 backdrop-blur-sm border border-gray-200/50 rounded-[2rem] gap-2 mb-12">
                <TabsTrigger 
                  value="followers" 
                  className="rounded-[1.6rem] text-lg font-black data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-2xl transition-all duration-300"
                >
                    المتابعون
                </TabsTrigger>
                <TabsTrigger 
                  value="following" 
                  className="rounded-[1.6rem] text-lg font-black data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-2xl transition-all duration-300"
                >
                    يتابع
                </TabsTrigger>
            </TabsList>

            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center justify-center py-32 space-y-4"
                        >
                            <div className="relative h-20 w-20">
                                <div className="absolute inset-0 rounded-full border-4 border-orange-100" />
                                <div className="absolute inset-0 rounded-full border-4 border-orange-600 border-t-transparent animate-spin" />
                            </div>
                            <p className="text-gray-400 font-bold animate-pulse">جاري جلب القائمة...</p>
                        </motion.div>
                    ) : (
                        <>
                            <TabsContent value="followers" className="mt-0 outline-none">
                                {renderList(
                                    followers, 
                                    "لم يتم العثور على متابعين", 
                                    <Users className="h-10 w-10 text-orange-600" />
                                )}
                            </TabsContent>
                            <TabsContent value="following" className="mt-0 outline-none">
                                 {renderList(
                                    following, 
                                    "قائمة المتابعة فارغة", 
                                    <UserPlus className="h-10 w-10 text-orange-600" />
                                )}
                            </TabsContent>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default UserConnectionsPage;
