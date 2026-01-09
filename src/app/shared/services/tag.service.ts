import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Tag } from '../interfaces/tag';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  constructor(private apiService: ApiService) {}

  async getAllTags(): Promise<Tag[]> {
    try {
      const response = await this.apiService.requestApi('/items/tags', 'GET', {
        limit: -1,
        sort: 'name'
      });
      return response?.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des tags:', error);
      return [];
    }
  }

  async createTag(name: string): Promise<Tag> {
    try {
      const response = await this.apiService.requestApi('/items/tags', 'POST', {
        name: name.trim(),
        status: 'published'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du tag:', error);
      throw new Error('Impossible de créer le tag');
    }
  }

  async deleteTag(tagId: string): Promise<void> {
    try {
      await this.apiService.requestApi(`/items/tags/${tagId}`, 'DELETE');
    } catch (error) {
      console.error('Erreur lors de la suppression du tag:', error);
      throw new Error('Impossible de supprimer le tag');
    }
  }
}
