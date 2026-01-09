import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SavedMemeService {
  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  async toggleSave(memeId: string): Promise<{ isSaved: boolean }> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('🔍 Toggle save pour meme:', memeId, 'user:', currentUser.id);

      // Vérifier si déjà enregistré
      const existing = await this.apiService.requestApi('/items/saved_memes', 'GET', {
        'filter[meme_id][_eq]': memeId,
        'filter[user_id][_eq]': currentUser.id,
        'limit': 1
      });

      console.log('📦 Saved existant:', existing);

      let isSaved = false;

      if (existing?.data?.length > 0) {
        // Supprimer l'enregistrement
        await this.apiService.requestApi(`/items/saved_memes/${existing.data[0].id}`, 'DELETE');
        isSaved = false;
        console.log('🗑️ Meme retiré des favoris');
      } else {
        // Enregistrer
        const created = await this.apiService.requestApi('/items/saved_memes', 'POST', {
          meme_id: memeId,
          user_id: currentUser.id
        });
        isSaved = true;
        console.log('✅ Meme enregistré dans les favoris:', created);
      }

      return { isSaved };
    } catch (error) {
      console.error('❌ Erreur toggle save:', error);
      throw error;
    }
  }

  async isSaved(memeId: string): Promise<boolean> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return false;

      const response = await this.apiService.requestApi('/items/saved_memes', 'GET', {
        'filter[meme_id][_eq]': memeId,
        'filter[user_id][_eq]': currentUser.id,
        'limit': 1
      });

      return response?.data?.length > 0;
    } catch (error) {
      console.error('Erreur vérification save:', error);
      return false;
    }
  }

  async getSavedMemes(userId: string): Promise<any[]> {
    try {
      console.log('🔍 Récupération des memes enregistrés pour user:', userId);

      const response = await this.apiService.requestApi('/items/saved_memes', 'GET', {
        'filter[user_id][_eq]': userId,
        'fields': [
          'id',
          'date_created',
          'meme_id.id',
          'meme_id.title',
          'meme_id.image',
          'meme_id.views',
          'meme_id.likes',
          'meme_id.status',
          'meme_id.date_created',
          'meme_id.user_created.first_name',
          'meme_id.user_created.last_name',
          'meme_id.tags.tags_id.name'
        ].join(','),
        'sort': '-date_created'
      });

      console.log('📦 Réponse API getSavedMemes:', response);

      return response?.data || [];
    } catch (error) {
      console.error('❌ Erreur récupération saved memes:', error);
      return [];
    }
  }
}
