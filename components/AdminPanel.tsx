import React, { useState, useEffect, useRef } from 'react';
import { StorageService, BACKEND_SETUP_CODE } from '../services/storageService';
import { Guest, Photo, PixConfig } from '../types';
import { Lock, LogOut, Trash2, Settings, Key, Check, Users, Image as ImageIcon, Gift, Upload, MessageCircle, X, Heart, CheckSquare, Square, AlertTriangle, Video, Play, Loader2, RefreshCw, FileSpreadsheet, Code, Copy, Link } from 'lucide-react';

type AdminTab = 'GUESTS' | 'PHOTOS' | 'SETTINGS';

const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<AdminTab>('GUESTS');
  
  // Data States
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false); 

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  
  // Deletion States
  const [isDeleting, setIsDeleting] = useState(false);
  const [photosToDelete, setPhotosToDelete] = useState<Photo[]>([]); // Controls the delete modal
  
  // Settings States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsMsg, setSettingsMsg] = useState({ text: '', type: '' });
  const [showScriptModal, setShowScriptModal] = useState(false);
  
  // URL Setting State
  const [scriptUrl, setScriptUrl] = useState('');
  
  // Pix Settings States
  const [pixKey, setPixKey] = useState('');
  const [pixQrCode, setPixQrCode] = useState('');
  const [isSavingPix, setIsSavingPix] = useState(false);
  const pixFileInputRef = useRef<HTMLInputElement>(null);

  // Cover Photo State
  const [coverPhoto, setCoverPhoto] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);

  // Demo Warning State
  const [showDemoWarning, setShowDemoWarning] = useState(true);

  useEffect(() => {
    if (StorageService.isAdminLoggedIn()) {
        setIsAuthenticated(true);
        loadData();
        loadSettingsData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPassword = StorageService.getAdminPassword();
    if (username === 'admin' && password === storedPassword) {
      StorageService.loginAdmin();
      setIsAuthenticated(true);
      loadData();
      loadSettingsData();
      setError('');
    } else {
      setError('Credenciais inválidas');
    }
  };

  const handleLogout = () => {
      StorageService.logoutAdmin();
      setIsAuthenticated(false);
  };

  const loadData = async () => {
    setIsLoadingGuests(true);
    try {
        const loadedGuests = await StorageService.getGuests();
        setGuests(loadedGuests);
    } catch (e) {
        console.error("Erro ao carregar convidados:", e);
    } finally {
        setIsLoadingGuests(false);
    }
    
    setIsLoadingPhotos(true);
    try {
        const loadedPhotos = await StorageService.getPhotos();
        setPhotos(loadedPhotos);
    } catch(e) {
        console.error(e);
    } finally {
        setIsLoadingPhotos(false);
    }
  };
  
  const loadSettingsData = async () => {
      setScriptUrl(StorageService.getScriptUrl());
      
      try {
        // Load all config (Pix + Cover) from backend
        const config = await StorageService.getConfig();
        setPixKey(config.pixKey);
        setPixQrCode(config.pixQrCode);
        setCoverPhoto(config.coverPhoto);
      } catch (e) {
        console.error("Error loading config", e);
      }
  };

  const handleCopyScript = () => {
      navigator.clipboard.writeText(BACKEND_SETUP_CODE);
      setSettingsMsg({ text: 'Código copiado para a área de transferência!', type: 'success' });
      setTimeout(() => setSettingsMsg({ text: '', type: '' }), 3000);
  };

  // --- Guest Actions ---
  const handleDeleteGuest = async (id: string) => {
      // Confirmação removida conforme solicitado
      setIsDeleting(true);
      try {
          // Remove localmente primeiro para feedback instantâneo (Optimistic Update)
          setGuests(prev => prev.filter(g => g.id !== id));
          
          // Chama o backend
          await StorageService.deleteGuest(id);
      } catch (err) {
          alert('Erro ao excluir convidado. Verifique a conexão. A página será recarregada.');
          loadData(); // Reverte se falhar
      } finally {
          setIsDeleting(false);
      }
  };

  // --- Photo Deletion Logic ---

  // Triggered by single delete button on photo card
  const confirmDeleteSinglePhoto = (e: React.MouseEvent, photo: Photo) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotosToDelete([photo]);
  };

  // Triggered by bulk delete button
  const confirmDeleteBulkPhotos = () => {
    if (selectedPhotoIds.length === 0) return;
    const photosToConfirm = photos.filter(p => selectedPhotoIds.includes(p.id));
    setPhotosToDelete(photosToConfirm);
  };

  // Executed when user confirms in the modal
  const executeDeletePhotos = async () => {
    if (photosToDelete.length === 0) return;

    setIsDeleting(true);
    const idsToDelete = photosToDelete.map(p => p.id);
    
    try {
        // Optimistic UI Update
        setPhotos(prev => prev.filter(p => !idsToDelete.includes(p.id)));
        setSelectedPhotoIds(prev => prev.filter(pid => !idsToDelete.includes(pid)));
        
        // If the currently viewed photo is deleted, close the view modal
        if (selectedPhoto && idsToDelete.includes(selectedPhoto.id)) {
            setSelectedPhoto(null);
        }

        // Call Service
        if (idsToDelete.length === 1) {
            await StorageService.deletePhoto(idsToDelete[0]);
        } else {
            await StorageService.deletePhotos(idsToDelete);
        }

        // Close modal after success
        setPhotosToDelete([]);

    } catch (err: any) {
        alert(err.message || "Erro ao excluir foto(s).");
        // Revert on error
        loadData();
    } finally {
        setIsDeleting(false);
    }
  };

  // --- Bulk Selection Logic ---
  const togglePhotoSelection = (id: string) => {
      setSelectedPhotoIds(prev => 
          prev.includes(id) 
              ? prev.filter(pId => pId !== id) 
              : [...prev, id]
      );
  };

  const handleSelectAll = () => {
      if (selectedPhotoIds.length === photos.length) {
          setSelectedPhotoIds([]); // Deselect all
      } else {
          setSelectedPhotoIds(photos.map(p => p.id)); // Select all
      }
  };

  const handleDeleteComment = async (photoId: string, commentId: string) => {
      if (window.confirm('Excluir este comentário?')) {
          const updatedPhotos = await StorageService.deleteComment(photoId, commentId);
          setPhotos(updatedPhotos);
          
          // Update the selected photo in the modal view
          const updatedSelected = updatedPhotos.find(p => p.id === photoId);
          if (updatedSelected) {
              setSelectedPhoto(updatedSelected);
          }
      }
  };

  // --- Settings Actions ---
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
        setSettingsMsg({ text: 'A senha não pode ser vazia.', type: 'error' });
        return;
    }
    if (newPassword !== confirmPassword) {
        setSettingsMsg({ text: 'As senhas não coincidem.', type: 'error' });
        return;
    }
    
    StorageService.setAdminPassword(newPassword);
    setSettingsMsg({ text: 'Senha de administrador atualizada!', type: 'success' });
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSettingsMsg({ text: '', type: '' }), 3000);
  };

  const handleSaveScriptUrl = () => {
      if (!scriptUrl.trim() || !scriptUrl.startsWith('https://script.google.com')) {
          setSettingsMsg({ text: 'URL inválida. Deve começar com https://script.google.com', type: 'error' });
          return;
      }
      StorageService.setScriptUrl(scriptUrl.trim());
      setSettingsMsg({ text: 'URL do Script atualizada com sucesso!', type: 'success' });
      setTimeout(() => setSettingsMsg({ text: '', type: '' }), 3000);
      
      // Reload data to test connection
      loadData();
  };

  const handlePixUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setPixQrCode(reader.result as string);
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const handleSavePix = async () => {
      setIsSavingPix(true);
      setSettingsMsg({ text: 'Salvando no Google Sheets...', type: 'success' });
      try {
        await StorageService.savePixConfig({ pixKey, qrCodeBase64: pixQrCode });
        setSettingsMsg({ text: 'Configurações do PIX salvas!', type: 'success' });
      } catch (e: any) {
        setSettingsMsg({ text: 'Erro ao salvar PIX: ' + e.message, type: 'error' });
      } finally {
        setIsSavingPix(false);
        setTimeout(() => setSettingsMsg({ text: '', type: '' }), 4000);
      }
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        setIsUploadingCover(true);
        setSettingsMsg({ text: 'Enviando imagem para o Drive...', type: 'success' }); // Info message
        
        try {
            // Agora faz o upload real para o Drive
            const driveUrl = await StorageService.saveCoverPhoto(file);
            setCoverPhoto(driveUrl);
            setSettingsMsg({ text: 'Capa enviada e salva com sucesso!', type: 'success' });
        } catch (error: any) {
            console.error(error);
            setSettingsMsg({ text: error.message || 'Erro ao enviar capa', type: 'error' });
        } finally {
            setIsUploadingCover(false);
            setTimeout(() => setSettingsMsg({ text: '', type: '' }), 4000);
        }
    }
  };

  const handleRemoveCoverPhoto = () => {
      // Aqui apenas removemos a referência local, não deletamos do Drive (segurança)
      localStorage.removeItem('wedding_app_cover_photo');
      setCoverPhoto('');
      setSettingsMsg({ text: 'Foto da capa removida (do app).', type: 'success' });
      setTimeout(() => setSettingsMsg({ text: '', type: '' }), 3000);
  };

  // Calculate totals safely
  const totalAdults = guests.reduce((sum, g) => sum + (Number(g.adults) || 0), 0);
  const totalKids = guests.reduce((sum, g) => sum + (Number(g.children) || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl border-t-4 border-blue-900">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Lock className="w-6 h-6 text-blue-900" />
          </div>
        </div>
        <h2 className="text-center text-xl font-bold text-blue-900 mb-4">Área Restrita</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Usuário</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-slate-600 bg-slate-800 text-white placeholder-slate-400 p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-600 bg-slate-800 text-white p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden mb-20 relative">
      {/* Header */}
      <div className="bg-blue-900 text-white p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif-display">Painel Administrativo</h2>
          <p className="text-blue-200 text-sm">Olá, {username || 'Admin'}</p>
        </div>
        <button 
            onClick={handleLogout} 
            className="p-2 rounded-full text-blue-200 hover:text-white hover:bg-blue-800"
            title="Sair"
        >
            <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-gray-50">
          <button 
            onClick={() => setActiveTab('GUESTS')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide flex items-center justify-center space-x-2 ${activeTab === 'GUESTS' ? 'bg-white text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
              <Users className="w-4 h-4" />
              <span>Convidados</span>
          </button>
          <button 
            onClick={() => setActiveTab('PHOTOS')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide flex items-center justify-center space-x-2 ${activeTab === 'PHOTOS' ? 'bg-white text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
              <ImageIcon className="w-4 h-4" />
              <span>Fotos</span>
          </button>
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide flex items-center justify-center space-x-2 ${activeTab === 'SETTINGS' ? 'bg-white text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
          </button>
      </div>

      {/* Content */}
      <div className="p-6">
        
        {/* Persistence Warning */}
        {showDemoWarning && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 relative rounded-r shadow-sm">
                <div className="flex items-start">
                    <FileSpreadsheet className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                        <p className="font-bold mb-1">Integração com Planilha</p>
                        <p className="leading-relaxed">
                            Dados salvos na aba <strong>"Convidados"</strong> do seu Google Sheets.<br/>
                            Certifique-se de atualizar o código do seu Script caso tenha problemas.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowDemoWarning(false)} 
                    className="absolute top-2 right-2 text-amber-400 hover:text-amber-600"
                >
                   <X className="w-4 h-4" />
                </button>
            </div>
        )}

        {/* GUESTS TAB */}
        {activeTab === 'GUESTS' && (
            <div className="animate-fade-in">
                {/* Refresh Toolbar */}
                <div className="flex justify-between items-center mb-4">
                     <p className="text-gray-500 text-sm">Lista: Aba "Convidados" (Sheets)</p>
                     <button 
                        onClick={loadData}
                        disabled={isLoadingGuests}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full transition-colors text-sm font-bold"
                     >
                        <RefreshCw className={`w-4 h-4 ${isLoadingGuests ? 'animate-spin' : ''}`} />
                        <span>Atualizar Lista</span>
                     </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded border border-blue-100 text-center">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Total Confirmado</p>
                    <p className="text-3xl font-bold text-blue-900">{isLoadingGuests ? '...' : guests.length}</p>
                    </div>
                    <div className="bg-pink-50 p-4 rounded border border-pink-100 text-center">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Adultos</p>
                    <p className="text-3xl font-bold text-pink-600">{isLoadingGuests ? '...' : totalAdults}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded border border-blue-100 text-center">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Crianças</p>
                    <p className="text-3xl font-bold text-blue-500">{isLoadingGuests ? '...' : totalKids}</p>
                    </div>
                </div>

                <div className="overflow-x-auto border rounded-lg relative min-h-[200px]">
                    {isLoadingGuests && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                             <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
                        </div>
                    )}
                    <table className="w-full text-left">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Nome</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Adultos</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Crianças</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm hidden md:table-cell">Mensagem</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {guests.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                {isLoadingGuests ? "Carregando lista..." : "Nenhuma confirmação encontrada na planilha."}
                            </td>
                        </tr>
                        ) : (
                        guests.map(guest => (
                            <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-medium text-gray-800">{guest.name}</td>
                            <td className="p-4 text-gray-600">{guest.adults}</td>
                            <td className="p-4 text-gray-600">{guest.children}</td>
                            <td className="p-4 text-gray-500 text-sm italic truncate max-w-xs hidden md:table-cell">
                                {guest.message || "-"}
                            </td>
                            <td className="p-4">
                                <button 
                                onClick={() => handleDeleteGuest(guest.id)}
                                disabled={isDeleting}
                                className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 disabled:opacity-50"
                                title="Remover"
                                >
                                <Trash2 className="w-5 h-5" />
                                </button>
                            </td>
                            </tr>
                        ))
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* PHOTOS TAB */}
        {activeTab === 'PHOTOS' && (
            <div className="animate-fade-in">
                {/* Bulk Actions Bar */}
                <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={handleSelectAll}
                            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-900 font-medium"
                        >
                            {selectedPhotoIds.length > 0 && selectedPhotoIds.length === photos.length ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                                <Square className="w-5 h-5" />
                            )}
                            <span>Selecionar Tudo</span>
                        </button>
                        <span className="text-sm text-gray-400">
                            {selectedPhotoIds.length} selecionada(s)
                        </span>
                    </div>

                    {selectedPhotoIds.length > 0 && (
                        <button 
                            onClick={confirmDeleteBulkPhotos}
                            disabled={isDeleting}
                            className="flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200 transition-colors text-sm font-bold disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Excluir ({selectedPhotoIds.length}) Selecionadas</span>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {isLoadingPhotos ? (
                         <div className="col-span-full py-12 flex justify-center">
                            <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
                        </div>
                    ) : photos.map(photo => {
                        const isSelected = selectedPhotoIds.includes(photo.id);
                        return (
                            <div 
                                key={photo.id} 
                                className={`group relative aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm cursor-pointer border-2 transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'}`}
                                onClick={() => togglePhotoSelection(photo.id)}
                            >
                                {photo.type === 'video' ? (
                                    <video src={photo.url} className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-80' : 'opacity-100'} ${isDeleting ? 'opacity-50' : ''}`} />
                                ) : (
                                    <img src={photo.url} alt="User upload" className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-80' : 'opacity-100'} ${isDeleting ? 'opacity-50' : ''}`} />
                                )}
                                
                                {photo.type === 'video' && (
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/80 z-0 pointer-events-none">
                                        <Play className="w-8 h-8 fill-current" />
                                    </div>
                                )}

                                <div className="absolute top-2 left-2 z-20">
                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white/70 border-gray-400 group-hover:bg-white'}`}>
                                        {isSelected && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                </div>
                                
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                    <div className="pointer-events-auto flex space-x-2">
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedPhoto(photo); }}
                                            className="bg-white text-blue-900 p-2 rounded-full hover:bg-blue-50 shadow-lg transform transition-transform hover:scale-110"
                                            title="Ver Comentários"
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={(e) => confirmDeleteSinglePhoto(e, photo)}
                                            disabled={isDeleting}
                                            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-lg transform transition-transform hover:scale-110 disabled:opacity-50"
                                            title="Excluir Foto"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate flex justify-between px-2">
                                    <span>{photo.uploader}</span>
                                    <span className="flex items-center"><MessageCircle className="w-3 h-3 mr-1"/>{photo.comments.length}</span>
                                </div>
                            </div>
                        );
                    })}
                    {!isLoadingPhotos && photos.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            O álbum está vazio.
                        </div>
                    )}
                </div>

                {selectedPhoto && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                                <h3 className="font-bold text-blue-900">Gerenciar Comentários</h3>
                                <button onClick={() => setSelectedPhoto(null)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="p-4 overflow-y-auto flex-1">
                                <div className="flex items-center space-x-4 mb-4">
                                    {selectedPhoto.type === 'video' ? (
                                        <video src={selectedPhoto.url} className="w-16 h-16 object-cover rounded" controls />
                                    ) : (
                                        <img src={selectedPhoto.url} className="w-16 h-16 object-cover rounded" alt="Thumbnail" />
                                    )}
                                    
                                    <div>
                                        <p className="font-bold text-sm text-gray-800">Postado por: {selectedPhoto.uploader}</p>
                                        <p className="text-xs text-gray-500">{selectedPhoto.caption}</p>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{selectedPhoto.type === 'video' ? 'Vídeo' : 'Foto'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wide">Comentários ({selectedPhoto.comments.length})</h4>
                                    {selectedPhoto.comments.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">Nenhum comentário nesta foto.</p>
                                    ) : (
                                        selectedPhoto.comments.map(comment => (
                                            <div key={comment.id} className="bg-gray-50 p-3 rounded flex justify-between items-start border border-gray-100">
                                                <div>
                                                    <p className="text-sm font-bold text-blue-900">{comment.author}</p>
                                                    <p className="text-sm text-gray-700">{comment.text}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(comment.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteComment(selectedPhoto.id, comment.id)}
                                                    className="text-gray-400 hover:text-red-500 p-1"
                                                    title="Excluir Comentário"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-4 border-t bg-gray-50 rounded-b-lg text-right">
                                <button 
                                    onClick={() => setSelectedPhoto(null)} 
                                    className="bg-blue-900 text-white px-4 py-2 rounded text-sm hover:bg-blue-800"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'SETTINGS' && (
            <div className="animate-fade-in space-y-8">
                {settingsMsg.text && (
                    <div className={`p-4 rounded border ${settingsMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                        {settingsMsg.text}
                    </div>
                )}

                {/* --- GOOGLE SCRIPT SETUP BUTTON --- */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center">
                        <Code className="w-5 h-5 mr-2" />
                        Instalação do Backend
                    </h3>
                    <p className="text-sm text-blue-800 mb-4">
                        Para que o sistema salve convidados e fotos no Google Sheets/Drive, você precisa atualizar o código do Apps Script.
                    </p>
                    <button 
                        onClick={() => setShowScriptModal(true)}
                        className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 flex items-center shadow-sm"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Ver Script de Instalação
                    </button>
                </div>

                {/* --- SCRIPT URL CONFIGURATION --- */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                        <Link className="w-5 h-5 mr-2" />
                        Conexão (URL do App da Web)
                    </h3>
                    <div className="space-y-4 max-w-full">
                         <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-100">
                            Cole aqui a URL gerada ao implantar seu Apps Script como "App da Web" (exec).
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL do Script (Exec)</label>
                            <input 
                                type="text"
                                value={scriptUrl}
                                onChange={e => setScriptUrl(e.target.value)}
                                className="w-full border border-slate-600 bg-slate-800 text-white placeholder-slate-400 p-2 rounded outline-none font-mono text-xs"
                                placeholder="https://script.google.com/macros/s/.../exec"
                            />
                        </div>
                        <button 
                            onClick={handleSaveScriptUrl}
                            className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 flex items-center"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Salvar URL
                        </button>
                    </div>
                </div>

                {/* Cover Photo Settings */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                        <Heart className="w-5 h-5 mr-2" />
                        Foto da Capa do Convite
                    </h3>
                    <div className="space-y-4 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selecionar Imagem</label>
                            <div className="flex items-center space-x-4">
                                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-gray-50 overflow-hidden relative">
                                    {isUploadingCover ? (
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    ) : coverPhoto ? (
                                        <img src={coverPhoto} alt="Capa" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-gray-400 text-center">Sem Imagem</span>
                                    )}
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <input 
                                        type="file" 
                                        ref={coverPhotoInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleCoverPhotoUpload}
                                        disabled={isUploadingCover}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => coverPhotoInputRef.current?.click()}
                                        disabled={isUploadingCover}
                                        className="bg-blue-100 text-blue-900 px-4 py-2 rounded text-sm hover:bg-blue-200 flex items-center disabled:opacity-50"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {isUploadingCover ? 'Enviando...' : 'Fazer Upload'}
                                    </button>
                                    {coverPhoto && !isUploadingCover && (
                                        <button 
                                            type="button"
                                            onClick={handleRemoveCoverPhoto}
                                            className="text-red-600 text-xs hover:text-red-800 flex items-center"
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" /> Remover Foto
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                A imagem será salva no Google Drive e vinculada à tela inicial.
                            </p>
                        </div>
                    </div>
                </div>

                {/* PIX Config */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                        <Gift className="w-5 h-5 mr-2" />
                        Configuração de Presentes (PIX)
                    </h3>
                    <div className="space-y-4 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX (Texto)</label>
                            <input 
                                type="text"
                                value={pixKey}
                                onChange={e => setPixKey(e.target.value)}
                                className="w-full border border-slate-600 bg-slate-800 text-white placeholder-slate-400 p-2 rounded outline-none"
                                placeholder="CPF, Email ou Telefone"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do QR Code</label>
                            <div className="flex items-center space-x-4">
                                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 overflow-hidden">
                                    {pixQrCode ? (
                                        <img src={pixQrCode} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-gray-400 text-center">Sem Imagem</span>
                                    )}
                                </div>
                                <div>
                                    <input 
                                        type="file" 
                                        ref={pixFileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handlePixUpload}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => pixFileInputRef.current?.click()}
                                        className="bg-blue-100 text-blue-900 px-4 py-2 rounded text-sm hover:bg-blue-200 flex items-center"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Fazer Upload
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleSavePix}
                            disabled={isSavingPix}
                            className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 flex items-center disabled:opacity-70"
                        >
                            {isSavingPix ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Check className="w-4 h-4 mr-2" />}
                            {isSavingPix ? 'Salvando...' : 'Salvar Configuração PIX'}
                        </button>
                    </div>
                </div>

                {/* Password Change */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                        <Key className="w-5 h-5 mr-2" />
                        Alterar Senha de Acesso
                    </h3>
                    <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                            <input 
                                type="password" 
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full border border-slate-600 bg-slate-800 text-white p-2 rounded mt-1 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full border border-slate-600 bg-slate-800 text-white p-2 rounded mt-1 outline-none"
                            />
                        </div>
                        <button 
                            type="submit"
                            className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 flex items-center"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Atualizar Senha
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>

      {/* --- PHOTO DELETION MODAL --- */}
      {photosToDelete.length > 0 && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-red-100 transform transition-all scale-100">
                <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-red-900">Excluir Definitivamente?</h3>
                    <p className="text-sm text-red-700 mt-2">
                        Você está prestes a remover <strong className="font-bold">{photosToDelete.length}</strong> {photosToDelete.length === 1 ? 'item' : 'itens'}.
                    </p>
                </div>
                
                <div className="p-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-start">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0"/>
                        <p className="text-xs text-amber-800">
                            Esta ação apagará os arquivos do <strong>Google Drive</strong> permanentemente. Não será possível recuperá-los através deste aplicativo.
                        </p>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-6 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-100 scrollbar-thin scrollbar-thumb-gray-300">
                        {photosToDelete.map(p => (
                            <div key={p.id} className="aspect-square rounded overflow-hidden relative border border-gray-200">
                                {p.type === 'video' ? (
                                    <video src={p.url} className="w-full h-full object-cover opacity-80" />
                                ) : (
                                    <img src={p.url} alt="delete preview" className="w-full h-full object-cover" />
                                )}
                                {p.type === 'video' && <Play className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md" />}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setPhotosToDelete([])}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={executeDeletePhotos}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex justify-center items-center shadow-red-200 shadow-lg disabled:opacity-70"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            {isDeleting ? "Excluindo..." : "Sim, Excluir"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- SCRIPT VIEW MODAL --- */}
      {showScriptModal && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-lg text-blue-900">Código do Google Apps Script</h3>
                        <p className="text-xs text-gray-500">Copie e cole este código no editor do seu Google Planilha (Extensões > Apps Script).</p>
                    </div>
                    <button onClick={() => setShowScriptModal(false)} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto bg-slate-900 p-4 relative">
                     <pre className="text-green-400 font-mono text-xs whitespace-pre-wrap break-all">
                        {BACKEND_SETUP_CODE}
                     </pre>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
                    <button 
                        onClick={() => setShowScriptModal(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded"
                    >
                        Fechar
                    </button>
                    <button 
                        onClick={handleCopyScript}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Código
                    </button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;