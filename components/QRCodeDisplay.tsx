import React from 'react';
import { Share2 } from 'lucide-react';

const QRCodeDisplay: React.FC = () => {
  // Using a public API for QR code generation to avoid heavy dependencies in this demo environment
  // In a real production app, one might use 'qrcode.react' or similar.
  // The URL encoded here is a placeholder for the deployed app URL.
  const appUrl = "https://cynthya-madilson-casamento.vercel.app"; // Hypothetical URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(appUrl)}&color=1e3a8a`;

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-xl text-center flex flex-col items-center">
      <h2 className="text-2xl font-serif-display text-blue-900 mb-2">Compartilhe o Amor</h2>
      <p className="text-gray-600 mb-6 text-sm">
        Escaneie para acessar o convite, confirmar presença e ver as fotos.
      </p>
      
      <div className="p-4 border-4 border-double border-pink-300 rounded-lg bg-white mb-6">
        <img 
          src={qrCodeUrl} 
          alt="QR Code do Casamento" 
          className="w-48 h-48 object-contain"
        />
      </div>

      <div className="flex space-x-2 text-blue-900 font-bold bg-blue-50 px-4 py-2 rounded-full">
        <Share2 className="w-5 h-5" />
        <span className="text-sm">Convite Oficial</span>
      </div>
      
      <p className="mt-8 text-xs text-gray-400">
        Salve esta imagem e envie para seus amigos e familiares.
      </p>
    </div>
  );
};

export default QRCodeDisplay;