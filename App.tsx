import React, { useState } from 'react';
import InvitationCard from './components/InvitationCard';
import RSVPForm from './components/RSVPForm';
import PhotoAlbum from './components/PhotoAlbum';
import AdminPanel from './components/AdminPanel';
import GiftPage from './components/GiftPage';
import { AppTab } from './types';
import { Mail, Image, Settings, Home, Gift } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.INVITATION);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.INVITATION:
        return <InvitationCard onNavigate={setActiveTab} />;
      case AppTab.RSVP:
        return <RSVPForm />;
      case AppTab.ALBUM:
        return <PhotoAlbum />;
      case AppTab.GIFTS:
        return <GiftPage />;
      case AppTab.ADMIN:
        return <AdminPanel />;
      default:
        return <InvitationCard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header/Banner for Mobile */}
      <header className="bg-white shadow-sm py-4 sticky top-0 z-30">
        <div className="text-center">
           <h1 
             onClick={() => setActiveTab(AppTab.INVITATION)}
             className="font-script text-3xl text-blue-900 cursor-pointer"
            >
             C & M
           </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 pb-24 max-w-5xl mx-auto w-full">
        {renderContent()}
      </main>

      {/* Bottom Navigation Bar (Mobile First) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab(AppTab.INVITATION)}
            className={`flex flex-col items-center justify-center w-full h-full ${activeTab === AppTab.INVITATION ? 'text-pink-600' : 'text-gray-400'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-bold">Convite</span>
          </button>
          
          <button 
            onClick={() => setActiveTab(AppTab.RSVP)}
            className={`flex flex-col items-center justify-center w-full h-full ${activeTab === AppTab.RSVP ? 'text-pink-600' : 'text-gray-400'}`}
          >
            <Mail className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-bold">RSVP</span>
          </button>

          <button 
            onClick={() => setActiveTab(AppTab.ALBUM)}
            className={`flex flex-col items-center justify-center w-full h-full ${activeTab === AppTab.ALBUM ? 'text-pink-600' : 'text-gray-400'}`}
          >
            <Image className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-bold">Álbum</span>
          </button>

          <button 
            onClick={() => setActiveTab(AppTab.GIFTS)}
            className={`flex flex-col items-center justify-center w-full h-full ${activeTab === AppTab.GIFTS ? 'text-pink-600' : 'text-gray-400'}`}
          >
            <Gift className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-bold">Presentes</span>
          </button>

          <button 
            onClick={() => setActiveTab(AppTab.ADMIN)}
            className={`flex flex-col items-center justify-center w-full h-full ${activeTab === AppTab.ADMIN ? 'text-pink-600' : 'text-gray-400'}`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-bold">Admin</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;