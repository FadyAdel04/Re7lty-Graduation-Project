import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

const AdminHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="bg-orange-600 p-2 rounded-lg">
             <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
            لوحة الأدمن
          </span>
        </Link>
        
        {/* Admin User Menu */}
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors flex items-center gap-1">
            العودة للموقع
          </Link>
          <div className="h-4 w-px bg-gray-200 hidden md:block" />
          <span className="text-sm font-medium text-gray-600 hidden md:block">
            مدير النظام
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
