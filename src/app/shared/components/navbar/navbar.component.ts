import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationsDropdownComponent } from '../notifications-dropdown/notifications-dropdown.component';
import { User } from '../../interfaces/user';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotificationsDropdownComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  searchQuery: string = '';
  isAuthenticated = false;
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(auth => {
      this.isAuthenticated = auth;
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Réinitialiser la recherche lors du changement de page
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (!this.router.url.includes('gallery')) {
          this.searchQuery = '';
        }
      });
  }

  onSearch(): void {
    console.log('🔍 Search query:', this.searchQuery);
    
    // Si on n'est pas sur la page gallery, naviguer vers elle
    if (!this.router.url.includes('gallery')) {
      this.router.navigate(['/gallery'], { 
        queryParams: { search: this.searchQuery } 
      });
    } else {
      // Émettre un événement custom pour la galerie
      window.dispatchEvent(new CustomEvent('meme-search', { 
        detail: { query: this.searchQuery } 
      }));
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
