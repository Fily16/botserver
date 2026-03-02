import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="logo">
          <div class="logo-mark">S</div>
          <span class="logo-text">{{ empresaNombre() || 'ServerManager' }}</span>
        </div>

        <nav class="nav">
          @for (item of menuItems; track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: item.path === '/dashboard'}"
               class="nav-item">
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path [attr.d]="item.svgPath" />
                @if (item.svgPath2) {
                  <path [attr.d]="item.svgPath2" />
                }
              </svg>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="status" [class.online]="backendOnline()" [class.offline]="!backendOnline()">
            <span class="dot"></span>
            {{ backendOnline() ? 'Conectado' : 'Sin conexion' }}
          </div>
          <div class="user-info">
            <div class="user-avatar">{{ (userName() || 'U')[0].toUpperCase() }}</div>
            <span class="user-name">{{ userName() }}</span>
            <button class="btn-logout" (click)="logout()" title="Cerrar sesion">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                <path d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3M13 14l4-4-4-4M17 10H7" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; height: 100vh; overflow: hidden; }

    .sidebar {
      width: 232px; min-width: 232px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column;
    }

    .logo {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 18px;
      border-bottom: 1px solid var(--border);
    }
    .logo-mark {
      width: 28px; height: 28px; border-radius: 8px;
      background: linear-gradient(135deg, var(--primary) 0%, #0891b2 100%);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 14px; color: #fff;
      flex-shrink: 0;
    }
    .logo-text {
      font-size: 14px; font-weight: 700; color: var(--text);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .nav {
      flex: 1; padding: 8px;
      display: flex; flex-direction: column; gap: 1px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 8px;
      color: var(--text-muted); font-size: 13px; font-weight: 500;
      transition: all var(--transition);
      text-decoration: none;
    }
    .nav-item:hover {
      background: var(--surface-hover); color: var(--text-secondary);
    }
    .nav-item.active {
      background: var(--primary-bg);
      color: var(--primary);
    }
    .nav-icon { width: 18px; height: 18px; flex-shrink: 0; }

    .sidebar-footer {
      padding: 12px 14px;
      border-top: 1px solid var(--border);
      display: flex; flex-direction: column; gap: 10px;
    }

    .status {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; color: var(--text-muted); font-weight: 500;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .status.online .dot { background: var(--success); box-shadow: 0 0 6px var(--success); }
    .status.offline .dot { background: var(--danger); }

    .user-info { display: flex; align-items: center; gap: 8px; }
    .user-avatar {
      width: 24px; height: 24px; border-radius: 6px;
      background: var(--border); color: var(--text-secondary);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; flex-shrink: 0;
    }
    .user-name {
      font-size: 12px; color: var(--text-secondary); font-weight: 500;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
    }
    .btn-logout {
      background: none; border: 1px solid transparent;
      color: var(--text-muted);
      width: 28px; height: 28px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all var(--transition);
    }
    .btn-logout:hover {
      color: var(--danger); background: var(--danger-bg);
      border-color: rgba(239, 68, 68, 0.2);
    }

    .content {
      flex: 1; overflow-y: auto;
      padding: 28px 36px;
      background: var(--bg);
    }
  `]
})
export class LayoutComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  backendOnline = signal(false);
  empresaNombre = signal('');
  userName = signal('');

  menuItems = [
    { path: '/dashboard', label: 'Dashboard',
      svgPath: 'M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3z', svgPath2: 'M11 11h6v6h-6z' },
    { path: '/conversations', label: 'Conversaciones',
      svgPath: 'M4 4h12a1 1 0 011 1v7a1 1 0 01-1 1H8l-4 3V5a1 1 0 011-1z', svgPath2: '' },
    { path: '/products', label: 'Productos',
      svgPath: 'M4 4l2-2h8l2 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z', svgPath2: 'M8 2v4h4V2' },
    { path: '/customers', label: 'Clientes',
      svgPath: 'M7 10a3 3 0 100-6 3 3 0 000 6zM2 17v-1a4 4 0 014-4h2a4 4 0 014 4v1',
      svgPath2: 'M13 7a3 3 0 110 0M15 12a4 4 0 013 4v1' },
    { path: '/orders', label: 'Pedidos',
      svgPath: 'M5 4h10l1 2H4l1-2zM4 6h12v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z', svgPath2: 'M8 10h4' },
    { path: '/whatsapp', label: 'WhatsApp',
      svgPath: 'M3 17l1.5-4.5A7 7 0 1113.5 15.5L17 17l-4.5-1.5', svgPath2: 'M10 3a7 7 0 017 7' },
    { path: '/campaigns', label: 'Campanas',
      svgPath: 'M5 15l-2 2V5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5z', svgPath2: 'M8 8h4M8 11h2' },
    { path: '/settings', label: 'Configuracion',
      svgPath: 'M10 13a3 3 0 100-6 3 3 0 000 6z',
      svgPath2: 'M10 1v2M10 17v2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M1 10h2M17 10h2M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4' },
  ];

  constructor() {
    this.empresaNombre.set(this.auth.getEmpresaNombre());
    this.userName.set(this.auth.getNombre());
    this.checkHealth();
    setInterval(() => this.checkHealth(), 30000);
  }

  checkHealth() {
    this.api.health().subscribe({
      next: () => this.backendOnline.set(true),
      error: () => this.backendOnline.set(false)
    });
  }

  logout() { this.auth.logout(); }
}
