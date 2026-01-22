import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Plane,
  Building2,
  BarChart3,
  Users,
  AlertCircle,
  Settings
} from 'lucide-react';

const AdminSidebar = () => {
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
    },
    {
      name: 'الإعدادات',
      path: '/admin/settings',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-white border-l border-gray-200 min-h-screen sticky top-0 right-0">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">لوحة التحكم</h2>
        
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${active 
                    ? `${item.bgColor} ${item.color} font-semibold shadow-sm` 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${active ? item.color : 'text-gray-400'}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
