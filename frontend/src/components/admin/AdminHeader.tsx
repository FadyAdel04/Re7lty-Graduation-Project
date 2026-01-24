import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Menu, Globe, UserCheck } from "lucide-react";

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/70 backdrop-blur-xl transition-all duration-300">
      <div className="container mx-auto px-6 h-[4.5rem] flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Mobile Menu Button */}
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo / Brand */}
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-200 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
               <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-gray-900 leading-none mb-1">لوحة التحكم</span>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">RE7LTY ADMIN ENGINE</span>
            </div>
          </Link>
        </div>
        
        {/* Admin User Menu */}
        <div className="flex items-center gap-6">
          <Link 
            to="/" 
            className="hidden sm:flex items-center gap-2 text-sm font-black text-gray-500 hover:text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all duration-300 group"
          >
            <Globe className="h-4 w-4 group-hover:rotate-12 transition-transform" />
            العودة للموقع
          </Link>

          <div className="h-8 w-px bg-gray-100 hidden md:block" />

          <div className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-2xl bg-gray-50/50 border border-gray-100/50">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-indigo-500 leading-none mb-1">مدير النظام</p>
              <p className="text-xs font-black text-gray-700 leading-none">فادي عادل</p>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

