import { Component, OnInit } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MemeCardComponent } from '../../shared/components/meme-card/meme-card.component';
import { AuthService } from '../../shared/services/auth.service';
import { MemeService } from '../../shared/services/meme.service';
import { SavedMemeService } from '../../shared/services/saved-meme.service';
import { User } from '../../shared/interfaces/user';
import { Meme } from '../../shared/interfaces/meme';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, MemeCardComponent, UpperCasePipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  userMemes: Meme[] = [];
  savedMemes: any[] = [];
  isLoading = true;
  activeTab: 'created' | 'saved' = 'created';

  constructor(
    private authService: AuthService,
    private memeService: MemeService,
    private savedMemeService: SavedMemeService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Vérifier si on doit afficher les favoris via query params
    this.router.routerState.root.queryParams.subscribe(params => {
      if (params['tab'] === 'saved') {
        this.activeTab = 'saved';
      }
    });

    this.loadUserMemes();
    this.loadSavedMemes();
  }

  async loadUserMemes(): Promise<void> {
    if (!this.currentUser) return;

    try {
      this.userMemes = await this.memeService.getUserMemes(this.currentUser.id);
    } catch (error) {
      console.error('Erreur chargement memes:', error);
    } finally {
      this.isLoading = false;
    }
  }

  loadSavedMemes() {
    if (!this.currentUser) return;
    
    this.savedMemeService.getSavedMemes(this.currentUser.id).then(savedMemes => {
      console.log('📌 Memes sauvegardés:', savedMemes);
      this.savedMemes = savedMemes.map((item: any) => item.meme_id).filter(m => m);
    }).catch(error => {
      console.error('Erreur chargement saved memes:', error);
      this.savedMemes = [];
    });
  }

  switchTab(tab: 'created' | 'saved'): void {
    this.activeTab = tab;
    if (tab === 'saved' && this.savedMemes.length === 0) {
      this.loadSavedMemes();
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getTotalLikes(): number {
    return this.userMemes.reduce((sum, meme) => sum + (meme.likes || 0), 0);
  }

  getTotalViews(): number {
    return this.userMemes.reduce((sum, meme) => sum + (meme.views || 0), 0);
  }

  onMemeClicked(meme: Meme): void {
    this.router.navigate(['/meme', meme.id]);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'Utilisateur';
    return `${this.currentUser.first_name || ''} ${this.currentUser.last_name || ''}`.trim() 
           || this.currentUser.email;
  }
}
