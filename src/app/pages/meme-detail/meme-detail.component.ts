import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MemeService } from '../../shared/services/meme.service';
import { LikeService } from '../../shared/services/like.service';
import { AuthService } from '../../shared/services/auth.service';
import { Meme } from '../../shared/interfaces/meme';
import { User } from '../../shared/interfaces/user';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-meme-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './meme-detail.component.html',
  styleUrls: ['./meme-detail.component.css']
})
export class MemeDetailComponent implements OnInit {
  meme: Meme | null = null;
  isLoading = true;
  error = '';
  currentUser: User | null = null;
  isLiked = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private memeService: MemeService,
    private likeService: LikeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadMeme(id);
      }
    });
  }

  async loadMeme(memeId: string): Promise<void> {
    this.isLoading = true;
    this.error = '';

    try {
      this.meme = await this.memeService.getMemeById(memeId);
      
      if (this.currentUser) {
        await this.checkIfLiked(memeId);
      }

      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      this.error = 'Impossible de charger ce meme';
      console.error('Erreur chargement meme:', error);
    }
  }

  async checkIfLiked(memeId: string): Promise<void> {
    try {
      this.isLiked = await this.likeService.isLiked(memeId);
    } catch (error) {
      console.error('Erreur check like:', error);
      this.isLiked = false;
    }
  }

  async onLike(): Promise<void> {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.meme) return;

    try {
      const result = await this.likeService.toggleLike(this.meme.id);
      
      this.isLiked = result.isLiked;
      this.meme.likes = result.likesCount;
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  }

  getImageUrl(imageId: string): string {
    if (!imageId) return '';
    return `${environment.directusUrl}/assets/${imageId}`;
  }

  getUserName(): string {
    if (!this.meme) return 'Utilisateur';
    
    if (typeof this.meme.user_created === 'object' && this.meme.user_created) {
      const user = this.meme.user_created;
      return user.first_name 
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : user.email || 'Utilisateur';
    }
    
    return 'Utilisateur';
  }

  getTagName(tag: any): string {
    return typeof tag === 'object' && tag.tags_id 
      ? (typeof tag.tags_id === 'object' ? tag.tags_id.name : tag.tags_id)
      : (typeof tag === 'object' ? tag.name : tag);
  }

  getTagId(index: number, tag: any): string {
    if (typeof tag.tags_id === 'object' && tag.tags_id?.id) {
      return tag.tags_id.id;
    }
    if (typeof tag.tags_id === 'string') {
      return tag.tags_id;
    }
    return index.toString();
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  canEditMeme(): boolean {
    if (!this.meme || !this.currentUser) {
      return false;
    }

    // Admin peut tout modifier
    if (this.isAdmin()) {
      console.log('Admin access granted');
      return true;
    }

    // Sinon, seulement le créateur
    const memeUserId = typeof this.meme.user_created === 'string' 
      ? this.meme.user_created 
      : this.meme.user_created?.id;

    const canEdit = memeUserId === this.currentUser.id;
    console.log('Can edit (owner):', canEdit, 'Meme user:', memeUserId, 'Current user:', this.currentUser.id);
    
    return canEdit;
  }

  async onDelete(): Promise<void> {
    if (!this.meme || !confirm('Êtes-vous sûr de vouloir supprimer ce meme ?')) {
      return;
    }

    try {
      await this.memeService.deleteMeme(this.meme.id);
      this.router.navigate(['/gallery']);
    } catch (error) {
      console.error('Erreur suppression:', error);
      this.error = 'Erreur lors de la suppression';
    }
  }

  goBack(): void {
    this.router.navigate(['/gallery']);
  }
}
