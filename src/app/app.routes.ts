import { Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'gallery',
    pathMatch: 'full'
  },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/meme-gallery/meme-gallery.component').then(m => m.MemeGalleryComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'create-meme',
    loadComponent: () => import('./pages/create-meme/create-meme.component').then(m => m.CreateMemeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'edit-meme/:id',
    loadComponent: () => import('./pages/create-meme/create-meme.component').then(m => m.CreateMemeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'meme/:id',
    loadComponent: () => import('./pages/meme-detail/meme-detail.component').then(m => m.MemeDetailComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'test-nav',
    loadComponent: () => import('./test-navigation.component').then(m => m.TestNavigationComponent)
  },
  {
    path: '**',
    redirectTo: 'gallery'
  }
];
