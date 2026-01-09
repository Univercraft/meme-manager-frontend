import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../../shared/services/auth.service';
import { UserRole } from '../../shared/models';

/**
 * Guard pour protéger les routes administrateur
 * Vérifie que l'utilisateur connecté a le rôle 'admin'
 */
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          console.warn('⚠️ AdminGuard: Utilisateur non connecté');
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }

        const userRole = typeof user.role === 'string' ? user.role : user.role?.toString();
        
        if (userRole !== UserRole.ADMIN && userRole !== 'admin') {
          console.warn('⚠️ AdminGuard: Accès refusé - rôle insuffisant');
          this.router.navigate(['/']);
          return false;
        }

        return true;
      })
    );
  }
}
