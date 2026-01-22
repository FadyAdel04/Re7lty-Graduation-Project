import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Menu } from "lucide-react";


interface AdminHeaderProps {
  onMenuClick?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo / Brand */}
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="bg-orange-600 p-2 rounded-lg">
               <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
              Re7lty Admin
            </span>
          </Link>
        </div>
        
        {/* Admin User Menu */}
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors flex items-center gap-1">
            <span className="hidden sm:inline">العودة للموقع</span>
            <span className="sm:hidden">الرئيسية</span>
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

