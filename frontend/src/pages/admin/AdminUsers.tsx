import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminService } from "@/services/adminService";
import AdminLayout from "@/components/admin/AdminLayout";
import { Search, Mail, Calendar, User } from "lucide-react";

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
      // Fetch all users using adminService
      const data = await adminService.getAllUsers(token || undefined);
      
      // Transform the data to match our UI needs
      const transformedUsers = data.map((user: any) => ({
        _id: user.clerkId || user._id, // Prefer clerkId as it's used for connecting data
        fullName: user.fullName || user.username || 'مستخدم',
        email: user.email || 'لا يوجد بريد',
        imageUrl: user.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user._id}`,
        createdAt: user.createdAt || new Date().toISOString(),
        trips: typeof user.trips === 'number' ? user.trips : (user.trips?.length || 0),
        followers: user.followers || 0,
        following: user.following || 0,
        status: 'active' // Default status
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to empty array on error
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">إدارة المستخدمين</h1>
        <p className="text-gray-600">عرض وإدارة جميع مستخدمي المنصة</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="ابحث عن مستخدم بالاسم أو البريد الإلكتروني..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-right"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مستخدمين نشطين</p>
                <p className="text-3xl font-bold text-green-600">{users.filter(u => u.status === 'active').length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <User className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الرحلات</p>
                <p className="text-3xl font-bold text-purple-600">{users.reduce((sum, u) => sum + u.trips, 0)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متوسط المتابعين</p>
                <p className="text-3xl font-bold text-orange-600">
                  {Math.round(users.reduce((sum, u) => sum + u.followers, 0) / users.length) || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>جميع المستخدمين</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">جاري التحميل...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">لا توجد نتائج</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={user.imageUrl}
                      alt={user.fullName}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">{user.fullName}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">الرحلات</p>
                      <p className="text-lg font-bold text-gray-900">{user.trips}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">المتابعين</p>
                      <p className="text-lg font-bold text-gray-900">{user.followers}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">يتابع</p>
                      <p className="text-lg font-bold text-gray-900">{user.following}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">تاريخ التسجيل</p>
                      <p className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">
                      نشط
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/profile/${user._id}`)}
                    >
                      عرض الملف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminUsers;
