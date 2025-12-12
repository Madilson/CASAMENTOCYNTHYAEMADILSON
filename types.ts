export interface Guest {
  id: string;
  name: string;
  adults: number;
  children: number;
  confirmedAt: string;
  message?: string;
}

export interface PhotoComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  url: string; // Base64 or URL
  caption: string;
  uploader: string;
  comments: PhotoComment[];
  likes: number;
  createdAt: string;
  type: 'image' | 'video';
}

export interface PixConfig {
  qrCodeBase64: string;
  pixKey: string;
}

export enum AppTab {
  INVITATION = 'INVITATION',
  RSVP = 'RSVP',
  ALBUM = 'ALBUM',
  GIFTS = 'GIFTS',
  ADMIN = 'ADMIN'
}