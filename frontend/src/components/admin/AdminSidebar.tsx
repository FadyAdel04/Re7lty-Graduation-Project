import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  X,
  PlusCircle,
  FileCheck,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { cn } from '@/lib/utils';

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
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      await signOut();
    }
  };

  const navItems = [
    {
      name: 'نظرة عامة',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50/50'
    },
    {
      name: 'إدارة الرحلات',
      path: '/admin/trips',
      icon: Plane,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50/50'
    },
    {
      name: 'إدارة الشركات',
      path: '/admin/companies',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50/50'
    },
    {
      name: 'التحليلات',
      path: '/admin/reports',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50/50'
    },
    {
      name: 'المستخدمين',
      path: '/admin/users',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50/50'
    },
    {
      name: 'الطلبات',
      path: '/admin/submissions',
      icon: FileCheck,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50/50'
    },
    {
      name: 'إدارة المحتوى',
      path: '/admin/moderation',
      icon: ShieldAlert,
      color: 'text-red-600',
      bgColor: 'bg-red-50/50'
    },
    {
      name: 'البلاغات و التعليقات',
      path: '/admin/complaints',
      icon: AlertCircle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50/50'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[70] lg:hidden"
           onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isOpen ? 280 : 88 }}
        className={cn(
          "fixed lg:fixed top-0 right-0 h-screen bg-white/80 backdrop-blur-2xl border-l border-gray-100 shadow-2xl transition-all duration-300 z-[80]",
          isMobile && !isOpen && "translate-x-full"
        )}
      >
        <div className="h-full flex flex-col relative">
          
          {/* Collapse/Expand Toggle (Desktop Only) */}
          <button 
             onClick={toggleSidebar}
             className="absolute -left-3 top-24 w-6 h-12 bg-white border border-gray-100 rounded-full hidden lg:flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:shadow-lg transition-all z-[90]"
          >
             {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Sidebar Header */}
          <div className={cn("p-8 mb-4", !isOpen && "flex justify-center")}>
             {isOpen ? (
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">القائمة الرئيسية</h3>
                  {isMobile && <X size={20} className="text-gray-400" onClick={closeMobileSidebar} />}
               </div>
             ) : (
                <div className="w-8 h-1 bg-gray-100 rounded-full" />
             )}
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                    active 
                      ? `${item.bgColor} ${item.color} font-black shadow-sm` 
                      : "text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-900",
                    !isOpen && "justify-center px-0"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-500", active ? "scale-110" : "group-hover:rotate-12")} />
                  
                  {isOpen && (
                    <span className="text-sm whitespace-nowrap">{item.name}</span>
                  )}

                  {!isOpen && (
                    <div className="absolute right-full mr-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] translate-x-1 group-hover:translate-x-0 transition-all">
                      {item.name}
                    </div>
                  )}

                  {active && (
                    <motion.div 
                      layoutId="sidebar-active-indicator"
                      className="absolute left-2 w-1.5 h-6 bg-current rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Support Badge */}
          {isOpen && (
            <div className="p-6">
               <div className="bg-indigo-600 rounded-3xl p-5 text-white relative overflow-hidden group">
                  <div className="absolute -top-4 -left-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <p className="text-[10px] font-black text-indigo-100 uppercase mb-1">مرحبا بك يمكنك الان </p>
                  <h4 className="text-sm font-black mb-3 text-white"> التحكم كامل فى منصه Re7lty</h4>
                  <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black transition-colors">
                     افتح الدليل
                  </button>
               </div>
            </div>
          )}

          {/* Sign Out Button */}
          <div className="p-4 border-t border-gray-100 mt-auto">
             <button
                onClick={handleSignOut}
                className={cn(
                  "flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl transition-all duration-300 text-red-500 hover:bg-red-50 font-bold",
                  !isOpen && "justify-center px-0"
                )}
             >
                <LogOut className="h-5 w-5 shrink-0" />
                {isOpen && <span className="text-sm">تسجيل الخروج</span>}
                
                {!isOpen && (
                  <div className="absolute right-full mr-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] translate-x-1 group-hover:translate-x-0 transition-all">
                    تسجيل الخروج
                  </div>
                )}
             </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default AdminSidebar;
