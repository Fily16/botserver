import { Component, inject, signal, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Customer } from '../../core/models';

@Component({
  selector: 'app-customers',
  standalone: true,
  template: `
    <div class="page" style="animation: fadeUp 0.3s ease">
      <h1 class="page-title">Clientes</h1>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Telefono</th>
              <th>Pedidos</th>
              <th>Total gastado</th>
              <th>Ultima interaccion</th>
            </tr>
          </thead>
          <tbody>
            @for (c of customers(); track c.id) {
              <tr>
                <td><strong>{{ c.name || 'Sin nombre' }}</strong></td>
                <td class="mono">{{ c.phoneNumber }}</td>
                <td class="mono">{{ c.totalOrders ?? 0 }}</td>
                <td class="mono">S/ {{ c.totalSpent ?? 0 }}</td>
                <td class="muted">{{ c.lastInteraction ? formatDate(c.lastInteraction) : '-' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="empty">No hay clientes registrados</td></tr>
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
  `]
})
export class CustomersComponent implements OnInit {
  private api = inject(ApiService);
  customers = signal<Customer[]>([]);

  ngOnInit() {
    this.api.getCustomers().subscribe({
      next: (data: any) => this.customers.set(data.content || data.customers || data || []),
      error: () => {}
    });
  }

  formatDate(d: string) { return new Date(d).toLocaleDateString('es-PE'); }
}
