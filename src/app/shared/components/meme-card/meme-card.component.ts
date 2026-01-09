import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meme } from '../../interfaces/meme';
import { environment } from '../../../../environments/environment';
import { MemeService } from '../../services/meme.service';
import { LikeService } from '../../services/like.service';
import { SavedMemeService } from '../../services/saved-meme.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-meme-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './meme-card.component.html',
  styleUrls: ['./meme-card.component.css']
})
export class MemeCardComponent implements OnInit {
  @Input() meme!: Meme;
  @Input() showActions: boolean = true;
  @Output() memeClicked = new EventEmitter<Meme>();
  @Output() likeClicked = new EventEmitter<Meme>();
  @Output() saveClicked = new EventEmitter<Meme>();

  isSaved: boolean = false;
  isLiked: boolean = false;

  constructor(
    private memeService: MemeService,
    private likeService: LikeService,
    private savedMemeService: SavedMemeService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.showActions) {
      this.checkIfSaved();
      this.loadLikeStatus();
    }
  }

  checkIfSaved() {
    this.memeService.isMemeSaved(this.meme.id).subscribe(
      (saved: boolean) => this.isSaved = saved
    );
  }

  loadLikeStatus() {
    this.memeService.isMemeLiked(this.meme.id).subscribe(
      (liked: boolean) => this.isLiked = liked
    );
  }

  onMemeClick() {
    this.memeClicked.emit(this.meme);
  }

  onSave(event: Event) {
    event.stopPropagation();
    this.toggleSave();
  }

  onLike(event: Event) {
    event.stopPropagation();
    this.toggleLike();
  }

  async toggleSave() {
    try {
      const result = await this.savedMemeService.toggleSave(this.meme.id);
      this.isSaved = result.isSaved;
      console.log('💾 Sauvegarde mise à jour:', result.isSaved);
    } catch (error) {
      console.error('Erreur toggle save:', error);
    }
  }

  async toggleLike() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    try {
      const result = await this.likeService.toggleLike(this.meme.id);
      this.isLiked = result.isLiked;
      
      // Mettre à jour le compteur local
      if (this.meme.likes !== undefined) {
        this.meme.likes = result.likesCount;
      }
      if (this.meme.likes_count !== undefined) {
        this.meme.likes_count = result.likesCount;
      }
      
      console.log('❤️ Like mis à jour:', result);
    } catch (error) {
      console.error('Erreur toggle like:', error);
    }
  }

  getImageUrl(imageId: string): string {
    if (!imageId) return '';
    return `${environment.directusUrl}/assets/${imageId}`;
  }

  getUserName(): string {
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
}
