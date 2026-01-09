import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  async toggleLike(memeId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer le propriétaire du meme
      const memeResponse = await this.apiService.requestApi(`/items/memes/${memeId}`, 'GET', {
        fields: 'user_created'
      });
      
      const memeOwnerId = typeof memeResponse.data.user_created === 'string' 
        ? memeResponse.data.user_created 
        : memeResponse.data.user_created?.id;

      // Vérifier si déjà liké
      const existingLike = await this.apiService.requestApi('/items/memes_likes', 'GET', {
        'filter[meme_id][_eq]': memeId,
        'filter[user_id][_eq]': currentUser.id,
        limit: 1
      });

      let isLiked = false;

      if (existingLike?.data?.length > 0) {
        await this.apiService.requestApi(`/items/memes_likes/${existingLike.data[0].id}`, 'DELETE');
        isLiked = false;
        
        // Supprimer la notification (seulement si ce n'est pas son propre meme)
        if (memeOwnerId && currentUser.id !== memeOwnerId) {
          await this.notificationService.deleteLikeNotification(memeId, memeOwnerId);
        }
      } else {
        await this.apiService.requestApi('/items/memes_likes', 'POST', {
          meme_id: memeId,
          user_id: currentUser.id
        });
        isLiked = true;

        // Créer la notification (seulement si ce n'est pas son propre meme)
        if (memeOwnerId && currentUser.id !== memeOwnerId) {
          await this.notificationService.createLikeNotification(memeId, memeOwnerId);
        }
      }

      const likesCount = await this.getLikesCount(memeId);
      await this.updateMemeLikesCount(memeId, likesCount);

      return { isLiked, likesCount };
    } catch (error) {
      console.error('Erreur toggle like:', error);
      throw error;
    }
  }

  async getLikesCount(memeId: string): Promise<number> {
    try {
      const response = await this.apiService.requestApi('/items/memes_likes', 'GET', {
        'filter[meme_id][_eq]': memeId
      });

      return response?.data?.length || 0;
    } catch (error) {
      console.error('Erreur compteur likes:', error);
      return 0;
    }
  }

  async isLiked(memeId: string): Promise<boolean> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return false;

      const response = await this.apiService.requestApi('/items/memes_likes', 'GET', {
        'filter[meme_id][_eq]': memeId,
        'filter[user_id][_eq]': currentUser.id,
        limit: 1
      });

      return response?.data?.length > 0;
    } catch (error) {
      console.error('Erreur vérification like:', error);
      return false;
    }
  }

  private async updateMemeLikesCount(memeId: string, likesCount: number): Promise<void> {
    try {
      // Mettre à jour le compteur de likes dans le meme
      // Cela nécessite des permissions appropriées
      await this.apiService.requestApi(`/items/memes/${memeId}`, 'PATCH', {
        likes: likesCount
      });
    } catch (error) {
      // Ignorer l'erreur si pas de permission
      console.log('Compteur de likes non mis à jour (permissions)');
    }
  }
}
