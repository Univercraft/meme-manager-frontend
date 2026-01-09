import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  isLoginMode = true;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Rediriger si déjà connecté
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/gallery']);
      }
    });

    this.initForms();
  }

  private initForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Réinitialiser les formulaires
    this.loginForm.reset();
    this.registerForm.reset();
  }

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.authService.login(this.loginForm.value);
      this.successMessage = 'Connexion réussie ! Redirection...';
      
      // Petit délai pour afficher le message de succès
      setTimeout(() => {
        this.router.navigate(['/gallery']);
      }, 500);
    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = error.message || 'Email ou mot de passe incorrect';
      console.error('Erreur de connexion:', error);
    }
  }

  async onRegister(): Promise<void> {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const { confirmPassword, ...userData } = this.registerForm.value;
      const user = await this.authService.register(userData);
      
      // Debug : Vérifier le rôle
      console.log('✅ Utilisateur créé:', user);
      
      this.successMessage = '✨ Inscription réussie ! Redirection...';
      
      setTimeout(() => {
        this.router.navigate(['/gallery']);
      }, 1000);
    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = error.message || 'Erreur lors de l\'inscription';
      console.error('❌ Erreur d\'inscription:', error);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(field: string, form: FormGroup): string {
    const control = form.get(field);
    
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `Ce champ est requis`;
    }
    
    if (control.errors['email']) {
      return 'Email invalide';
    }
    
    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Minimum ${minLength} caractères`;
    }
    
    if (field === 'confirmPassword' && form.errors?.['mismatch']) {
      return 'Les mots de passe ne correspondent pas';
    }

    return '';
  }

  hasError(field: string, form: FormGroup): boolean {
    const control = form.get(field);
    return !!(control && control.invalid && control.touched);
  }
}
