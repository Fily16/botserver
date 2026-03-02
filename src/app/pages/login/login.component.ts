import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-mark">S</div>
          <h1>ServerManager</h1>
          <p>Inicia sesion para continuar</p>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" [(ngModel)]="email" name="email"
              placeholder="tu@email.com" required [disabled]="loading()"
              autocomplete="email" />
          </div>

          <div class="field">
            <label for="password">Contrasena</label>
            <input id="password" type="password" [(ngModel)]="password" name="password"
              placeholder="••••••••" required [disabled]="loading()"
              autocomplete="current-password" />
          </div>

          @if (error()) {
            <div class="error-box">{{ error() }}</div>
          }

          <button type="submit" class="btn-login" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span> Ingresando...
            } @else {
              Ingresar
            }
          </button>
        </form>
      </div>
      <div class="login-bg"></div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: var(--bg);
      position: relative; overflow: hidden;
    }
    .login-bg {
      position: absolute; inset: 0; z-index: 0;
      background:
        radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.04) 0%, transparent 50%);
    }
    .login-card {
      position: relative; z-index: 1;
      width: 100%; max-width: 380px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 40px 32px;
      animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .login-header { text-align: center; margin-bottom: 32px; }
    .logo-mark {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, var(--primary) 0%, #0891b2 100%);
      display: inline-flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 20px; color: #fff;
      margin-bottom: 16px;
    }
    .login-header h1 { font-size: 22px; font-weight: 700; color: var(--text); margin: 0 0 6px; }
    .login-header p { color: var(--text-muted); font-size: 13px; margin: 0; }
    .login-form { display: flex; flex-direction: column; gap: 18px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label {
      font-size: 11px; font-weight: 600; color: var(--text-secondary);
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .field input {
      padding: 11px 14px; background: var(--bg);
      border: 1px solid var(--border); border-radius: var(--radius);
      color: var(--text); font-size: 14px; outline: none;
      transition: border-color var(--transition), box-shadow var(--transition);
    }
    .field input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-bg); }
    .field input::placeholder { color: var(--text-muted); }
    .field input:disabled { opacity: 0.5; }
    .error-box {
      background: var(--danger-bg); border: 1px solid rgba(239,68,68,0.2);
      color: var(--danger); padding: 10px 14px; border-radius: var(--radius);
      font-size: 13px; font-weight: 500;
    }
    .btn-login {
      padding: 12px;
      background: linear-gradient(135deg, var(--primary) 0%, #0891b2 100%);
      color: white; border: none; border-radius: var(--radius);
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: opacity var(--transition), transform var(--transition);
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-login:hover:not(:disabled) { opacity: 0.9; }
    .btn-login:active:not(:disabled) { transform: scale(0.98); }
    .btn-login:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor() {
    if (this.auth.isAuthenticated()) this.router.navigate(['/dashboard']);
  }

  onLogin() {
    if (!this.email || !this.password) { this.error.set('Completa todos los campos'); return; }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => { this.loading.set(false); this.error.set(err.error?.message || 'Credenciales incorrectas'); }
    });
  }
}
