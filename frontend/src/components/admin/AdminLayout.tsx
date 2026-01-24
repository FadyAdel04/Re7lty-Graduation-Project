import { useState, useEffect } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import Footer from '../Footer';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMobileSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col font-cairo" dir="rtl">
      {/* Decorative Background Mesh */}
      <div className="fixed inset-0 pointer-events-none opacity-30 z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-100/50 rounded-full blur-[120px]" />
      </div>

      <div className="flex flex-1 relative z-10 w-full overflow-x-hidden">
        {/* Sidebar Space (for padding calculations on desktop) */}
        {!isMobile && (
          <motion.div 
             animate={{ width: isSidebarOpen ? 280 : 88 }}
             transition={{ duration: 0.3, ease: "easeInOut" }}
             className="hidden lg:block shrink-0 h-full"
          />
        )}

        {/* Sidebar Component */}
        <AdminSidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
          closeMobileSidebar={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
          
          <main className="flex-1 p-6 lg:p-10">
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.4 }}
             >
                {children}
             </motion.div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
