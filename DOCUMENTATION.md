# Documentation Technique - Frontend (Angular)

## 📖 Table des matières

1. [Architecture Frontend](#architecture-frontend)
2. [Structure du projet](#structure-du-projet)
3. [Services](#services)
4. [Composants](#composants)
5. [Guards et Intercepteurs](#guards-et-intercepteurs)
6. [Routing](#routing)
7. [State Management](#state-management)
8. [Authentification](#authentification)
9. [API Communication](#api-communication)
10. [Développement](#développement)

---

## Architecture Frontend

### Vue d'ensemble

Application **Angular 18** avec architecture modulaire et composants standalone.

```
┌────────────────────────────────────────────┐
│           User Interface (HTML)            │
│     Templates, Tailwind CSS, Events       │
└──────────────┬─────────────────────────────┘
               │
┌──────────────▼─────────────────────────────┐
│          Components Layer                  │
│   Pages, Shared Components, UI Logic      │
└──────────────┬─────────────────────────────┘
               │
┌──────────────▼─────────────────────────────┐
│          Services Layer                    │
│   Business Logic, State, HTTP Calls       │
└──────────────┬─────────────────────────────┘
               │
┌──────────────▼─────────────────────────────┐
│        Core Layer (Interceptors)           │
│   Auth Interceptor, Error Handler         │
└──────────────┬─────────────────────────────┘
               │ HTTP
┌──────────────▼─────────────────────────────┐
│      Backend API (Directus)                │
│        http://localhost:8055               │
└────────────────────────────────────────────┘
```

### Technologies

| Tech            | Version | Rôle                                    |
|-----------------|---------|------------------------------------------|
| Angular         | 18      | Framework SPA                            |
| TypeScript      | 5.x     | Langage typé                             |
| RxJS            | 7.x     | Programmation réactive                   |
| Tailwind CSS    | 4.x     | Framework CSS utility-first              |

---

## Structure du projet

```
src/
├── app/
│   ├── core/                      # Module core (singleton)
│   │   ├── services/
│   │   │   ├── api.service.ts    # Communication API
│   │   │   ├── auth.service.ts   # Authentification
│   │   │   └── error.service.ts  # Gestion erreurs
│   │   │
│   │   ├── guards/
│   │   │   └── auth.guard.ts     # Protection routes
│   │   │
│   │   └── interceptors/
│   │       └── auth.interceptor.ts # Injection token
│   │
│   ├── pages/                     # Pages/Routes
│   │   ├── home/
│   │   │   ├── home.component.ts
│   │   │   ├── home.component.html
│   │   │   └── home.component.css
│   │   │
│   │   ├── meme-gallery/
│   │   │   ├── meme-gallery.component.ts
│   │   │   └── ...
│   │   │
│   │   ├── meme-detail/
│   │   ├── meme-create/
│   │   ├── meme-edit/
│   │   ├── profile/
│   │   └── auth/
│   │       ├── login/
│   │       └── callback/
│   │
│   ├── shared/                    # Code partagé
│   │   ├── components/           # Composants réutilisables
│   │   │   ├── navbar/
│   │   │   ├── footer/
│   │   │   ├── meme-card/
│   │   │   └── loading-spinner/
│   │   │
│   │   ├── services/             # Services métier
│   │   │   ├── meme.service.ts
│   │   │   ├── like.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── saved-meme.service.ts
│   │   │   └── search.service.ts
│   │   │
│   │   └── interfaces/           # Types TypeScript
│   │       ├── meme.ts
│   │       ├── user.ts
│   │       ├── notification.ts
│   │       └── api-response.ts
│   │
│   ├── app.component.ts          # Composant racine
│   ├── app.config.ts             # Configuration app
│   └── app.routes.ts             # Définition des routes
│
├── environments/                  # Configuration environnement
│   ├── environment.ts
│   └── environment.development.ts
│
├── assets/                        # Ressources statiques
│   ├── images/
│   └── icons/
│
├── index.html                     # HTML principal
├── main.ts                        # Point d'entrée
└── styles.css                     # Styles globaux (Tailwind)
```

---

## Services

### 1. ApiService (Communication API)

**Fichier** : `src/app/core/services/api.service.ts`

**Rôle** : Centralise toutes les requêtes HTTP vers le backend Directus

```typescript
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl; // http://localhost:8055

  constructor() {}

  /**
   * Effectue une requête API générique
   * @param endpoint - Endpoint relatif (ex: /items/memes)
   * @param method - Méthode HTTP (GET, POST, PATCH, DELETE)
   * @param data - Corps de la requête (pour POST/PATCH)
   * @param params - Paramètres query string
   */
  async requestApi(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    data?: any,
    params?: Record<string, any>
  ): Promise<any> {
    // Construction de l'URL avec params
    const url = this.buildUrl(endpoint, params);

    // Headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    // Ajouter le token si disponible
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Configuration de la requête
    const config: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  /**
   * Upload d'un fichier
   */
  async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/files`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'upload');
    }

    return await response.json();
  }

  /**
   * Construit l'URL avec paramètres
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Récupère le token JWT du localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}
```

### 2. AuthService (Authentification)

**Fichier** : `src/app/core/services/auth.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User } from '../../shared/interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // État de l'utilisateur connecté
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  // État d'authentification
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    this.checkAuthentication();
  }

  /**
   * Vérifie si l'utilisateur est authentifié au démarrage
   */
  private async checkAuthentication(): Promise<void> {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        await this.loadCurrentUser();
      } catch (error) {
        console.error('Token invalide, déconnexion');
        this.logout();
      }
    }
  }

  /**
   * Initie la connexion via GitHub OAuth
   */
  loginWithGithub(): void {
    const authUrl = `${environment.apiUrl}/auth/login/github`;
    window.location.href = authUrl;
  }

  /**
   * Traite le callback OAuth après redirection
   * @param code - Code d'autorisation GitHub
   */
  async handleOAuthCallback(code: string): Promise<void> {
    try {
      // Échanger le code contre des tokens
      const response = await this.apiService.requestApi(
        `/auth/login/github/callback`,
        'GET',
        undefined,
        { code }
      );

      // Stocker les tokens
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);

      // Charger l'utilisateur
      await this.loadCurrentUser();

      // Rediriger vers la page d'accueil
      this.router.navigate(['/']);
    } catch (error) {
      console.error('❌ Erreur OAuth callback:', error);
      throw error;
    }
  }

  /**
   * Charge les informations de l'utilisateur connecté
   */
  async loadCurrentUser(): Promise<void> {
    try {
      const response = await this.apiService.requestApi('/users/me', 'GET');
      this.currentUserSubject.next(response.data);
      this.isAuthenticatedSubject.next(true);
    } catch (error) {
      console.error('❌ Impossible de charger l\'utilisateur:', error);
      this.logout();
      throw error;
    }
  }

  /**
   * Déconnexion
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Récupère l'utilisateur connecté (synchrone)
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifie si l'utilisateur est authentifié (synchrone)
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}
```

### 3. MemeService (Gestion des memes)

**Fichier** : `src/app/shared/services/meme.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Meme, CreateMemeData } from '../interfaces/meme';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemeService {
  constructor(private apiService: ApiService) {}

  /**
   * Récupère une liste paginée de memes
   */
  async getMemes(
    page: number = 1,
    limit: number = 12,
    search?: string,
    tags?: string[]
  ): Promise<{ data: Meme[], meta: any }> {
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
      const response = await this.apiService.requestApi('/items/memes', 'GET', undefined, params);
      return { data: response?.data || [], meta: response?.meta || {} };
    } catch (error) {
      console.error('❌ Erreur getMemes:', error);
      return { data: [], meta: { filter_count: 0 } };
    }
  }

  /**
   * Récupère un meme par son ID
   */
  async getMemeById(id: string): Promise<Meme> {
    const response = await this.apiService.requestApi(
      `/items/memes/${id}`,
      'GET',
      undefined,
      {
        fields: '*,user_created.id,user_created.first_name,user_created.last_name,user_created.email,tags.tags_id.*'
      }
    );
    return response.data;
  }

  /**
   * Crée un nouveau meme
   */
  async createMeme(memeData: CreateMemeData): Promise<Meme> {
    const response = await this.apiService.requestApi(
      '/items/memes',
      'POST',
      memeData
    );
    return response.data;
  }

  /**
   * Met à jour un meme
   */
  async updateMeme(id: string, data: Partial<Meme>): Promise<Meme> {
    const response = await this.apiService.requestApi(
      `/items/memes/${id}`,
      'PATCH',
      data
    );
    return response.data;
  }

  /**
   * Supprime un meme
   */
  async deleteMeme(memeId: string): Promise<void> {
    await this.apiService.requestApi(`/items/memes/${memeId}`, 'DELETE');
  }

  /**
   * Récupère les memes d'un utilisateur
   */
  async getUserMemes(userId: string): Promise<Meme[]> {
    const params = {
      'filter[user_created][_eq]': userId,
      fields: ['*', 'tags.tags_id.name'].join(','),
      sort: '-date_created'
    };

    const response = await this.apiService.requestApi('/items/memes', 'GET', undefined, params);
    return response.data;
  }

  /**
   * Récupère les memes populaires
   */
  async getPopularMemes(limit: number = 10): Promise<Meme[]> {
    const params = {
      limit,
      fields: ['*', 'user_created.first_name', 'user_created.last_name'].join(','),
      sort: '-likes,-views',
      'filter[status][_eq]': 'published'
    };

    const response = await this.apiService.requestApi('/items/memes', 'GET', undefined, params);
    return response.data;
  }
}
```

### 4. SearchService (Recherche Meilisearch)

**Fichier** : `src/app/shared/services/search.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Meme } from '../interfaces/meme';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private meilisearchUrl = 'http://localhost:7701';
  private apiKey = 'dev-meilisearch-key-123';

  /**
   * Recherche de memes via Meilisearch
   */
  async searchMemes(query: string, limit: number = 20): Promise<Meme[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const url = `${this.meilisearchUrl}/indexes/memes/search`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          q: query,
          limit,
          attributesToRetrieve: ['*'],
          attributesToHighlight: ['title', 'description'],
          filter: 'status = published'
        })
      });

      const data = await response.json();
      return data.hits || [];
    } catch (error) {
      console.error('❌ Erreur recherche Meilisearch:', error);
      return [];
    }
  }
}
```

---

## Composants

### MemeGalleryComponent (Galerie)

**Fichier** : `src/app/pages/meme-gallery/meme-gallery.component.ts`

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MemeService } from '../../shared/services/meme.service';
import { SearchService } from '../../shared/services/search.service';
import { AuthService } from '../../core/services/auth.service';
import { Meme } from '../../shared/interfaces/meme';
import { MemeCardComponent } from '../../shared/components/meme-card/meme-card.component';

@Component({
  selector: 'app-meme-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, MemeCardComponent],
  templateUrl: './meme-gallery.component.html',
  styleUrls: ['./meme-gallery.component.css']
})
export class MemeGalleryComponent implements OnInit, OnDestroy {
  memes: Meme[] = [];
  isLoading = true;
  error = '';
  isAuthenticated = false;
  hasMore = true;
  currentPage = 1;
  searchQuery = '';
  private searchTimeout: any;

  constructor(
    private memeService: MemeService,
    private searchService: SearchService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Écouter le statut d'authentification
    this.authService.isAuthenticated$.subscribe(auth => {
      this.isAuthenticated = auth;
    });

    // Écouter les événements de recherche
    window.addEventListener('meme-search', this.handleSearchEvent as EventListener);

    this.loadMemes(true);
  }

  ngOnDestroy(): void {
    window.removeEventListener('meme-search', this.handleSearchEvent as EventListener);
  }

  /**
   * Gestionnaire d'événement de recherche
   */
  private handleSearchEvent = (event: CustomEvent): void => {
    this.onSearch(event.detail.query);
  };

  /**
   * Charge les memes
   */
  async loadMemes(reset: boolean = false): Promise<void> {
    if (reset) {
      this.currentPage = 1;
      this.memes = [];
    }

    this.isLoading = true;
    this.error = '';

    try {
      // Recherche via Meilisearch si query présente
      if (this.searchQuery.trim()) {
        const results = await this.searchService.searchMemes(
          this.searchQuery,
          this.currentPage * 12
        );
        this.memes = results;
        this.hasMore = false; // Pas de pagination pour la recherche
      } else {
        // Pagination classique
        const { data, meta } = await this.memeService.getMemes(
          this.currentPage,
          12
        );

        if (reset) {
          this.memes = data;
        } else {
          this.memes = [...this.memes, ...data];
        }

        this.hasMore = this.memes.length < meta.filter_count;
      }
    } catch (error) {
      this.error = 'Erreur lors du chargement des memes';
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Charge la page suivante (infinite scroll)
   */
  loadMore(): void {
    if (!this.isLoading && this.hasMore) {
      this.currentPage++;
      this.loadMemes();
    }
  }

  /**
   * Gère la recherche avec debounce
   */
  onSearch(query: string): void {
    this.searchQuery = query;
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.loadMemes(true);
    }, 300); // 300ms debounce
  }
}
```

### MemeCardComponent (Carte de meme)

**Fichier** : `src/app/shared/components/meme-card/meme-card.component.ts`

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meme } from '../../interfaces/meme';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-meme-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="meme-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      <!-- Image -->
      <a [routerLink]="['/meme', meme.id]">
        <img 
          [src]="imageUrl" 
          [alt]="meme.title"
          class="w-full h-48 object-cover"
        />
      </a>

      <!-- Contenu -->
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-2">{{ meme.title }}</h3>
        
        <p class="text-gray-600 text-sm mb-3" *ngIf="meme.description">
          {{ meme.description | slice:0:100 }}{{ meme.description.length > 100 ? '...' : '' }}
        </p>

        <!-- Statistiques -->
        <div class="flex items-center justify-between text-sm text-gray-500">
          <span>👁 {{ meme.views }}</span>
          <span>❤️ {{ meme.likes }}</span>
        </div>

        <!-- Actions -->
        <div class="mt-3 flex gap-2" *ngIf="isAuthenticated">
          <button 
            (click)="onLike()"
            class="btn btn-primary flex-1"
          >
            Like
          </button>
          <button 
            (click)="onSave()"
            class="btn btn-secondary flex-1"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .meme-card {
      transition: transform 0.2s;
    }
    .meme-card:hover {
      transform: translateY(-4px);
    }
  `]
})
export class MemeCardComponent {
  @Input() meme!: Meme;
  @Input() isAuthenticated = false;
  @Output() liked = new EventEmitter<string>();
  @Output() saved = new EventEmitter<string>();

  /**
   * URL complète de l'image
   */
  get imageUrl(): string {
    return `${environment.apiUrl}/assets/${this.meme.image}`;
  }

  onLike(): void {
    this.liked.emit(this.meme.id);
  }

  onSave(): void {
    this.saved.emit(this.meme.id);
  }
}
```

---

## Guards et Intercepteurs

### AuthGuard (Protection routes)

**Fichier** : `src/app/core/guards/auth.guard.ts`

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirection vers login avec URL de retour
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};
```

### AuthInterceptor (Injection token)

**Fichier** : `src/app/core/interceptors/auth.interceptor.ts`

```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
```

---

## Routing

**Fichier** : `src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/meme-gallery/meme-gallery.component').then(m => m.MemeGalleryComponent)
  },
  {
    path: 'meme/:id',
    loadComponent: () => import('./pages/meme-detail/meme-detail.component').then(m => m.MemeDetailComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/meme-create/meme-create.component').then(m => m.MemeCreateComponent),
    canActivate: [authGuard]  // Route protégée
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./pages/auth/callback/callback.component').then(m => m.CallbackComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
```

---

## Développement

### Démarrer le serveur de développement

```bash
npm start
# ou
ng serve
```

Application accessible sur http://localhost:4200

### Build de production

```bash
ng build --configuration production
```

Fichiers compilés dans `dist/`

### Tests

```bash
# Tests unitaires
ng test

# Tests e2e
ng e2e

# Coverage
ng test --code-coverage
```

### Génération de code

```bash
# Nouveau composant
ng generate component pages/my-page --standalone

# Nouveau service
ng generate service shared/services/my-service

# Nouveau guard
ng generate guard core/guards/my-guard
```

---

## Ressources

- [Angular Docs](https://angular.io/docs)
- [RxJS Docs](https://rxjs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Dernière mise à jour** : Janvier 2026
