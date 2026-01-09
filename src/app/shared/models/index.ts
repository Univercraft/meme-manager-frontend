/**
 * Fichier centralisé pour tous les types et interfaces du projet
 * Facilite la maintenance et assure la cohérence du typage
 */

// ============================================
// ENUMS
// ============================================

/**
 * Statuts possibles pour un meme
 */
export enum MemeStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

/**
 * Types de notifications
 */
export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  MENTION = 'mention'
}

/**
 * Rôles utilisateurs
 */
export enum UserRole {
  ADMIN = 'admin',
  AUTHENTICATED = 'authenticated',
  PUBLIC = 'public'
}

// ============================================
// TYPES UTILITAIRES
// ============================================

/**
 * Type pour les IDs Directus (UUID)
 */
export type DirectusId = string;

/**
 * Type pour les timestamps Directus
 */
export type DirectusTimestamp = string;

/**
 * Type pour les réponses paginées
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    total_count?: number;
    filter_count?: number;
  };
}

/**
 * Type pour les erreurs API
 */
export interface ApiError {
  message: string;
  code?: string;
  errors?: Array<{
    message: string;
    extensions?: any;
  }>;
}

// ============================================
// INTERFACES MÉTIER
// ============================================

/**
 * Interface complète pour un utilisateur
 */
export interface User {
  id: DirectusId;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string | DirectusFile;
  role?: string | UserRole;
  status?: 'active' | 'suspended' | 'invited';
  date_created?: DirectusTimestamp;
  date_updated?: DirectusTimestamp;
}

/**
 * Interface pour un fichier Directus
 */
export interface DirectusFile {
  id: DirectusId;
  title?: string;
  filename_disk?: string;
  filename_download?: string;
  type?: string;
  filesize?: number;
  width?: number;
  height?: number;
  uploaded_on?: DirectusTimestamp;
}

/**
 * Interface pour un meme
 */
export interface Meme {
  id: DirectusId;
  title: string;
  description?: string;
  image_url: string | DirectusFile;
  status: MemeStatus | string;
  user_created: DirectusId | User;
  date_created?: DirectusTimestamp;
  date_updated?: DirectusTimestamp;
  tags?: Array<MemeTag | string>;
  likes_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
}

/**
 * Interface pour la relation meme-tag
 */
export interface MemeTag {
  id?: DirectusId;
  memes_id?: DirectusId | Meme;
  tags_id: DirectusId | Tag | string;
}

/**
 * Interface pour un tag
 */
export interface Tag {
  id: DirectusId;
  name: string;
  slug?: string;
  usage_count?: number;
  date_created?: DirectusTimestamp;
}

/**
 * Interface pour un like
 */
export interface MemeLike {
  id: DirectusId;
  meme_id: DirectusId | Meme;
  user_id: DirectusId | User;
  date_created?: DirectusTimestamp;
}

/**
 * Interface pour un meme sauvegardé
 */
export interface SavedMeme {
  id: DirectusId;
  user_id: DirectusId | User;
  meme_id: DirectusId | Meme;
  date_created?: DirectusTimestamp;
}

/**
 * Interface pour une notification
 */
export interface Notification {
  id: DirectusId;
  user_id: DirectusId | User;
  from_user_id?: DirectusId | User;
  type: NotificationType | string;
  message: string;
  meme_id?: DirectusId | Meme;
  is_read: boolean;
  date_created?: DirectusTimestamp;
}

// ============================================
// INTERFACES POUR LES FORMULAIRES
// ============================================

/**
 * Données pour créer un meme
 */
export interface CreateMemeData {
  title: string;
  description?: string;
  image_url: string;
  tags?: string[];
  status?: MemeStatus | string;
}

/**
 * Données pour mettre à jour un meme
 */
export interface UpdateMemeData {
  title?: string;
  description?: string;
  tags?: string[];
  status?: MemeStatus | string;
}

/**
 * Données de connexion
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Données d'inscription
 */
export interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Réponse d'authentification
 */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires: number;
  user?: User;
}

// ============================================
// INTERFACES POUR LA RECHERCHE
// ============================================

/**
 * Paramètres de recherche
 */
export interface SearchParams {
  query?: string;
  tags?: string[];
  user_id?: DirectusId;
  status?: MemeStatus;
  sort?: string;
  limit?: number;
  offset?: number;
}

/**
 * Résultat de recherche Meilisearch
 */
export interface SearchResult<T> {
  hits: T[];
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
}

// ============================================
// INTERFACES POUR LES WEBSOCKETS
// ============================================

/**
 * Message WebSocket
 */
export interface WebSocketMessage {
  type: 'notification' | 'like' | 'meme_update' | 'auth' | 'subscription';
  event?: string;
  data?: any;
  uid?: string;
}

/**
 * Événement WebSocket
 */
export interface WebSocketEvent<T = any> {
  type: string;
  collection?: string;
  action?: 'create' | 'update' | 'delete';
  data: T;
  key?: DirectusId;
}
