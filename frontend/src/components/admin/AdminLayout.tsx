import React from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import Footer from '../Footer';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AdminHeader />
      
      <div className="flex flex-1">
        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>

        {/* Fixed Sidebar */}
        <AdminSidebar />
      </div>

      <Footer />
    </div>
  );
};

export default AdminLayout;
