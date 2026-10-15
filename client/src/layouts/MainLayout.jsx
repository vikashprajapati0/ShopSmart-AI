import React from 'react';
import { Outlet } from 'react-router-dom';
import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIAssistantModal from '../components/AIAssistantModal';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AIAssistantModal />
    </div>
  );
};

export default MainLayout;
