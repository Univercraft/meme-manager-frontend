import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-test-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="padding: 20px;">
      <h1>Test de Navigation</h1>
      
      <div style="margin: 20px 0;">
        <button (click)="testNavigateGallery()" style="margin: 5px; padding: 10px;">
          Test navigate('/gallery')
        </button>
        <button (click)="testNavigateLogin()" style="margin: 5px; padding: 10px;">
          Test navigate('/login')
        </button>
      </div>

      <div style="margin: 20px 0;">
        <a [routerLink]="['/gallery']" style="margin: 5px; padding: 10px; display: inline-block; background: #007bff; color: white; text-decoration: none;">
          Link to Gallery
        </a>
        <a [routerLink]="['/login']" style="margin: 5px; padding: 10px; display: inline-block; background: #007bff; color: white; text-decoration: none;">
          Link to Login
        </a>
      </div>

      <div style="margin-top: 20px;">
        <p>Current URL: {{ getCurrentUrl() }}</p>
      </div>
    </div>
  `
})
export class TestNavigationComponent {
  constructor(private router: Router) {}

  testNavigateGallery(): void {
    console.log('🔍 Navigating to /gallery');
    this.router.navigate(['/gallery']).then(
      success => console.log('✅ Navigation success:', success),
      error => console.error('❌ Navigation error:', error)
    );
  }

  testNavigateLogin(): void {
    console.log('🔍 Navigating to /login');
    this.router.navigate(['/login']).then(
      success => console.log('✅ Navigation success:', success),
      error => console.error('❌ Navigation error:', error)
    );
  }

  getCurrentUrl(): string {
    return this.router.url;
  }
}
