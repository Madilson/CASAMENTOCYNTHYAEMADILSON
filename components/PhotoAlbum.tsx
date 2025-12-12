import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { Photo } from '../types';
import { Camera, Heart, Trash2, Video, Loader2, Cloud, AlertTriangle } from 'lucide-react';

interface FlyingHeart {
  id: number;
  left: number; // horizontal offset
  delay: number;
  tx: number; // trajectory x
}

const PhotoAlbum: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaderName, setUploaderName] = useState('');
  const [caption, setCaption] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for animation
  const [flyingHearts, setFlyingHearts] = useState<Record<string, FlyingHeart[]>>({});
  const [bigHeartAnimations, setBigHeartAnimations] = useState<Record<string, boolean>>({});

  // State for Carousel
  const [currentSlide, setCurrentSlide] = useState(0);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadPhotos();
    setIsAdmin(StorageService.isAdminLoggedIn());
  }, []);

  const loadPhotos = async () => {
    setIsLoading(true);
    try {
        const loadedPhotos = await StorageService.getPhotos();
        setPhotos(loadedPhotos);
    } catch (e) {
        console.error("Failed to load photos", e);
    } finally {
        setIsLoading(false);
    }
  };

  // Filter for carousel: Only show images, not videos, to maintain header aesthetic
  const featuredPhotos = photos.filter(p => p.type !== 'video').slice(0, 5);

  // Carousel Auto-play effect
  useEffect(() => {
    if (featuredPhotos.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredPhotos.length);
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, [featuredPhotos.length]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if it's video and validate duration
      if (file.type.startsWith('video/')) {
         const video = document.createElement('video');
         video.preload = 'metadata';
         
         video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            // Validação estrita de 30 segundos
            if (video.duration > 30) {
                alert("O vídeo é muito longo. Por favor, envie um vídeo com no máximo 30 segundos.");
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                setShowUploadModal(true);
            }
         };
         
         video.onerror = () => {
             alert("Erro ao carregar o vídeo. Verifique o formato.");
             if (fileInputRef.current) fileInputRef.current.value = '';
         };
         
         video.src = URL.createObjectURL(file);
      } else {
         // Is image
         setShowUploadModal(true);
      }
    }
  };

  const submitPhoto = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !uploaderName) {
        alert("Por favor, selecione um arquivo e digite seu nome.");
        return;
    }

    setIsUploading(true);
    try {
      await StorageService.addPhoto(file, caption, uploaderName);
      
      // Feedback imediato
      alert("Arquivo enviado com sucesso para o Drive dos noivos! Ele aparecerá aqui em instantes.");
      
      await loadPhotos(); // Reload list
      setShowUploadModal(false);
      setCaption('');
      setUploaderName('');
      setCurrentSlide(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      alert(error.message || "Erro ao enviar arquivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerHeartAnimation = (photoId: string) => {
    // 1. Trigger Small Hearts
    const heartCount = 6;
    const newHearts: FlyingHeart[] = [];
    for (let i = 0; i < heartCount; i++) {
      newHearts.push({
        id: Date.now() + i,
        left: Math.random() * 40 - 20, // Random X start pos relative to center
        delay: Math.random() * 0.3,
        tx: Math.random() * 40 - 20, // Trajectory X
      });
    }
    setFlyingHearts(prev => ({ ...prev, [photoId]: newHearts }));

    // 2. Trigger Big Heart Burst
    setBigHeartAnimations(prev => ({ ...prev, [photoId]: true }));

    // Cleanup
    setTimeout(() => {
      setFlyingHearts(prev => {
        const newState = { ...prev };
        delete newState[photoId];
        return newState;
      });
    }, 1200);

    setTimeout(() => {
        setBigHeartAnimations(prev => ({ ...prev, [photoId]: false }));
    }, 800); // Match animation duration
  };

  const handleLike = async (id: string) => {
    triggerHeartAnimation(id);
    
    // Optimistic UI update
    setPhotos(prev => prev.map(p => 
        p.id === id ? { ...p, likes: p.likes + 1 } : p
    ));
    
    // Call backend
    await StorageService.likePhoto(id);
    // Reload to confirm (silent)
    const updated = await StorageService.getPhotos();
    setPhotos(updated);
  };

  const handleDeletePhoto = async (photoId: string) => {
    // Only logged in admins can see the button to trigger this
    if (window.confirm("Para excluir permanentemente, acesse sua Planilha Google ou Pasta do Drive. Esta ação aqui apenas recarregará a lista.")) {
        try {
            // Remove localmente primeiro
            setPhotos(prev => prev.filter(p => p.id !== photoId));
            
            // Chama o backend
            await StorageService.deletePhoto(photoId);
        } catch (e) {
            alert("Erro ao excluir. Recarregando lista...");
            loadPhotos();
        }
    }
  };

  const handleDownloadFramed = (photoUrl: string) => {
    // Aviso de CORS para imagens do Drive
    alert("Gerando moldura... Se a imagem não carregar devido a permissões do Google, o download da original iniciará automaticamente.");

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.crossOrigin = "anonymous"; 
    img.src = photoUrl;

    img.onload = () => {
        // Define dimensions for Higher Quality Download (Increased Resolution)
        const padding = 100;
        const bottomTextSpace = 450; 
        const targetWidth = 1800; // Increased from 1200 for better quality
        const scale = targetWidth / img.width;
        const targetHeight = img.height * scale;

        // Set canvas size
        canvas.width = targetWidth + (padding * 2);
        canvas.height = targetHeight + (padding * 2) + bottomTextSpace;

        if (!ctx) return;

        // 1. Draw White Background (Card Stock effect)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Draw Image with Shadow for Depth
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
        ctx.drawImage(img, padding, padding, targetWidth, targetHeight);
        ctx.restore();

        // 3. Draw Outer Decorative Border (Double Line)
        ctx.strokeStyle = '#e2e8f0'; // Light gray
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
        
        ctx.strokeStyle = '#cbd5e1'; // Slightly darker gray
        ctx.lineWidth = 1;
        ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);

        // 4. Text Configuration
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const centerX = canvas.width / 2;
        const footerCenterY = padding + targetHeight + (bottomTextSpace / 2);

        // -- Text: Casamento
        ctx.font = '36px "Cinzel", serif';
        ctx.fillStyle = '#9ca3af'; // gray-400
        ctx.fillText('CASAMENTO', centerX, footerCenterY - 130);

        // -- Text: Names (Cynthya & Madilson)
        ctx.font = '130px "Great Vibes", cursive'; // Larger name
        ctx.fillStyle = '#1e3a8a'; // blue-900
        ctx.fillText('Cynthya & Madilson', centerX, footerCenterY - 40);
        
        // -- Text: Date
        ctx.font = 'bold 42px "Cinzel", serif';
        ctx.fillStyle = '#a21caf'; // fuchsia-700
        ctx.fillText('27 . 12 . 2025', centerX, footerCenterY + 40);

        // -- Text: Verse (BOLD as requested)
        // Using "bold italic" to make it stand out strongly
        ctx.font = 'bold italic 34px "Cinzel", serif'; 
        ctx.fillStyle = '#374151'; // gray-700 (darker for readability)
        const verseText = '"Acima de tudo, porém, revistam-se do amor, que é o elo perfeito."';
        ctx.fillText(verseText, centerX, footerCenterY + 110);

        ctx.font = 'bold 26px "Cinzel", serif';
        ctx.fillStyle = '#1e3a8a'; // blue-900
        ctx.fillText('Colossenses 3:14', centerX, footerCenterY + 160);

        // 5. Trigger Download
        try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95); // High quality JPG
            const link = document.createElement('a');
            link.download = `Lembranca-Cynthya-Madilson-${Date.now()}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (e) {
            console.error("Canvas export failed", e);
            // Fallback
            const link = document.createElement('a');
            link.href = photoUrl;
            link.download = 'foto-casamento.jpg';
            link.click();
        }
    };
    
    img.onerror = () => {
         const link = document.createElement('a');
         link.href = photoUrl;
         link.target = "_blank";
         link.download = 'foto-casamento.jpg';
         link.click();
    };
  };

  return (
    <div className="pb-20 max-w-2xl mx-auto">
      
      {/* Elegant Header Frame */}
      <div className="mb-8 mt-2 relative p-8 bg-white rounded-sm shadow-sm border border-blue-50 overflow-hidden mx-4 md:mx-0">
          {/* Decorative Corner Borders */}
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-blue-200"></div>
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-blue-200"></div>
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-blue-200"></div>
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-blue-200"></div>
          
          {/* Inner Double Border Frame */}
          <div className="absolute inset-4 border-2 border-double border-blue-900/10 pointer-events-none"></div>

          <div className="relative z-10 text-center">
              <p className="font-serif-display text-[10px] md:text-xs tracking-[0.4em] text-gray-400 uppercase mb-2">
                  Casamento
              </p>
              <h1 className="font-script text-5xl md:text-6xl text-blue-900 mb-3 leading-tight">
                  Cynthya <span className="text-fuchsia-700 text-3xl align-middle">&</span> Madilson
              </h1>
              <div className="flex items-center justify-center gap-3">
                  <span className="h-px w-8 bg-blue-200/50"></span>
                  <span className="font-serif-display text-sm md:text-base text-blue-800 font-semibold tracking-widest">
                      27 . 12 . 2025
                  </span>
                  <span className="h-px w-8 bg-blue-200/50"></span>
              </div>
              
              {/* Verse Display (Screen) */}
              <div className="mt-4 max-w-md mx-auto">
                <p className="font-serif-display text-gray-700 font-bold italic text-xs md:text-sm leading-relaxed drop-shadow-sm">
                    "Acima de tudo, porém, revistam-se do amor, que é o elo perfeito."
                </p>
                <p className="font-serif-display text-blue-900 font-bold text-[10px] uppercase tracking-widest mt-1">
                    Colossenses 3:14
                </p>
              </div>
          </div>
      </div>

      {/* Carousel Section */}
      {featuredPhotos.length > 0 && (
        <div className="relative w-full h-64 md:h-80 mb-8 rounded-xl overflow-hidden shadow-xl bg-gray-200 group">
          {featuredPhotos.map((photo, index) => (
            <div 
              key={photo.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <img 
                src={photo.url} 
                alt="Featured memory" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
                 <p className="text-white font-serif-display text-sm tracking-wide opacity-90">
                    Postado por {photo.uploader}
                 </p>
                 {photo.caption && (
                    <p className="text-white/80 text-xs italic mt-1 truncate">{photo.caption}</p>
                 )}
              </div>
            </div>
          ))}

          {/* Carousel Indicators */}
          <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center space-x-2">
            {featuredPhotos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full shadow-sm ${
                  idx === currentSlide 
                    ? 'w-6 h-1.5 bg-white' 
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload Header */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 text-center border-b-4 border-pink-500">
        <h2 className="text-2xl font-serif-display text-blue-900 mb-2">Álbum de Casamento</h2>
        <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4 text-sm">
            <Cloud className="w-4 h-4 text-blue-500" />
            <span>As fotos são salvas no Google Drive dos noivos!</span>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,video/*"
          onChange={handleFileChange}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-pink-600 text-white px-6 py-2 rounded-full flex items-center justify-center space-x-2 mx-auto hover:bg-pink-700 transition-colors shadow-lg active:scale-95 transform"
        >
          <Camera className="w-5 h-5" />
          <span>Postar Foto / Vídeo</span>
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Detalhes do Upload</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Seu nome"
                value={uploaderName}
                onChange={e => setUploaderName(e.target.value)}
                className="w-full border border-slate-600 bg-slate-800 text-white placeholder-slate-400 p-2 rounded focus:ring-2 focus:ring-pink-500 outline-none"
              />
              <input
                type="text"
                placeholder="Legenda (opcional)"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="w-full border border-slate-600 bg-slate-800 text-white placeholder-slate-400 p-2 rounded focus:ring-2 focus:ring-pink-500 outline-none"
              />
              <div className="flex space-x-2">
                <button 
                  onClick={submitPhoto} 
                  disabled={isUploading}
                  className="flex-1 bg-blue-900 text-white py-2 rounded hover:bg-blue-800 disabled:opacity-50 transition-colors flex justify-center items-center"
                >
                  {isUploading ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/> Enviando...</> : 'Publicar'}
                </button>
                <button 
                  onClick={() => {
                      setShowUploadModal(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                  }} 
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-6">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <Loader2 className="w-10 h-10 text-blue-900 animate-spin" />
                <p className="text-sm text-gray-500">Buscando memórias no Drive...</p>
            </div>
        ) : photos.length === 0 ? (
            <div className="text-center p-8 text-gray-500 flex flex-col items-center">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                    <p className="flex items-center text-yellow-700 text-sm mb-2">
                        <AlertTriangle className="w-4 h-4 mr-2" /> 
                        Álbum não conectado
                    </p>
                    <p className="text-xs text-yellow-800 text-left">
                        O sistema de armazenamento no Google Drive ainda não foi configurado ou a URL está incorreta.
                        <br/><br/>
                        <strong>Para o administrador:</strong> Adicione a URL do Web App (exec) no arquivo <code>storageService.ts</code>.
                    </p>
                </div>
                <span className="italic">Seja o primeiro a compartilhar uma lembrança quando o sistema estiver online!</span>
            </div>
        ) : (
            photos.map((photo, index) => (
            <div key={photo.id} className="bg-white rounded-sm shadow-md overflow-hidden border border-gray-100 transition-all hover:shadow-xl">
                {/* Header: User Info */}
                <div className="p-3 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 text-blue-900 flex items-center justify-center font-bold text-sm">
                    {/* SAFE STRING CONVERSION FIX HERE */}
                    {String(photo.uploader || 'A').charAt(0).toUpperCase()}
                    </div>
                    <span className="ml-2 font-semibold text-sm text-gray-800">{photo.uploader || 'Anônimo'}</span>
                </div>
                
                {isAdmin && (
                    <button 
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="text-gray-300 hover:text-red-500 p-1 rounded-full transition-colors"
                    title="Excluir"
                    >
                    <Trash2 className="w-4 h-4" />
                    </button>
                )}
                </div>
                
                {/* Media Container with Visual Frame Effect */}
                <div className="p-2 bg-white relative">
                    <div 
                        className="relative overflow-hidden border border-gray-100 bg-black flex items-center justify-center min-h-[200px]"
                        onDoubleClick={() => handleLike(photo.id)}
                    >
                        {photo.type === 'video' ? (
                            <video 
                                src={photo.url} 
                                className="w-full h-auto max-h-[500px] object-contain block"
                                controls
                            />
                        ) : (
                            <img 
                                src={photo.url} 
                                alt={photo.caption} 
                                className="w-full h-auto max-h-96 object-cover block"
                                loading="lazy"
                            />
                        )}

                        {/* BIG HEART ANIMATION OVERLAY */}
                        {bigHeartAnimations[photo.id] && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                <Heart className="w-32 h-32 text-white fill-white drop-shadow-2xl animate-heart-burst" />
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Action Bar */}
                <div className="px-4 py-3 bg-white">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <button 
                        onClick={() => handleLike(photo.id)} 
                        className="flex items-center space-x-1 text-gray-600 hover:text-red-500 relative group"
                        >
                        <Heart className={`w-6 h-6 transition-transform duration-200 active:scale-125 ${photo.likes > 0 ? 'text-red-500 fill-red-500' : ''}`} />
                        <span className="text-sm font-medium">{photo.likes}</span>

                        {/* Floating Hearts Animation (Small confetti) */}
                        {flyingHearts[photo.id]?.map((heart) => (
                            <Heart 
                            key={heart.id}
                            className="w-5 h-5 text-red-500 fill-red-500 absolute bottom-4 animate-float-heart pointer-events-none"
                            style={{
                                left: `${heart.left}px`,
                                animationDelay: `${heart.delay}s`,
                                // @ts-ignore
                                '--tx': `${heart.tx}px`
                            }}
                            />
                        ))}
                        </button>
                    </div>

                    {/* Download Buttons Group */}
                    <div className="flex items-center space-x-2">
                        {/* Save with Frame Button (Images only) */}
                        {photo.type !== 'video' && (
                            <button 
                                onClick={() => handleDownloadFramed(photo.url)}
                                className="flex items-center space-x-1 text-fuchsia-700 hover:text-fuchsia-900 bg-fuchsia-50 hover:bg-fuchsia-100 px-3 py-1.5 rounded-full transition-colors"
                                title="Baixar Lembrança com Moldura"
                            >
                                <Camera className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wide hidden sm:inline">Lembrança</span>
                                <span className="sm:hidden"><Camera className="w-4 h-4"/></span>
                            </button>
                        )}
                    </div>
                </div>

                {photo.caption && (
                    <p className="text-gray-800 text-sm mb-2">
                    <span className="font-bold mr-2 text-blue-900">{photo.uploader || 'Anônimo'}</span>
                    {photo.caption}
                    </p>
                )}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default PhotoAlbum;