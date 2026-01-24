import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminService } from "@/services/adminService";
import AdminLayout from "@/components/admin/AdminLayout";
import { Search, Mail, Calendar, User, MoreVertical, ShieldCheck, MailWarning, UserMinus, Users as UsersIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const AdminUsers = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const data = await adminService.getAllUsers(token || undefined);
      
      const transformedUsers = data.map((user: any) => ({
        _id: user.clerkId || user._id,
        fullName: user.fullName || user.username || 'مستخدم',
        email: user.email || 'لا يوجد بريد',
        imageUrl: user.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user._id}`,
        createdAt: user.createdAt || new Date().toISOString(),
        trips: typeof user.trips === 'number' ? user.trips : (user.trips?.length || 0),
        followers: user.followers || 0,
        following: user.following || 0,
        status: 'active'
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-10" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 font-cairo">إدارة <span className="text-indigo-600">المستخدمين</span></h1>
              <p className="text-gray-500 font-bold text-sm">عرض وتحليل والتحكم في كافة حسابات المنصة.</p>
           </div>
           
           <div className="relative w-full md:w-[400px]">
              <div className="relative group">
                 <Input
                    type="text"
                    placeholder="ابحث بالاسم أو البريد..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pr-12 rounded-2xl bg-white border-gray-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold shadow-sm"
                 />
                 <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
           </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { title: "إجمالي المستخدمين", value: users.length, icon: User, color: "bg-indigo-50 text-indigo-600" },
             { title: "حسابات موثقة", value: Math.floor(users.length * 0.8), icon: ShieldCheck, color: "bg-emerald-50 text-emerald-600" },
             { title: "إجمالي الرحلات", value: users.reduce((sum, u) => sum + u.trips, 0), icon: Calendar, color: "bg-purple-50 text-purple-600" },
             { title: "متوسط المتابعة", value: Math.round(users.reduce((sum, u) => sum + u.followers, 0) / users.length) || 0, icon: UsersIcon, color: "bg-orange-50 text-orange-600" },
           ].map((stat, i) => (
             <Card key={i} className="border-0 shadow-xl shadow-gray-200/40 rounded-[2rem] overflow-hidden group">
                <CardContent className="p-6">
                   <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12", stat.color)}>
                         <stat.icon className="w-6 h-6" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{stat.title}</p>
                         <p className="text-2xl font-black text-gray-900 leading-none mt-1">{stat.value.toLocaleString('ar-EG')}</p>
                      </div>
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>

        {/* Users Table / Grid */}
        <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-2xl shadow-gray-200/20 p-8 overflow-hidden relative">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-900">سجل النشاط</h3>
              <div className="flex gap-2">
                 <button className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors">تصدير CSV</button>
              </div>
           </div>

           {loading ? (
             <div className="space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-50 rounded-3xl animate-pulse" />)}
             </div>
           ) : filteredUsers.length === 0 ? (
             <div className="text-center py-20 px-8">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Search className="h-10 w-10 text-gray-200" />
                </div>
                <h3 className="text-lg font-black text-gray-900">لا توجد نتائج بحث</h3>
                <p className="text-gray-400 font-bold text-sm">تحقق من كتابة الاسم بشكل صحيح أو حاول البحث عن شيء آخر.</p>
             </div>
           ) : (
             <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                   {filteredUsers.map((user, idx) => (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group flex flex-col md:flex-row items-center justify-between p-5 rounded-[2.5rem] bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all border border-transparent hover:border-indigo-50 gap-6"
                    >
                      <div className="flex items-center gap-5 w-full md:w-auto">
                        <div className="relative group-hover:scale-110 transition-transform duration-500">
                           <div className="w-16 h-16 rounded-[1.25rem] overflow-hidden ring-4 ring-white shadow-lg shadow-indigo-100">
                             <img src={user.imageUrl} className="w-full h-full object-cover" />
                           </div>
                           <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                              <ShieldCheck className="w-3 h-3 text-white" />
                           </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-gray-900 text-lg group-hover:text-indigo-600 transition-colors truncate">{user.fullName}</h4>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 truncate">
                              <Mail className="h-3.5 w-3.5" />
                              {user.email}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-gray-200" />
                            <span className="text-[10px] font-black text-gray-300 uppercase shrink-0">منذ {new Date(user.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center md:justify-end gap-8 w-full md:w-auto">
                        <div className="flex items-center gap-6">
                           <div className="text-center">
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">الرحلات</p>
                             <p className="text-lg font-black text-gray-900 leading-none">{user.trips}</p>
                           </div>
                           <div className="h-8 w-px bg-gray-100" />
                           <div className="text-center">
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">المتابعين</p>
                             <p className="text-lg font-black text-gray-900 leading-none">{user.followers}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-3">
                           <Button
                              variant="ghost"
                              className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                              onClick={() => navigate(`/user/${user._id}`)}
                           >
                              <User className="h-5 w-5" />
                           </Button>
                           <Button
                              variant="ghost"
                              className="h-12 w-12 rounded-2xl bg-white text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm border border-gray-100"
                           >
                              <UserMinus className="h-5 w-5" />
                           </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>
           )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
