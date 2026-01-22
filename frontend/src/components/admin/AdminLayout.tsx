import { useState, useEffect } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import Footer from '../Footer';

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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
      
      <div className="flex flex-1 relative">
        {/* Main Content */}
        <main 
          className="flex-1 p-4 transition-all duration-300 ease-in-out"
        >
          {children}
        </main>

        {/* Sidebar */}
        <AdminSidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
          closeMobileSidebar={() => setIsSidebarOpen(false)}
        />
      </div>

      <Footer />
    </div>
  );
};

export default AdminLayout;
