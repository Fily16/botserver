import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Product, Category } from '../../core/models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page" style="animation: fadeUp 0.3s ease">
      <div class="page-header">
        <h1 class="page-title">Productos</h1>
        <button class="btn-primary" (click)="showForm.set(!showForm())">
          {{ showForm() ? 'Cerrar' : '+ Nuevo producto' }}
        </button>
      </div>

      @if (showForm()) {
        <div class="card form-card">
          <h3>{{ editingId() ? 'Editar' : 'Nuevo' }} producto</h3>
          <div class="form-grid">
            <div class="field">
              <label>Nombre</label>
              <input [(ngModel)]="form.name" placeholder="Nombre del producto" />
            </div>
            <div class="field">
              <label>Precio (S/)</label>
              <input [(ngModel)]="form.price" type="number" placeholder="0.00" />
            </div>
            <div class="field">
              <label>Stock</label>
              <input [(ngModel)]="form.stock" type="number" placeholder="0" />
            </div>
            <div class="field">
              <label>Categoria</label>
              <select [(ngModel)]="form.categoryId">
                <option [ngValue]="undefined">Sin categoria</option>
                @for (cat of categories(); track cat.id) {
                  <option [ngValue]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
            <div class="field full">
              <label>Descripcion</label>
              <textarea [(ngModel)]="form.description" rows="2" placeholder="Descripcion..."></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" (click)="saveProduct()">Guardar</button>
            <button class="btn-ghost" (click)="cancelEdit()">Cancelar</button>
          </div>
        </div>
      }

      <div class="search-bar">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16" class="search-icon">
          <circle cx="8.5" cy="8.5" r="5.5"/><path d="M14 14l3 3" stroke-linecap="round"/>
        </svg>
        <input [(ngModel)]="searchQuery" placeholder="Buscar producto..." (keyup.enter)="search()" />
        @if (searchQuery) {
          <button class="btn-ghost sm" (click)="searchQuery = ''; loadProducts()">Limpiar</button>
        }
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Categoria</th>
              <th>Estado</th>
              <th style="width: 80px"></th>
            </tr>
          </thead>
          <tbody>
            @for (p of products(); track p.id) {
              <tr>
                <td><strong>{{ p.name }}</strong></td>
                <td class="mono">S/ {{ p.price }}</td>
                <td class="mono">{{ p.stock ?? '-' }}</td>
                <td>{{ p.categoryName || '-' }}</td>
                <td>
                  <span class="tag" [class.active]="p.active" [class.inactive]="!p.active">
                    {{ p.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="actions">
                  <button class="icon-btn" (click)="editProduct(p)" title="Editar">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M13.5 3.5l3 3L7 16H4v-3L13.5 3.5z"/>
                    </svg>
                  </button>
                  <button class="icon-btn danger" (click)="deleteProduct(p.id)" title="Eliminar">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 5h10M8 5V3h4v2M6 5v11a1 1 0 001 1h6a1 1 0 001-1V5"/>
                    </svg>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty">No hay productos</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }

    .btn-primary {
      padding: 9px 18px; border-radius: var(--radius-sm); border: none;
      background: var(--primary); color: #fff; font-weight: 600; font-size: 13px;
      transition: opacity var(--transition);
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-ghost {
      padding: 9px 16px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: transparent;
      color: var(--text-muted); font-size: 13px; font-weight: 500;
      transition: all var(--transition);
    }
    .btn-ghost:hover { background: var(--surface-hover); color: var(--text); }
    .btn-ghost.sm { padding: 6px 10px; font-size: 11px; }

    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 20px; margin-bottom: 14px;
    }
    .card h3 { font-size: 14px; font-weight: 600; margin-bottom: 14px; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field.full { grid-column: 1 / -1; }
    .field label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .field input, .field select, .field textarea {
      padding: 9px 12px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--bg);
      color: var(--text); font-size: 13px; outline: none;
      transition: border-color var(--transition);
    }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--primary); }
    .form-actions { display: flex; gap: 8px; }

    .search-bar {
      display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
      position: relative;
    }
    .search-icon { position: absolute; left: 12px; color: var(--text-muted); pointer-events: none; }
    .search-bar input {
      flex: 1; padding: 10px 12px 10px 36px; border-radius: var(--radius);
      border: 1px solid var(--border); background: var(--surface);
      color: var(--text); font-size: 13px; outline: none;
      transition: border-color var(--transition);
    }
    .search-bar input:focus { border-color: var(--primary); }

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
    .actions { display: flex; gap: 4px; }

    .icon-btn {
      width: 30px; height: 30px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: transparent;
      color: var(--text-muted); display: flex; align-items: center;
      justify-content: center; transition: all var(--transition);
    }
    .icon-btn:hover { background: var(--surface-hover); color: var(--text); border-color: var(--border-light); }
    .icon-btn.danger:hover { background: var(--danger-bg); color: var(--danger); border-color: rgba(239,68,68,0.3); }

    .tag {
      padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.3px;
    }
    .tag.active { background: var(--success-bg); color: var(--success); }
    .tag.inactive { background: var(--danger-bg); color: var(--danger); }
    .empty { text-align: center; color: var(--text-muted); padding: 40px !important; }
  `]
})
export class ProductsComponent implements OnInit {
  private api = inject(ApiService);
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  searchQuery = '';
  form: Partial<Product> = {};

  ngOnInit() {
    this.loadProducts();
    this.api.getCategories().subscribe({ next: cats => this.categories.set(cats), error: () => {} });
  }

  loadProducts() {
    this.api.getProducts().subscribe({
      next: (data: any) => this.products.set(data.content || data.products || data || []),
      error: () => {}
    });
  }

  search() {
    if (!this.searchQuery) return this.loadProducts();
    this.api.searchProducts(this.searchQuery).subscribe({
      next: data => this.products.set(data || []), error: () => {}
    });
  }

  saveProduct() {
    const obs = this.editingId()
      ? this.api.updateProduct(this.editingId()!, this.form)
      : this.api.createProduct(this.form);
    obs.subscribe({ next: () => { this.cancelEdit(); this.loadProducts(); }, error: () => {} });
  }

  editProduct(p: Product) { this.form = { ...p }; this.editingId.set(p.id); this.showForm.set(true); }

  deleteProduct(id: number) {
    if (!confirm('Eliminar este producto?')) return;
    this.api.deleteProduct(id).subscribe(() => this.loadProducts());
  }

  cancelEdit() { this.form = {}; this.editingId.set(null); this.showForm.set(false); }
}
