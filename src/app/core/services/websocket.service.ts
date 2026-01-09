import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Interface pour les messages WebSocket
 */
export interface WebSocketMessage {
  type: 'notification' | 'like' | 'meme_update' | 'auth' | 'subscription';
  event?: string;
  data?: any;
  uid?: string;
}

/**
 * Service de gestion des WebSockets pour les notifications en temps réel
 * Utilisé pour recevoir les notifications de likes, nouveaux memes, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private readonly wsUrl = environment.wsUrl || 'ws://localhost:8055/websocket';
  
  // Observables pour les différents types de messages
  private messageSubject = new Subject<WebSocketMessage>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private notificationSubject = new Subject<any>();
  private likeSubject = new Subject<any>();
  private memeUpdateSubject = new Subject<any>();
  
  // Publics observables
  public message$ = this.messageSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public notification$ = this.notificationSubject.asObservable();
  public like$ = this.likeSubject.asObservable();
  public memeUpdate$ = this.memeUpdateSubject.asObservable();
  
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: any;
  private isIntentionalClose = false;

  constructor() {
    console.log('🔌 WebSocket Service initialized');
  }

  /**
   * Connecte au serveur WebSocket avec authentification
   * @param token Token d'authentification Directus
   */
  connect(token?: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket déjà connecté');
      return;
    }

    this.isIntentionalClose = false;
    
    try {
      console.log(`🔌 Connexion au WebSocket: ${this.wsUrl}`);
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        console.log('✅ WebSocket connecté');
        this.connectionStatusSubject.next(true);
        this.reconnectAttempts = 0;
        
        // Authentification si token fourni
        if (token) {
          this.authenticate(token);
        }
        
        // S'abonner aux événements
        this.subscribe();
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Message WebSocket reçu:', message);
          
          this.messageSubject.next(message);
          
          // Router le message vers le bon subject
          switch (message.type) {
            case 'notification':
              this.notificationSubject.next(message.data);
              break;
            case 'like':
              this.likeSubject.next(message.data);
              break;
            case 'meme_update':
              this.memeUpdateSubject.next(message.data);
              break;
          }
        } catch (error) {
          console.error('❌ Erreur parsing message WebSocket:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
        this.connectionStatusSubject.next(false);
      };

      this.socket.onclose = () => {
        console.log('🔌 WebSocket déconnecté');
        this.connectionStatusSubject.next(false);
        
        // Reconnexion automatique si ce n'est pas intentionnel
        if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(token);
        }
      };
    } catch (error) {
      console.error('❌ Erreur lors de la connexion WebSocket:', error);
      this.connectionStatusSubject.next(false);
      this.scheduleReconnect(token);
    }
  }

  /**
   * Authentification sur le WebSocket
   */
  private authenticate(token: string): void {
    this.send({
      type: 'auth',
      data: { access_token: token }
    });
  }

  /**
   * S'abonner aux événements WebSocket
   */
  private subscribe(): void {
    // S'abonner aux notifications
    this.send({
      type: 'subscription',
      event: 'notifications',
      data: { collection: 'notifications' }
    });
    
    // S'abonner aux likes
    this.send({
      type: 'subscription',
      event: 'likes',
      data: { collection: 'memes_likes' }
    });
    
    // S'abonner aux mises à jour de memes
    this.send({
      type: 'subscription',
      event: 'memes',
      data: { collection: 'memes' }
    });
  }

  /**
   * Planifie une reconnexion avec backoff exponentiel
   */
  private scheduleReconnect(token?: string): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Reconnexion WebSocket dans ${delay}ms (tentative ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect(token);
    }, delay);
  }

  /**
   * Envoie un message via WebSocket
   */
  send(message: WebSocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      console.log('📤 Message WebSocket envoyé:', message);
    } else {
      console.warn('⚠️ WebSocket non connecté, impossible d\'envoyer:', message);
    }
  }

  /**
   * Déconnecte le WebSocket
   */
  disconnect(): void {
    this.isIntentionalClose = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.connectionStatusSubject.next(false);
    console.log('🔌 WebSocket déconnecté intentionnellement');
  }

  /**
   * Vérifie si le WebSocket est connecté
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
