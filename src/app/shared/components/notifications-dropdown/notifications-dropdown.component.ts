import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../interfaces/notification';

@Component({
  selector: 'app-notifications-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications-dropdown.component.html',
  styleUrls: ['./notifications-dropdown.component.css']
})
export class NotificationsDropdownComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount = 0;
  isOpen = false;
  isLoading = false;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });

    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  async toggleDropdown(): Promise<void> {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      this.isLoading = true;
      await this.notificationService.loadNotifications();
      this.isLoading = false;
    }
  }

  async onNotificationClick(notification: Notification): Promise<void> {
    if (!notification.is_read) {
      await this.notificationService.markAsRead(notification.id);
    }
    this.isOpen = false;
    this.router.navigate(['/meme', notification.meme_id]);
  }

  async markAllAsRead(): Promise<void> {
    await this.notificationService.markAllAsRead();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👤';
      default: return '🔔';
    }
  }

  getUserName(notification: Notification): string {
    if (typeof notification.from_user_id === 'object' && notification.from_user_id) {
      const user = notification.from_user_id;
      return user.first_name 
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : user.email;
    }
    return 'Utilisateur';
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short'
    });
  }
}
