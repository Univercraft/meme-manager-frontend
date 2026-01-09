import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MemeCardComponent } from '../../shared/components/meme-card/meme-card.component';
import { MemeService } from '../../shared/services/meme.service';
import { LikeService } from '../../shared/services/like.service';
import { AuthService } from '../../shared/services/auth.service';
import { SearchService } from '../../shared/services/search.service';
import { Meme } from '../../shared/interfaces/meme';

@Component({
  selector: 'app-meme-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, MemeCardComponent],
  templateUrl: './meme-gallery.component.html',
  styleUrls: ['./meme-gallery.component.css']
})
export class MemeGalleryComponent implements OnInit {
  memes: (Meme & { similarityScore?: number })[] = [];
  allMemes: Meme[] = [];
  filteredMemes: (Meme & { similarityScore?: number })[] = [];
  isLoading = true;
  error = '';
  isAuthenticated = false;
  hasMore = true;
  currentPage = 1;
  searchQuery = '';
  private searchTimeout: any;

  constructor(
    private memeService: MemeService,
    private likeService: LikeService,
    private authService: AuthService,
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(auth => {
      this.isAuthenticated = auth;
    });

    // Écouter les événements de recherche depuis la navbar
    window.addEventListener('meme-search', ((event: CustomEvent) => {
      this.onSearch(event.detail.query);
    }) as EventListener);

    this.loadMemes(true);
  }

  ngOnDestroy(): void {
    // Nettoyer l'écouteur d'événements
    window.removeEventListener('meme-search', this.onSearch as any);
    clearTimeout(this.searchTimeout);
  }

  async loadMemes(reset: boolean = false): Promise<void> {
    if (reset) {
      this.currentPage = 1;
      this.allMemes = [];
      this.memes = [];
    }

    this.isLoading = true;
    this.error = '';

    try {
      // Charger TOUS les memes (sans pagination côté serveur)
      const response = await this.memeService.getMemes(1, -1);
      this.allMemes = response.data || [];
      
      // Appliquer le filtre de recherche
      this.applySearch();

      this.isLoading = false;
      this.hasMore = false; // Plus de pagination puisqu'on charge tout
    } catch (error) {
      this.isLoading = false;
      this.error = 'Impossible de charger les memes';
      console.error('Erreur:', error);
    }
  }

  onSearch(query: string): void {
    this.searchQuery = query;

    // Debounce de 300ms
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applySearch();
    }, 300);
  }

  private applySearch(): void {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      // Pas de recherche, afficher tous les memes sans score
      this.memes = this.allMemes.map(meme => ({ ...meme }));
      return;
    }

    console.log('🔍 Recherche:', this.searchQuery);
    
    // Seuil abaissé à 65% pour plus de flexibilité
    const results = this.searchService.searchWithScore(
      this.allMemes,
      this.searchQuery,
      0.65
    );

    console.log(`✅ ${results.length} résultat(s) trouvé(s)`);
    
    results.forEach(result => {
      const percentage = (result.similarityScore * 100).toFixed(0);
      const emoji = result.similarityScore >= 0.9 ? '🎯' : 
                    result.similarityScore >= 0.8 ? '✅' : '⭐';
      console.log(`  ${emoji} "${result.title}" (${percentage}%)`);
    });

    this.memes = results;
  }

  async loadMore(): Promise<void> {
    // Plus nécessaire car on charge tout d'un coup
    return;
  }

  onMemeClicked(meme: Meme): void {
    this.router.navigate(['/meme', meme.id]);
  }

  async onLikeClicked(meme: Meme): Promise<void> {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const result = await this.likeService.toggleLike(meme.id);
      
      const index = this.memes.findIndex(m => m.id === meme.id);
      if (index !== -1) {
        this.memes[index].likes = result.likesCount;
      }
      
      const allIndex = this.allMemes.findIndex(m => m.id === meme.id);
      if (allIndex !== -1) {
        this.allMemes[allIndex].likes = result.likesCount;
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  }

  scrollToTop(): void {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  }
}
