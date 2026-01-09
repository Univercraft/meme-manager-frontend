import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, LoginData, RegisterData, AuthResponse } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserId: string | null = null;

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.checkAuthState();
    this.setupStorageListener();
  }

  /**
   * Écoute les changements de localStorage entre onglets
   * Si un autre utilisateur se connecte dans un autre onglet, déconnecte l'utilisateur actuel
   */
  private setupStorageListener(): void {
    window.addEventListener('storage', (event) => {
      // Détecte les changements du token ou de l'utilisateur
      if (event.key === 'directus_token' || event.key === 'directus_user') {
        const currentToken = this.getToken();
        const currentUserStr = localStorage.getItem('directus_user');
        
        // Si le token a changé ou a été supprimé
        if (event.key === 'directus_token') {
          if (!event.newValue || event.newValue !== currentToken) {
            console.log('🔄 Token changé dans un autre onglet, rechargement des données utilisateur');
            this.checkAuthState();
          }
        }
        
        // Si l'utilisateur a changé
        if (event.key === 'directus_user' && currentUserStr) {
          try {
            const newUser = event.newValue ? JSON.parse(event.newValue) : null;
            const currentUser = this.currentUserSubject.value;
            
            // Si c'est un utilisateur différent
            if (newUser && currentUser && newUser.id !== currentUser.id) {
              console.log('⚠️  Utilisateur différent connecté dans un autre onglet');
              console.log('   Déconnexion de l\'utilisateur actuel pour éviter les conflits');
              this.handleStorageConflict();
            }
          } catch (error) {
            console.error('Erreur lors de la comparaison des utilisateurs:', error);
          }
        }
      }
    });
  }

  /**
   * Gère le conflit quand un autre utilisateur se connecte dans un autre onglet
   */
  private handleStorageConflict(): void {
    // Afficher un message à l'utilisateur
    alert('Un autre utilisateur s\'est connecté dans un autre onglet. Vous allez être redirigé vers la page de connexion.');
    
    // Déconnecter localement (sans toucher au localStorage qui contient maintenant l'autre utilisateur)
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.currentUserId = null;
    
    // Rediriger vers la page de login
    window.location.href = '/login';
  }

  private checkAuthState(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem('directus_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserId = user.id;
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        console.error('Erreur parsing user:', error);
        this.logout();
      }
    } else {
      this.currentUserId = null;
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
    }
  }

  async login(credentials: LoginData): Promise<User> {
    try {
      const response = await this.apiService.requestApi('/auth/login', 'POST', credentials);
      
      if (response && response.data) {
        await this.handleAuthSuccess(response.data);
        return this.currentUserSubject.value!;
      }
      
      throw new Error('Réponse invalide du serveur');
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      const errorMessage = error?.error?.errors?.[0]?.message || error?.message || '';
      throw new Error(errorMessage || 'Identifiants utilisateur invalides.');
    }
  }

  async register(userData: RegisterData): Promise<User> {
    try {
      let roleId = null;
      
      try {
        const rolesResponse = await this.apiService.requestApi('/roles', 'GET', {
          filter: {
            name: { _eq: 'Authenticated User' }
          },
          limit: 1
        });
        
        if (rolesResponse?.data?.length > 0) {
          roleId = rolesResponse.data[0].id;
        }
      } catch (error) {
        console.warn('Impossible de récupérer le rôle automatiquement');
      }

      const userData_with_role: any = {
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        status: 'active'
      };

      if (roleId) {
        userData_with_role.role = roleId;
      }

      const response = await this.apiService.requestApi('/users', 'POST', userData_with_role);

      if (response && response.data) {
        await this.login({
          email: userData.email,
          password: userData.password
        });
        
        return response.data;
      }
      
      throw new Error('Erreur lors de la création du compte');
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      
      const errorMessage = error?.error?.errors?.[0]?.message || error?.message || '';
      
      if (errorMessage.includes('permission')) {
        throw new Error('L\'inscription publique n\'est pas activée. Contactez l\'administrateur.');
      }
      
      if (errorMessage.includes('unique') || errorMessage.includes('already exists')) {
        throw new Error('Cet email est déjà utilisé');
      }
      
      if (errorMessage.includes('password')) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }
      
      throw new Error(errorMessage || 'Erreur lors de l\'inscription');
    }
  }

  private async handleAuthSuccess(authData: AuthResponse): Promise<void> {
    localStorage.setItem('directus_token', authData.access_token);
    
    if (authData.refresh_token) {
      localStorage.setItem('directus_refresh_token', authData.refresh_token);
    }
    
    this.isAuthenticatedSubject.next(true);
    
    try {
      const userResponse = await this.apiService.requestApi('/users/me', 'GET', {
        fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'date_created', 'role.id', 'role.name', 'role.admin_access']
      });
      
      if (userResponse && userResponse.data) {
        const user = userResponse.data;
        console.log('User loaded with role:', user.role);
        this.currentUserId = user.id;
        localStorage.setItem('directus_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      const minimalUser = {
        id: 'temp',
        email: 'user@example.com',
        first_name: 'User',
        last_name: '',
        date_created: new Date().toISOString()
      };
      this.currentUserId = minimalUser.id;
      localStorage.setItem('directus_user', JSON.stringify(minimalUser));
      this.currentUserSubject.next(minimalUser);
    }
  }

  logout(): void {
    localStorage.removeItem('directus_token');
    localStorage.removeItem('directus_refresh_token');
    localStorage.removeItem('directus_user');
    this.currentUserId = null;
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('directus_token');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('directus_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const userRole = user.role;
    
    console.log('Checking admin status for role:', userRole);

    if (typeof userRole === 'string') {
      return false;
    }
    
    if (typeof userRole === 'object' && userRole) {
      if (userRole.admin_access === true) {
        return true;
      }
      
      const roleName = userRole.name?.toLowerCase();
      if (roleName === 'administrator' || roleName === 'admin') {
        return true;
      }
    }
    
    return false;
  }
}
