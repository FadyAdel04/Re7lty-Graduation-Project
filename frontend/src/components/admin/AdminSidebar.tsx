import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Plane,
  Building2,
  BarChart3,
  Users,
  Settings,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
  closeMobileSidebar: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  isOpen, 
  toggleSidebar, 
  isMobile,
  closeMobileSidebar
}) => {
  const location = useLocation();

  const navItems = [
    {
      name: 'لوحة التحكم',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'الرحلات',
      path: '/admin/trips',
      icon: Plane,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'الشركات',
      path: '/admin/companies',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      name: 'التقارير والإحصائيات',
      path: '/admin/reports',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      name: 'المستخدمين',
      path: '/admin/users',
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    },
    {
      name: 'الشكاوى والبلاغات',
      path: '/admin/complaints',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };


  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:sticky top-0 right-0 h-screen bg-white border-l border-gray-200 
          transition-all duration-300 ease-in-out z-50
          ${isOpen ? 'w-64' : 'w-20'}
          ${isMobile 
            ? isOpen ? 'translate-x-0' : 'translate-x-full' 
            : 'translate-x-0'
          }
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header & Toggle */}
          <div className={`p-6 flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
            {isOpen && (
              <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">
                لوحة التحكم
              </h2>
            )}
            
            {/* Desktop Toggle */}
            <button 
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hidden lg:block"
            >
              {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

            {/* Mobile Close */}
            <button 
              onClick={closeMobileSidebar}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative
                  ${active 
                    ? `${item.bgColor} ${item.color} font-semibold shadow-sm` 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                  ${!isOpen && 'justify-center'}
                `}
              >
                <Icon className={`h-6 w-6 shrink-0 ${active ? item.color : 'text-gray-400'}`} />
                
                {isOpen ? (
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100">
                    {item.name}
                  </span>
                ) : (
                  /* Tooltip for collapsed state */
                  <div className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
            </nav>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
