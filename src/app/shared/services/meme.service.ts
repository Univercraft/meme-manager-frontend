import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { Meme, CreateMemeData } from '../interfaces/meme';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MemeService {

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  async getMemes(page: number = 1, limit: number = 12, search?: string, tags?: string[]): Promise<{data: Meme[], meta: any}> {
    let params: any = {
      limit,
      offset: (page - 1) * limit,
      fields: ['*', 'user_created.first_name', 'user_created.last_name', 'tags.tags_id.name'].join(','),
      sort: '-date_created',
      'filter[status][_eq]': 'published'
    };

    if (search) {
      params['filter[title][_contains]'] = search;
    }

    if (tags && tags.length > 0) {
      params['filter[tags][tags_id][name][_in]'] = tags.join(',');
    }

    try {
      const response = await this.apiService.requestApi('/items/memes', 'GET', params);
      console.log('✅ Memes loaded:', response?.data?.length);
      return { data: response?.data || [], meta: response?.meta || {} };
    } catch (error) {
      console.error('❌ Erreur getMemes:', error);
      return { data: [], meta: { filter_count: 0 } };
    }
  }

  async getMeme(id: string): Promise<Meme> {
    const params = {
      fields: ['*', 'user_created.first_name', 'user_created.last_name', 'user_created.avatar', 'tags.tags_id.*'].join(',')
    };

    const response = await this.apiService.requestApi(`/items/memes/${id}`, 'GET', params);
    return response.data;
  }

  async createMeme(memeData: CreateMemeData): Promise<Meme> {
    try {
      // Upload l'image via le service API
      const uploadResponse = await this.apiService.uploadFile(memeData.image);

      // Créer le meme avec l'ID de l'image
      const memePayload = {
        title: memeData.title,
        image: uploadResponse.data.id,
        status: memeData.status || 'published',
        tags: memeData.tags?.map(tagId => ({ tags_id: tagId })) || []
      };

      const response = await this.apiService.requestApi('/items/memes', 'POST', memePayload);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du meme:', error);
      throw error;
    }
  }

  async updateMeme(id: string, data: Partial<Meme>): Promise<Meme> {
    const response = await this.apiService.requestApi(`/items/memes/${id}`, 'PATCH', data);
    return response.data;
  }

  async deleteMeme(memeId: string): Promise<void> {
    try {
      await this.apiService.requestApi(`/items/memes/${memeId}`, 'DELETE');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw new Error('Impossible de supprimer le meme');
    }
  }

  async incrementViews(memeId: string): Promise<void> {
    // Désactiver temporairement l'incrémentation des vues
    // car cela nécessite des permissions spéciales
    // Les vues seront incrémentées côté serveur si nécessaire
    console.log('Vues non incrémentées (permissions manquantes)');
  }

  async getUserMemes(userId: string): Promise<Meme[]> {
    const params = {
      'filter[user_created][_eq]': userId,
      fields: ['*', 'tags.tags_id.name'].join(','),
      sort: '-date_created'
    };

    const response = await this.apiService.requestApi('/items/memes', 'GET', params);
    return response.data;
  }

  async getPopularMemes(limit: number = 10): Promise<Meme[]> {
    const params = {
      limit,
      fields: ['*', 'user_created.first_name', 'user_created.last_name'].join(','),
      sort: '-likes,-views',
      'filter[status][_eq]': 'published'
    };

    const response = await this.apiService.requestApi('/items/memes', 'GET', params);
    return response.data;
  }

  async getMemeById(id: string): Promise<Meme> {
    try {
      const response = await this.apiService.requestApi(`/items/memes/${id}`, 'GET', {
        fields: '*,user_created.id,user_created.first_name,user_created.last_name,user_created.email,tags.tags_id.*'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du meme:', error);
      throw error;
    }
  }

  likeMeme(memeId: string): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of(null);

    return this.apiService.createItem('memes_likes', {
      user_id: currentUser.id,
      meme_id: memeId
    });
  }

  unlikeMeme(memeId: string): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of(null);

    return this.apiService.getItems('memes_likes', {
      filter: {
        user_id: { _eq: currentUser.id },
        meme_id: { _eq: memeId }
      }
    }).pipe(
      switchMap((response: any) => {
        if (response && response.length > 0) {
          const likeId = response[0].id;
          return this.apiService.deleteItem('memes_likes', likeId);
        }
        return of(null);
      })
    );
  }

  isMemeLiked(memeId: string): Observable<boolean> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of(false);

    return this.apiService.getItems('memes_likes', {
      filter: {
        user_id: { _eq: currentUser.id },
        meme_id: { _eq: memeId }
      }
    }).pipe(
      map((response: any) => response && response.length > 0)
    );
  }

  saveMeme(memeId: string): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of(null);
    
    return this.apiService.createItem('saved_memes', {
      user_id: currentUser.id,
      meme_id: memeId
    });
  }

  unsaveMeme(memeId: string): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of(null);
    
    return this.apiService.getItems('saved_memes', {
      filter: {
        user_id: { _eq: currentUser.id },
        meme_id: { _eq: memeId }
      }
    }).pipe(
      switchMap((response: any) => {
        if (response && response.length > 0) {
          const savedMemeId = response[0].id;
          return this.apiService.deleteItem('saved_memes', savedMemeId);
        }
        return of(null);
      })
    );
  }

  getSavedMemes(): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of([]);
    
    return this.apiService.getItems('saved_memes', {
      filter: {
        user_id: { _eq: currentUser.id }
      },
      fields: ['*', 'meme_id.*']
    });
  }

  isMemeSaved(memeId: string): Observable<boolean> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of(false);
    
    return this.apiService.getItems('saved_memes', {
      filter: {
        user_id: { _eq: currentUser.id },
        meme_id: { _eq: memeId }
      }
    }).pipe(
      map((response: any) => response && response.length > 0)
    );
  }
}
