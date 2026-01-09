import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Notification } from '../interfaces/notification';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private apiUrl = `${environment.directusUrl}`;

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.loadNotifications();
        this.startPolling();
      } else {
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }
    });
  }

  /**
   * Charger les notifications de l'utilisateur
   */
  async loadNotifications(): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;

      const response = await this.apiService.requestApi('/items/notifications', 'GET', {
        'filter[user_id][_eq]': currentUser.id,
        'fields': '*,from_user_id.id,from_user_id.first_name,from_user_id.last_name,from_user_id.avatar',
        'sort': '-date_created',
        'limit': 50
      });

      const notifications = response?.data || [];
      this.notificationsSubject.next(notifications);
      
      const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;
      this.unreadCountSubject.next(unreadCount);
      
      console.log('🔔 Notifications chargées:', notifications.length, '| Non lues:', unreadCount);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  }

  /**
   * Créer une notification de like
   */
  async createLikeNotification(memeId: string, memeOwnerId: string): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    
    // Ne pas créer de notification si l'utilisateur like son propre mème
    if (currentUser.id === memeOwnerId) {
      return;
    }

    try {
      await this.apiService.requestApi('/items/notifications', 'POST', {
        user_id: memeOwnerId,
        type: 'like',
        meme_id: memeId,
        from_user_id: currentUser.id,
        message: `${currentUser.first_name || currentUser.email} a aimé votre meme`,
        is_read: false
      });
      
      console.log('🔔 Notification de like créée');
    } catch (error) {
      console.error('Erreur création notification:', error);
    }
  }

  getNotifications(): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of([]);
    
    return this.apiService.getItems('notifications', {
      filter: {
        user_id: { _eq: currentUser.id }
      },
      fields: ['*', 'meme_id.*', 'from_user_id.first_name', 'from_user_id.last_name', 'from_user_id.avatar'],
      sort: ['-date_created']
    });
  }

  /**
   * Supprimer la notification de like (quand on unlike)
   */
  async deleteLikeNotification(memeId: string, memeOwnerId: string): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;

      // Trouver la notification correspondante
      const response = await this.apiService.requestApi('/items/notifications', 'GET', {
        'filter[user_id][_eq]': memeOwnerId,
        'filter[type][_eq]': 'like',
        'filter[meme_id][_eq]': memeId,
        'filter[from_user_id][_eq]': currentUser.id,
        'limit': 1
      });

      if (response?.data?.length > 0) {
        const notificationId = response.data[0].id;
        await this.apiService.requestApi(`/items/notifications/${notificationId}`, 'DELETE');
        console.log('🗑️ Notification de like supprimée');
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.apiService.requestApi(`/items/notifications/${notificationId}`, 'PATCH', {
        is_read: true
      });

      // Mettre à jour localement
      const notifications = this.notificationsSubject.value.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      this.notificationsSubject.next(notifications);
      
      const unreadCount = notifications.filter(n => !n.is_read).length;
      this.unreadCountSubject.next(unreadCount);

      console.log('✅ Notification marquée comme lue');
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;

      const unreadNotifications = this.notificationsSubject.value.filter(n => !n.is_read);

      for (const notification of unreadNotifications) {
        await this.apiService.requestApi(`/items/notifications/${notification.id}`, 'PATCH', {
          is_read: true
        });
      }

      const notifications = this.notificationsSubject.value.map(n => ({ ...n, is_read: true }));
      this.notificationsSubject.next(notifications);
      this.unreadCountSubject.next(0);

      console.log('✅ Toutes les notifications marquées comme lues');
    } catch (error) {
      console.error('Erreur marquage notifications:', error);
    }
  }

  /**
   * Demander la permission pour les notifications navigateur
   */
  async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  /**
   * Afficher une notification navigateur
   */
  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Meme Manager', {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  }

  /**
   * Polling amélioré avec détection de nouvelles notifications
   */
  private startPolling(): void {
    let previousCount = this.unreadCountSubject.value;

    interval(30000).subscribe(async () => {
      if (this.authService.isAuthenticated()) {
        await this.loadNotifications();
        
        const currentCount = this.unreadCountSubject.value;
        if (currentCount > previousCount) {
          const diff = currentCount - previousCount;
          this.showBrowserNotification({
            message: `Vous avez ${diff} nouvelle(s) notification(s)`,
            type: 'like'
          } as Notification);
        }
        previousCount = currentCount;
      }
    });
  }
}
