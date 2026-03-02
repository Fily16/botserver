import { Component, inject, signal, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="page" style="animation: fadeUp 0.3s ease">
      <h1 class="page-title">Dashboard</h1>

      @if (loading()) {
        <div class="skeleton-grid">
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton-card"></div>
          }
        </div>
      } @else if (error()) {
        <div class="alert-error">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18">
            <circle cx="10" cy="10" r="8"/><path d="M10 6v5M10 13.5v.5"/>
          </svg>
          {{ error() }}
        </div>
      } @else {
        <div class="stats-grid">
          @for (stat of statCards(); track stat.label) {
            <div class="stat-card" [style.--accent]="stat.color">
              <div class="stat-icon-wrap">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path [attr.d]="stat.svgPath" />
                </svg>
              </div>
              <div class="stat-body">
                <span class="stat-value">{{ stat.value }}</span>
                <span class="stat-label">{{ stat.label }}</span>
              </div>
            </div>
          }
        </div>

        <div class="cards-row">
          <div class="info-card">
            <h3 class="info-title">Resumen de hoy</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-value">{{ stats()?.pedidosHoy || 0 }}</span>
                <span class="info-label">Pedidos hoy</span>
              </div>
              <div class="info-item">
                <span class="info-value accent">S/ {{ stats()?.ingresosHoy || 0 }}</span>
                <span class="info-label">Ingresos hoy</span>
              </div>
            </div>
          </div>

          <div class="info-card">
            <h3 class="info-title">Pendientes</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-value warn">{{ stats()?.pedidosPendientes || 0 }}</span>
                <span class="info-label">Pedidos pendientes</span>
              </div>
              <div class="info-item">
                <span class="info-value cyan">{{ stats()?.conversacionesActivas || 0 }}</span>
                <span class="info-label">Chats activos</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-title { font-size: 22px; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.3px; }

    .skeleton-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .skeleton-card {
      height: 96px; border-radius: var(--radius);
      background: var(--surface);
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    .alert-error {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 18px; border-radius: var(--radius);
      background: var(--danger-bg); color: var(--danger);
      border: 1px solid rgba(239,68,68,0.15);
      font-size: 13px; font-weight: 500;
    }

    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 14px; margin-bottom: 20px;
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 18px;
      display: flex; align-items: center; gap: 14px;
      transition: border-color var(--transition), background var(--transition);
    }
    .stat-card:hover {
      border-color: var(--border-light);
      background: var(--surface-2);
    }
    .stat-icon-wrap {
      width: 40px; height: 40px; border-radius: 10px;
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      color: var(--accent);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon-wrap svg { width: 20px; height: 20px; }
    .stat-body { display: flex; flex-direction: column; }
    .stat-value { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
    .stat-label { font-size: 12px; color: var(--text-muted); margin-top: 2px; font-weight: 500; }

    .cards-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    .info-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 20px;
    }
    .info-title {
      font-size: 13px; font-weight: 600; color: var(--text-secondary);
      margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .info-grid { display: flex; gap: 40px; }
    .info-item { display: flex; flex-direction: column; }
    .info-value { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .info-value.accent { color: var(--success); }
    .info-value.warn { color: var(--warning); }
    .info-value.cyan { color: var(--primary); }
    .info-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  stats = signal<any>(null);
  loading = signal(true);
  error = signal('');
  statCards = signal<{svgPath: string; value: string | number; label: string; color: string}[]>([]);

  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: (data: any) => {
        this.stats.set(data);
        this.statCards.set([
          { svgPath: 'M4 4h12a1 1 0 011 1v7a1 1 0 01-1 1H8l-4 3V5a1 1 0 011-1z',
            value: data.totalConversaciones || 0, label: 'Conversaciones', color: '#06b6d4' },
          { svgPath: 'M7 10a3 3 0 100-6 3 3 0 000 6zM2 17v-1a4 4 0 014-4h2a4 4 0 014 4v1',
            value: data.totalClientes || 0, label: 'Clientes', color: '#8b5cf6' },
          { svgPath: 'M4 4l2-2h8l2 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zM8 2v4h4V2',
            value: data.totalProductos || 0, label: 'Productos', color: '#f59e0b' },
          { svgPath: 'M5 4h10l1 2H4l1-2zM4 6h12v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z',
            value: data.totalPedidos || 0, label: 'Pedidos', color: '#10b981' },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo conectar al backend.');
        this.loading.set(false);
      }
    });
  }
}
