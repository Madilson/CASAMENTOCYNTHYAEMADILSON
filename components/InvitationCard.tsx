import React, { useState, useEffect } from 'react';
import { AppTab } from '../types';
import { StorageService } from '../services/storageService';
import { MapPin, Gift, Camera, CheckCircle2 } from 'lucide-react';

interface InvitationCardProps {
  onNavigate: (tab: AppTab) => void;
}

const InvitationCard: React.FC<InvitationCardProps> = ({ onNavigate }) => {
  const [coverPhoto, setCoverPhoto] = useState<string>('');

  useEffect(() => {
    // Carrega a foto de capa do backend (Google Sheets/Drive)
    const fetchCover = async () => {
        const stored = await StorageService.getCoverPhoto();
        if (stored) {
            setCoverPhoto(stored);
        } else {
            // Placeholder elegante caso não haja foto configurada
            setCoverPhoto('https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1470&auto=format&fit=crop'); 
        }
    };
    fetchCover();
  }, []);

  const handleOpenMap = () => {
     // Localização do evento
     window.open("https://maps.google.com/?q=Melville+Colina", "_blank");
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center relative overflow-x-hidden">
      
      {/* 1. HERO IMAGE SECTION (Top 55-60%) */}
      <div className="w-full h-[55vh] md:h-[65vh] relative">
        <div className="absolute inset-0 bg-gray-200">
            {coverPhoto && (
                <img 
                    src={coverPhoto} 
                    alt="Capa do Casamento" 
                    className="w-full h-full object-cover object-top animate-fade-in"
                />
            )}
        </div>
        {/* Gradient Fade to White */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
      </div>

      {/* 2. MAIN CONTENT (Overlapping or flowing from image) */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-6 -mt-20 md:-mt-32 pb-12 flex flex-col items-center text-center">
        
        {/* Names */}
        <div className="relative w-full mb-2">
            {/* Side Florals (SVG) - Left */}
            <div className="absolute -left-8 top-10 w-24 h-40 opacity-20 pointer-events-none hidden md:block">
                <svg viewBox="0 0 100 200" fill="none" className="w-full h-full">
                    <path d="M10 100 Q 30 50 80 20" stroke="#1e3a8a" strokeWidth="1" fill="none"/>
                    <ellipse cx="80" cy="20" rx="5" ry="8" fill="#1e3a8a" transform="rotate(-30 80 20)"/>
                    <ellipse cx="60" cy="40" rx="5" ry="8" fill="#1e3a8a" transform="rotate(-45 60 40)"/>
                    <ellipse cx="30" cy="80" rx="5" ry="8" fill="#1e3a8a" transform="rotate(-60 30 80)"/>
                </svg>
            </div>
             {/* Side Florals (SVG) - Right */}
             <div className="absolute -right-8 top-10 w-24 h-40 opacity-20 pointer-events-none transform scale-x-[-1] hidden md:block">
                <svg viewBox="0 0 100 200" fill="none" className="w-full h-full">
                    <path d="M10 100 Q 30 50 80 20" stroke="#1e3a8a" strokeWidth="1" fill="none"/>
                    <ellipse cx="80" cy="20" rx="5" ry="8" fill="#1e3a8a" transform="rotate(-30 80 20)"/>
                    <ellipse cx="60" cy="40" rx="5" ry="8" fill="#1e3a8a" transform="rotate(-45 60 40)"/>
                    <ellipse cx="30" cy="80" rx="5" ry="8" fill="#1e3a8a" transform="rotate(-60 30 80)"/>
                </svg>
            </div>

            <h1 className="text-blue-900 leading-none drop-shadow-sm flex flex-col items-center">
                <span className="font-script text-7xl md:text-8xl mb-2">Cynthya</span>
                <span className="font-serif-display text-3xl md:text-4xl text-fuchsia-700 my-1">&</span>
                <span className="font-script text-7xl md:text-8xl mt-2">Madilson</span>
            </h1>
        </div>

        {/* Invitation Text */}
        <p className="mt-8 text-blue-900 font-serif-display text-xs md:text-sm tracking-widest uppercase opacity-80">
            Convidam para cerimônia de seu
            <br />
            <span className="font-bold text-blue-900 text-base md:text-lg mt-1 block">Casamento</span>
        </p>
        
        {/* Quote if desired based on reference, kept subtle */}
        <p className="mt-6 max-w-xs mx-auto text-blue-900 font-serif-display italic text-[10px] md:text-xs leading-relaxed opacity-90">
            "Quanto ao nosso acordo, o Senhor é testemunha entre mim e você para sempre."
            <br/>
            <span className="not-italic font-bold mt-1 block">– 1 Samuel 20:23</span>
        </p>

        {/* Date Section - Reference Style */}
        <div className="mt-8 md:mt-10 w-full flex items-center justify-center space-x-2 md:space-x-4 text-blue-900">
            
            {/* Time */}
            <div className="flex flex-col items-center">
                <div className="border-t border-b border-blue-200 py-1 w-20 md:w-24">
                    <span className="block font-serif-display text-lg md:text-xl font-bold">16:00</span>
                </div>
            </div>

            {/* Day */}
            <div className="flex flex-col items-center mx-2">
                <span className="font-serif-display text-6xl md:text-7xl leading-none text-fuchsia-700">27</span>
                <span className="font-serif-display text-xs md:text-sm uppercase tracking-[0.3em] opacity-80 mt-2">Dezembro</span>
            </div>

            {/* Year */}
            <div className="flex flex-col items-center">
                <div className="border-t border-b border-blue-200 py-1 w-20 md:w-24">
                    <span className="block font-serif-display text-lg md:text-xl font-bold">2025</span>
                </div>
            </div>
        </div>

        {/* Call to Action Text */}
        <p className="mt-12 text-blue-900/60 font-body text-sm font-semibold tracking-wide">
            Toque nos ícones para interagir
        </p>

        {/* Icons Grid */}
        <div className="mt-6 flex flex-wrap justify-center gap-6 md:gap-8">
            
            {/* 1. Como Chegar */}
            <button onClick={handleOpenMap} className="flex flex-col items-center group">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-fuchsia-700 flex items-center justify-center text-white shadow-md transform transition-transform group-hover:scale-110 group-active:scale-95">
                    <MapPin className="w-6 h-6" />
                </div>
                <span className="mt-2 text-[10px] md:text-xs font-bold uppercase text-fuchsia-700 tracking-wider">Como<br/>Chegar</span>
            </button>

            {/* 2. RSVP */}
            <button onClick={() => onNavigate(AppTab.RSVP)} className="flex flex-col items-center group">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-fuchsia-700 flex items-center justify-center text-white shadow-md transform transition-transform group-hover:scale-110 group-active:scale-95">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="mt-2 text-[10px] md:text-xs font-bold uppercase text-fuchsia-700 tracking-wider">Confirmar<br/>Presença</span>
            </button>

            {/* 3. Gifts */}
            <button onClick={() => onNavigate(AppTab.GIFTS)} className="flex flex-col items-center group">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-fuchsia-700 flex items-center justify-center text-white shadow-md transform transition-transform group-hover:scale-110 group-active:scale-95">
                    <Gift className="w-6 h-6" />
                </div>
                <span className="mt-2 text-[10px] md:text-xs font-bold uppercase text-fuchsia-700 tracking-wider">Lista de<br/>Presentes</span>
            </button>

            {/* 4. Filter / Photos */}
            <button onClick={() => onNavigate(AppTab.ALBUM)} className="flex flex-col items-center group">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-fuchsia-700 flex items-center justify-center text-white shadow-md transform transition-transform group-hover:scale-110 group-active:scale-95">
                    <Camera className="w-6 h-6" />
                </div>
                <span className="mt-2 text-[10px] md:text-xs font-bold uppercase text-fuchsia-700 tracking-wider">Nosso<br/>Filtro</span>
            </button>

        </div>
      </div>
    </div>
  );
};

export default InvitationCard;