import { Guest, Photo, PixConfig } from '../types';

// ==============================================================================
// CÓDIGO DE INSTALAÇÃO DO BACKEND (GOOGLE APPS SCRIPT)
// ATENÇÃO: NÃO TRADUZA ESTE CÓDIGO! (MANTENHA 'function', 'if', 'return' EM INGLÊS)
// Este código deve ser copiado para o editor do Google Apps Script.
// ==============================================================================
export const BACKEND_SETUP_CODE = `
// --- CONFIGURAÇÃO INICIAL v2.0 ---
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
  } catch (e) {
    return errorResponse('Server busy - try again later');
  }

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    let action = '';
    let type = '';
    
    // Nomes das Abas (Sheets)
    const SHEET_GUESTS = 'Lista_Confirmados';
    const SHEET_PHOTOS = 'Album_Fotos';
    const SHEET_CONFIG = 'App_Config';
    
    // --- GRAVAÇÃO (POST) ---
    if (e.postData) {
      const data = JSON.parse(e.postData.contents);
      action = data.action;
      type = data.type;
      
      // 1. ADICIONAR CONVIDADO
      if (type === 'rsvp' && action === 'addGuest') {
        let sheet = getOrCreateSheet(doc, SHEET_GUESTS);
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(['id', 'name', 'adults', 'children', 'message', 'confirmedAt']); 
          sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
        }
        sheet.appendRow([String(data.id), data.name, data.adults, data.children, data.message, data.confirmedAt]);
        return jsonResponse({ result: 'success' });
      }

      // 2. DELETAR CONVIDADO
      if (type === 'rsvp' && action === 'deleteGuest') {
         const sheet = doc.getSheetByName(SHEET_GUESTS);
         if (!sheet) return errorResponse('Sheet not found');
         const rows = sheet.getDataRange().getValues();
         for (let i = 1; i < rows.length; i++) {
           if (String(rows[i][0]).trim() === String(data.id).trim()) {
             sheet.deleteRow(i + 1);
             return jsonResponse({ result: 'success' });
           }
         }
         return errorResponse('ID not found');
      }

      // 3. UPLOAD DE FOTO (ALBUM OU CAPA)
      if (action === 'uploadPhoto') {
         if (data.id && data.id.startsWith('COVER_')) {
            return handleCoverUpload(doc, data, SHEET_CONFIG);
         }
         let sheet = getOrCreateSheet(doc, SHEET_PHOTOS);
         
         if (sheet.getLastRow() === 0) {
           sheet.appendRow(['id', 'url', 'caption', 'uploader', 'type', 'createdAt', 'likes', 'driveFileId', 'comments']);
           sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
         }
         try {
           const viewUrl = saveToDrive(data.image, data.id); 
           let fileId = "";
           try { fileId = viewUrl.split('/d/')[1].split('/')[0]; } catch(e) {}
           if (!fileId && viewUrl.includes('id=')) {
              try { fileId = viewUrl.split('id=')[1]; } catch(e) {}
           }
           sheet.appendRow([
             String(data.id), viewUrl, data.caption, data.uploader, data.type, 
             new Date().toISOString(), 0, fileId, '[]' 
           ]);
           return jsonResponse({ result: 'success', url: viewUrl });
         } catch (uploadError) {
           return errorResponse("Upload Error: " + uploadError.toString());
         }
      }

      // 4. DELETAR FOTO
      if (action === 'delete') {
         const sheet = doc.getSheetByName(SHEET_PHOTOS);
         if (sheet) {
            const rows = sheet.getDataRange().getValues();
            for (let i = 1; i < rows.length; i++) {
              if (String(rows[i][0]).trim() === String(data.id).trim()) {
                const driveFileId = rows[i][7]; 
                if (driveFileId) { try { DriveApp.getFileById(driveFileId).setTrashed(true); } catch (e) {} }
                sheet.deleteRow(i + 1);
                return jsonResponse({ result: 'success' });
              }
            }
         }
         return jsonResponse({ result: 'success' });
      }

      // 5. CURTIR (LIKE)
      if (action === 'like') {
         const sheet = doc.getSheetByName(SHEET_PHOTOS);
         if (!sheet) return errorResponse('Sheet not found');
         const rows = sheet.getDataRange().getValues();
         for (let i = 1; i < rows.length; i++) {
            if (String(rows[i][0]).trim() === String(data.id).trim()) {
                let currentLikes = Number(rows[i][6]);
                if (isNaN(currentLikes)) currentLikes = 0;
                sheet.getRange(i + 1, 7).setValue(currentLikes + 1);
                return jsonResponse({ result: 'success', newLikes: currentLikes + 1 });
            }
         }
         return errorResponse('Photo not found');
      }

      // 6. SALVAR CONFIGURAÇÃO PIX (NOVA)
      if (action === 'savePixConfig') {
         let sheet = getOrCreateSheet(doc, SHEET_CONFIG);
         if (sheet.getLastRow() === 0) sheet.appendRow(['key', 'value']);
         
         let qrUrl = data.qrCodeBase64;
         // Se for base64 (upload novo), salva no Drive. Se for URL (já salvo) ou vazio, mantém.
         if (qrUrl && typeof qrUrl === 'string' && qrUrl.startsWith('data:')) {
             try {
                qrUrl = saveToDrive(qrUrl, "PIX_QR_" + new Date().getTime());
             } catch(e) {
                return errorResponse("Erro ao salvar imagem no Drive: " + e.toString());
             }
         }
         
         setConfigValue(sheet, 'pix_key', data.pixKey || "");
         setConfigValue(sheet, 'pix_qrcode', qrUrl || "");
         
         return jsonResponse({ result: 'success', qrUrl: qrUrl });
      }

    } else if (e.parameter) {
      // --- LEITURA (GET) ---
      type = e.parameter.type;
      
      if (type === 'guests') {
        const sheet = doc.getSheetByName(SHEET_GUESTS);
        if (!sheet) return jsonResponse([]);
        const rows = sheet.getDataRange().getValues();
        if (rows.length > 0) rows.shift();
        const result = rows.map(row => ({
            id: row[0], name: row[1], adults: row[2], children: row[3], message: row[4], confirmedAt: row[5]
        }));
        return jsonResponse(result);
      }
      
      if (type === 'photos') {
         const sheet = doc.getSheetByName(SHEET_PHOTOS);
         if (!sheet) return jsonResponse([]);
         const rows = sheet.getDataRange().getValues();
         if (rows.length > 0) rows.shift();
         const result = rows.filter(r => r[0]).map(row => {
            let comments = [];
            try { if (row.length > 8 && row[8]) comments = JSON.parse(row[8]); } catch(e) {}
            return {
                id: row[0], url: row[1], caption: row[2], uploader: row[3],
                type: row[4], createdAt: row[5], likes: Number(row[6]) || 0, comments: comments
            };
         });
         return jsonResponse(result);
      }

      if (type === 'config') {
         const sheet = doc.getSheetByName(SHEET_CONFIG);
         let config = { coverPhoto: '', pixKey: '', pixQrCode: '' };
         if (sheet) {
            const rows = sheet.getDataRange().getValues();
            for(var i=0; i<rows.length; i++) {
               if(rows[i][0] === 'cover_photo') config.coverPhoto = rows[i][1];
               if(rows[i][0] === 'pix_key') config.pixKey = rows[i][1];
               if(rows[i][0] === 'pix_qrcode') config.pixQrCode = rows[i][1];
            }
         }
         return jsonResponse(config);
      }
    }
    return errorResponse('Ação desconhecida ou parâmetros inválidos');
  } catch (err) {
    return errorResponse('Erro Interno: ' + err.toString());
  } finally {
    lock.releaseLock();
  }
}

function handleCoverUpload(doc, data, sheetName) {
    const viewUrl = saveToDrive(data.image, "CAPA_" + new Date().getTime());
    let sheet = getOrCreateSheet(doc, sheetName);
    if (sheet.getLastRow() === 0) sheet.appendRow(['key', 'value']);
    setConfigValue(sheet, 'cover_photo', viewUrl);
    return jsonResponse({ result: 'success', url: viewUrl });
}

function setConfigValue(sheet, key, value) {
   const rows = sheet.getDataRange().getValues();
   let foundIndex = -1;
   for(let i=0; i<rows.length; i++) {
     if(rows[i][0] === key) { foundIndex = i + 1; break; }
   }
   if (foundIndex > -1) sheet.getRange(foundIndex, 2).setValue(value);
   else sheet.appendRow([key, value]);
}

function saveToDrive(base64String, fileName) {
    const folderName = "Casamento_App_Fotos";
    const folders = DriveApp.getFoldersByName(folderName);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    const parts = base64String.split(',');
    const contentType = parts[0].split(':')[1].split(';')[0];
    const blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), contentType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://lh3.googleusercontent.com/d/" + file.getId(); 
}

function getOrCreateSheet(doc, name) {
  let sheet = doc.getSheetByName(name);
  if (!sheet) sheet = doc.insertSheet(name);
  return sheet;
}
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function errorResponse(msg) {
  return jsonResponse({ result: 'error', message: msg });
}
`;

// URL Padrão (Fallback)
const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwLRktAgKxtf7lvMFKhy5AALAjIZylZXmIT2xvE6cWh01eCzauwUPVCDxL68CTV0HMT/exec";

const ADMIN_PASSWORD_KEY = 'wedding_app_admin_password';
const ADMIN_SESSION_KEY = 'wedding_app_admin_session';
const SCRIPT_URL_KEY = 'wedding_app_script_url';

const DUMMY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const StorageService = {
  // --- Configuration Methods ---
  
  getScriptUrl: (): string => {
    return localStorage.getItem(SCRIPT_URL_KEY) || DEFAULT_SCRIPT_URL;
  },

  setScriptUrl: (url: string) => {
    localStorage.setItem(SCRIPT_URL_KEY, url);
  },

  // --- Guest Methods ---
  
  getGuests: async (): Promise<Guest[]> => {
    const scriptUrl = StorageService.getScriptUrl();
    if (!scriptUrl || scriptUrl.includes("/edit")) return [];

    try {
      const response = await fetch(`${scriptUrl}?type=guests&_t=${new Date().getTime()}`);
      if (!response.ok) throw new Error("Erro ao buscar convidados");
      
      let data = await response.json();
      
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) {}
      }
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
          if (Array.isArray(data.data)) data = data.data;
          else if (Array.isArray(data.items)) data = data.items;
          else if (Array.isArray(data.guests)) data = data.guests;
      }
      
      if (!Array.isArray(data)) return [];

      return data
        .filter((item: any) => {
             const hasName = item.name && item.name !== 'name';
             return hasName;
        })
        .map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          name: item.name || 'Convidado',
          adults: Number(item.adults || 0),
          children: Number(item.children || 0),
          confirmedAt: item.confirmedAt || new Date().toISOString(),
          message: item.message || ''
        }));
    } catch (error) {
      console.error("Erro ao carregar convidados:", error);
      return [];
    }
  },

  addGuest: async (guest: Omit<Guest, 'id' | 'confirmedAt'>): Promise<Guest> => {
    const scriptUrl = StorageService.getScriptUrl();
    const newGuest: Guest = {
      ...guest,
      id: crypto.randomUUID(),
      confirmedAt: new Date().toISOString(),
    };

    const payload = {
        type: 'rsvp', 
        action: 'addGuest',
        id: newGuest.id,
        name: newGuest.name,
        adults: newGuest.adults,
        children: newGuest.children,
        message: newGuest.message,
        confirmedAt: newGuest.confirmedAt,
        image: DUMMY_IMAGE 
    };

    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            redirect: 'follow', 
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (result.result === 'error') {
            throw new Error(result.message || "Erro ao salvar na planilha.");
        }

        return newGuest;
    } catch (error) {
        console.error("Erro ao confirmar presença:", error);
        throw error; 
    }
  },

  deleteGuest: async (id: string): Promise<void> => {
     const scriptUrl = StorageService.getScriptUrl();
     const payload = {
        action: 'deleteGuest',
        type: 'rsvp',
        id: id,
        adminPassword: StorageService.getAdminPassword(),
        image: DUMMY_IMAGE 
    };

    try {
        await fetch(scriptUrl, {
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error("Erro ao deletar convidado:", error);
        throw new Error("Erro ao remover da planilha.");
    }
  },

  // --- Photo/Video Methods ---
  
  getPhotos: async (): Promise<Photo[]> => {
    const scriptUrl = StorageService.getScriptUrl();
    if (!scriptUrl || !scriptUrl.startsWith("http")) return [];

    try {
      const response = await fetch(`${scriptUrl}?type=photos&_t=${new Date().getTime()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      let data = await response.json();

      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) {}
      }
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
          if (Array.isArray(data.data)) data = data.data;
          else if (Array.isArray(data.items)) data = data.items;
          else if (Array.isArray(data.photos)) data = data.photos;
      }
      
      if (!Array.isArray(data)) return [];

      return data
        .filter((item: any) => item.image || item.url || item.type === 'image' || item.type === 'video')
        .map((item: any) => {
            // Safe JSON Parse for Comments in case frontend receives string
            let parsedComments = [];
            if (Array.isArray(item.comments)) {
                parsedComments = item.comments;
            } else if (typeof item.comments === 'string') {
                try { parsedComments = JSON.parse(item.comments); } catch(e) {}
            }

            return {
                id: item.id,
                url: item.url,
                caption: item.caption || '',
                uploader: String(item.uploader || 'Convidado'), 
                comments: parsedComments,
                likes: Number(item.likes) || 0,
                createdAt: item.createdAt,
                type: item.type || 'image'
            };
      });
    } catch (error) {
      console.error("Erro ao carregar do Drive:", error);
      return [];
    }
  },

  addPhoto: async (file: File, caption: string, uploader: string): Promise<Photo> => {
    const scriptUrl = StorageService.getScriptUrl();
    if (file.size > 10 * 1024 * 1024) throw new Error("Arquivo muito grande (Máx 10MB).");

    const base64 = await fileToBase64(file);
    const id = crypto.randomUUID();
    const type = file.type.startsWith('video/') ? 'video' : 'image';

    const payload = {
        id: id,
        image: base64,
        caption: caption,
        uploader: uploader,
        type: type,
        action: 'uploadPhoto' 
    };

    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Erro na conexão com o servidor.");

        const result = await response.json();
        
        if (result.result !== 'success') throw new Error(result.message || "Erro desconhecido.");

        return {
            id: id,
            url: result.url || payload.image, 
            caption,
            uploader,
            comments: [],
            likes: 0,
            createdAt: new Date().toISOString(),
            type: type as 'image' | 'video'
        };

    } catch (error) {
        console.error("Upload falhou:", error);
        throw new Error("Falha no upload. Verifique a conexão.");
    }
  },

  deletePhoto: async (id: string): Promise<void> => {
    const scriptUrl = StorageService.getScriptUrl();
    const payload = {
        action: 'delete',
        type: 'image',
        id: id,
        adminPassword: StorageService.getAdminPassword(),
        image: DUMMY_IMAGE
    };
    try {
        await fetch(scriptUrl, { method: 'POST', redirect: 'follow', body: JSON.stringify(payload) });
    } catch (error) {
        throw new Error("Falha ao excluir do Drive.");
    }
  },

  deletePhotos: async (ids: string[]): Promise<void> => {
    const scriptUrl = StorageService.getScriptUrl();
    const deletePromises = ids.map(id => 
         fetch(scriptUrl, {
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify({
               action: 'delete',
               type: 'image',
               id: id,
               adminPassword: StorageService.getAdminPassword(),
               image: DUMMY_IMAGE
            })
        })
    );
    try { await Promise.all(deletePromises); } catch (error) { throw new Error("Erro ao excluir fotos."); }
  },

  addComment: async (photoId: string, author: string, text: string): Promise<Photo[]> => { 
    const scriptUrl = StorageService.getScriptUrl();
    const payload = {
        action: 'comment',
        id: photoId,
        author: author,
        text: text,
        image: DUMMY_IMAGE 
    };
    try {
        await fetch(scriptUrl, { method: 'POST', redirect: 'follow', body: JSON.stringify(payload) });
        return StorageService.getPhotos();
    } catch (error) {
        throw error;
    }
  },

  deleteComment: async (photoId: string, commentId: string): Promise<Photo[]> => { 
      return StorageService.getPhotos(); 
  },
  
  likePhoto: async (photoId: string): Promise<Photo[]> => { 
    const scriptUrl = StorageService.getScriptUrl();
    const payload = { action: 'like', id: photoId, image: DUMMY_IMAGE };
    try {
        await fetch(scriptUrl, { method: 'POST', redirect: 'follow', body: JSON.stringify(payload) });
        return StorageService.getPhotos();
    } catch (error) {
        return StorageService.getPhotos();
    }
  },
  
  // --- Admin/Auth/Config Methods ---
  getAdminPassword: () => localStorage.getItem(ADMIN_PASSWORD_KEY) || 'amor2025',
  setAdminPassword: (password: string) => localStorage.setItem(ADMIN_PASSWORD_KEY, password),
  loginAdmin: () => localStorage.setItem(ADMIN_SESSION_KEY, 'true'),
  logoutAdmin: () => localStorage.removeItem(ADMIN_SESSION_KEY),
  isAdminLoggedIn: () => localStorage.getItem(ADMIN_SESSION_KEY) === 'true',
  
  // Gets all configuration (Cover, PIX) from Backend
  getCoverPhoto: async (): Promise<string> => {
      const config = await StorageService.getConfig();
      return config.coverPhoto || '';
  },

  getConfig: async (): Promise<{coverPhoto: string, pixKey: string, pixQrCode: string}> => {
      const scriptUrl = StorageService.getScriptUrl();
      try {
          const response = await fetch(`${scriptUrl}?type=config&_t=${new Date().getTime()}`);
          if (response.ok) {
              const data = await response.json();
              return {
                  coverPhoto: data.coverPhoto || '',
                  pixKey: data.pixKey || '',
                  pixQrCode: data.pixQrCode || ''
              };
          }
      } catch (e) {
          console.warn("Não foi possível carregar config do backend.");
      }
      return { coverPhoto: '', pixKey: '', pixQrCode: '' }; 
  },

  saveCoverPhoto: async (file: File): Promise<string> => {
     const scriptUrl = StorageService.getScriptUrl();
     const base64 = await fileToBase64(file);
     const id = "COVER_" + Date.now();
     const payload = { id, image: base64, caption: "CAPA", uploader: "Admin", type: 'image', action: 'uploadPhoto' };
     try {
        const response = await fetch(scriptUrl, { method: 'POST', redirect: 'follow', body: JSON.stringify(payload) });
        if (!response.ok) throw new Error("Erro HTTP");
        const result = await response.json();
        return result.url || base64;
     } catch (e) { throw new Error("Falha ao enviar capa."); }
  },

  // Retrieves PIX config from backend (Sheet App_Config)
  getPixConfig: async (): Promise<PixConfig> => {
     const config = await StorageService.getConfig();
     return {
         pixKey: config.pixKey,
         qrCodeBase64: config.pixQrCode
     };
  },
  
  // Saves PIX config to backend (Sheet App_Config)
  savePixConfig: async (config: PixConfig): Promise<void> => {
      const scriptUrl = StorageService.getScriptUrl();
      const payload = {
          action: 'savePixConfig',
          pixKey: config.pixKey || "",
          qrCodeBase64: config.qrCodeBase64 || "", 
          image: DUMMY_IMAGE
      };
      
      try {
          const response = await fetch(scriptUrl, {
              method: 'POST',
              redirect: 'follow',
              body: JSON.stringify(payload)
          });
          
          const result = await response.json();
          if (result.result !== 'success') {
              // Now we throw the actual error message coming from the backend
              throw new Error(result.message || "Erro desconhecido ao salvar PIX.");
          }
      } catch (e: any) {
          console.error("Erro ao salvar PIX:", e);
          throw e;
      }
  }
};