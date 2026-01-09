import { Tag } from './tag';
import { User } from './user';

export interface Meme {
  id: string;
  title: string;
  image: string;
  status: 'published' | 'draft' | 'archived';
  views: number;
  likes: number;
  saves?: number; // Nombre d'enregistrements
  user_created: string | User;
  date_created: string;
  tags?: Array<{ tags_id: string | Tag }>;
  similarityScore?: number; // Score de similarité pour la recherche
  likes_count?: number;
  user_id?: string;
}

export interface MemeTag {
  id: string;
  memes_id: string;
  tags_id: string | Tag;
}

export interface MemeLike {
  id: string;
  meme_id: string | Meme;
  user_id: string | User;
  date_created: string;
}

export interface CreateMemeData {
  title: string;
  image: File;
  tags?: string[];
  status?: 'published' | 'draft';
}
