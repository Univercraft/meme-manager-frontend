import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

/**
 * Intercepteur HTTP pour gérer l'authentification et les erreurs
 * Ajoute automatiquement le token aux requêtes et gère les erreurs 401
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Récupérer le token depuis localStorage
    const token = localStorage.getItem('directus_token');
    
    // Cloner la requête et ajouter le token si disponible
    if (token && !request.headers.has('Authorization')) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Gérer les erreurs
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si erreur 401 (non autorisé), rediriger vers login
        if (error.status === 401) {
          console.warn('⚠️ Erreur 401: Session expirée');
          localStorage.removeItem('directus_token');
          localStorage.removeItem('directus_user');
          this.router.navigate(['/login']);
        }

        // Si erreur 403 (interdit)
        if (error.status === 403) {
          console.error('❌ Erreur 403: Accès refusé');
        }

        // Si erreur 404
        if (error.status === 404) {
          console.error('❌ Erreur 404: Ressource non trouvée');
        }

        // Si erreur serveur (500+)
        if (error.status >= 500) {
          console.error('❌ Erreur serveur:', error.message);
        }

        return throwError(() => error);
      })
    );
  }
}
