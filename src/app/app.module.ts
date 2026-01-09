import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Pages
import { LoginComponent } from './pages/login/login.component';
import { MemeGalleryComponent } from './pages/meme-gallery/meme-gallery.component';
import { MemeDetailComponent } from './pages/meme-detail/meme-detail.component';
import { CreateMemeComponent } from './pages/create-meme/create-meme.component';
import { ProfileComponent } from './pages/profile/profile.component';

// Composants partagés
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { MemeCardComponent } from './shared/components/meme-card/meme-card.component';
import { UploadZoneComponent } from './shared/components/upload-zone/upload-zone.component';
import { TagChipComponent } from './shared/components/tag-chip/tag-chip.component';

@NgModule({
  declarations: [
    AppComponent,
    // Pages
    LoginComponent,
    MemeGalleryComponent,
    MemeDetailComponent,
    CreateMemeComponent,
    ProfileComponent,
    // Composants
    NavbarComponent,
    SpinnerComponent,
    MemeCardComponent,
    UploadZoneComponent,
    TagChipComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
