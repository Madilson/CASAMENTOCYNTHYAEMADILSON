import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { Copy, Gift, Heart, QrCode, Loader2 } from 'lucide-react';
import { PixConfig } from '../types';

const GiftPage: React.FC = () => {
  const [pixConfig, setPixConfig] = useState<PixConfig>({ qrCodeBase64: '', pixKey: '' });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await StorageService.getPixConfig();
        setPixConfig(config);
      } catch (e) {
        console.error("Error fetching PIX config", e);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleCopy = () => {
    if (pixConfig.pixKey) {
      navigator.clipboard.writeText(pixConfig.pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper function to determine which QR code to display
  const getQRCodeSource = () => {
    // 1. Prioritize uploaded image
    if (pixConfig.qrCodeBase64) {
      return pixConfig.qrCodeBase64;
    }
    // 2. Fallback to generated QR code from Key
    if (pixConfig.pixKey) {
      // Using a reliable public API to generate the QR code from the text key
      // Color db2777 matches Tailwind pink-600
      return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixConfig.pixKey)}&color=db2777`;
    }
    return null;
  };

  const qrCodeSrc = getQRCodeSource();

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-xl text-center border-t-4 border-pink-500 min-h-[500px] flex flex-col items-center">
      <div className="bg-pink-50 p-4 rounded-full mb-6">
        <Gift className="w-12 h-12 text-pink-600" />
      </div>

      <h2 className="text-3xl font-serif-display text-blue-900 mb-4">Para nos Presentear</h2>
      
      <p className="text-gray-600 mb-8 font-body leading-relaxed">
        Sua presença é o nosso maior presente, mas caso queira nos presentear, preferimos que seja em dinheiro para nossa Lua de Mel.
      </p>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600 mb-2"/>
            <p className="text-xs text-gray-500">Carregando dados...</p>
        </div>
      ) : pixConfig.pixKey || qrCodeSrc ? (
        <div className="w-full space-y-6">
          
          {qrCodeSrc && (
            <div className="flex flex-col items-center justify-center animate-fade-in">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white shadow-sm">
                <img 
                  src={qrCodeSrc} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 object-contain"
                />
              </div>
              {!pixConfig.qrCodeBase64 && (
                <p className="text-[10px] text-gray-400 mt-2 flex items-center">
                  <QrCode className="w-3 h-3 mr-1" />
                  Gerado automaticamente da chave
                </p>
              )}
            </div>
          )}

          {pixConfig.pixKey && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Chave PIX</p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm font-mono text-blue-900 bg-white p-2 rounded border truncate select-all">
                  {pixConfig.pixKey}
                </code>
                <button 
                  onClick={handleCopy}
                  className={`p-2 rounded transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  title="Copiar Chave"
                >
                  {copied ? <Heart className="w-5 h-5 fill-current" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              {copied && <p className="text-xs text-green-600 mt-2 font-bold animate-pulse">Chave Copiada!</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 bg-gray-50 rounded-lg border border-gray-200 w-full">
            <p className="text-gray-500 italic">Informações do PIX serão adicionadas em breve.</p>
        </div>
      )}

      <div className="mt-auto pt-8">
        <p className="font-script text-3xl text-pink-600">Obrigado pelo carinho!</p>
      </div>
    </div>
  );
};

export default GiftPage;