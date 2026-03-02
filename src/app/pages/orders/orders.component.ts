import { Component, inject, signal, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  template: `
    <div class="page" style="animation: fadeUp 0.3s ease">
      <h1 class="page-title">Pedidos</h1>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            @for (o of orders(); track o.id) {
              <tr>
                <td class="mono"><strong>{{ o.id }}</strong></td>
                <td>{{ o.nombreCliente || o.telefonoCliente || '-' }}</td>
                <td class="mono">S/ {{ o.total || o.montoTotal || 0 }}</td>
                <td>
                  <span class="tag" [class]="'s-' + (o.estado || '').toLowerCase()">{{ o.estado }}</span>
                </td>
                <td class="muted">{{ formatDate(o.fechaCreacion) }}</td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="empty">No hay pedidos</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-title { font-size: 22px; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.3px; }
    .table-wrap {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left; padding: 10px 16px; font-size: 11px;
      color: var(--text-muted); border-bottom: 1px solid var(--border);
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;
    }
    td { padding: 11px 16px; font-size: 13px; border-bottom: 1px solid rgba(39,39,42,0.5); }
    tr:hover td { background: var(--surface-hover); }
    .mono { font-variant-numeric: tabular-nums; }
    .muted { color: var(--text-muted); }
    .empty { text-align: center; color: var(--text-muted); padding: 40px !important; }

    .tag {
      padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.3px;
      background: var(--border); color: var(--text-muted);
    }
    .tag.s-pendiente_pago { background: var(--warning-bg); color: var(--warning); }
    .tag.s-pagado, .tag.s-entregado { background: var(--success-bg); color: var(--success); }
    .tag.s-cancelado { background: var(--danger-bg); color: var(--danger); }
  `]
})
export class OrdersComponent implements OnInit {
  private api = inject(ApiService);
  orders = signal<any[]>([]);

  ngOnInit() { this.loadOrders(); }

  loadOrders() {
    this.api.getOrders().subscribe({
      next: (data: any) => this.orders.set(data?.content || []),
      error: () => {}
    });
  }

  formatDate(d: string) { return d ? new Date(d).toLocaleDateString('es-PE') : '-'; }
}
