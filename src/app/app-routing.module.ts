import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { MemeGalleryComponent } from './pages/meme-gallery/meme-gallery.component';
import { MemeDetailComponent } from './pages/meme-detail/meme-detail.component';
import { CreateMemeComponent } from './pages/create-meme/create-meme.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AuthGuard } from './shared/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/gallery', pathMatch: 'full' },
  { path: 'gallery', component: MemeGalleryComponent },
  { path: 'login', component: LoginComponent },
  { path: 'create-meme', component: CreateMemeComponent, canActivate: [AuthGuard] },
  { path: 'edit-meme/:id', component: CreateMemeComponent, canActivate: [AuthGuard] },
  { path: 'meme/:id', component: MemeDetailComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/gallery' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
