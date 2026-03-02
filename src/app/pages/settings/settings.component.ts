import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { BotConfiguration } from '../../core/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page" style="animation: fadeUp 0.3s ease">
      <h1 class="page-title">Configuracion</h1>

      @if (loading()) {
        <div class="loading-row"><span class="spinner-sm"></span> Cargando configuracion...</div>
      } @else {
        <div class="sections">
          <!-- Bot status -->
          <div class="card">
            <div class="card-row">
              <div>
                <h3>Estado del Bot</h3>
                <p class="subtitle">Activa o desactiva el bot completamente</p>
              </div>
              <button class="toggle" [class.on]="config().activo" (click)="toggleBot()">
                <span class="toggle-thumb"></span>
              </button>
            </div>
          </div>

          <!-- Auto-response -->
          <div class="card">
            <div class="card-row">
              <div>
                <h3>Auto-respuesta</h3>
                <p class="subtitle">Responder automaticamente con IA cuando alguien escribe</p>
              </div>
              <button class="toggle" [class.on]="config().autoRespuesta" (click)="toggleAutoRespuesta()">
                <span class="toggle-thumb"></span>
              </button>
            </div>
          </div>

          <!-- Business info -->
          <div class="card">
            <h3>Info del Negocio</h3>
            <div class="fields">
              <div class="field">
                <label>Link del Grupo Consolidado</label>
                <input [(ngModel)]="config().linkGrupoConsolidado" placeholder="https://chat.whatsapp.com/..." />
              </div>
              <div class="field">
                <label>Link del Catalogo</label>
                <input [(ngModel)]="config().linkCatalogo" placeholder="https://drive.google.com/..." />
              </div>
              <div class="field-row">
                <div class="field">
                  <label>Tiempo de Entrega</label>
                  <input [(ngModel)]="config().tiempoEntrega" placeholder="1 a 2 semanas" />
                </div>
                <div class="field">
                  <label>TikTok / Redes</label>
                  <input [(ngModel)]="config().linkTiktok" placeholder="https://www.tiktok.com/@..." />
                </div>
              </div>
            </div>
          </div>

          <!-- Chatbot behavior -->
          <div class="card">
            <h3>Comportamiento del Chatbot</h3>
            <div class="fields">
              <div class="field">
                <label>Instrucciones (prompt del sistema)</label>
                <textarea [(ngModel)]="config().promptSistema" rows="6"
                  placeholder="Eres un asistente de ventas..."></textarea>
                <span class="hint">Controla como responde el bot. Si lo dejas vacio se usa el prompt por defecto.</span>
              </div>
              <div class="field-row">
                <div class="field">
                  <label>Nombre del Bot</label>
                  <input [(ngModel)]="config().nombreBot" placeholder="Asistente" />
                </div>
                <div class="field">
                  <label>Mensaje de Bienvenida</label>
                  <input [(ngModel)]="config().mensajeBienvenida" placeholder="Hola! En que puedo ayudarte?" />
                </div>
              </div>
            </div>
          </div>

          <!-- Campaign prompt -->
          <div class="card">
            <h3>Mensaje de Campana</h3>
            <div class="fields">
              <div class="field">
                <label>Instrucciones para campanas</label>
                <textarea [(ngModel)]="config().promptCampana" rows="4"
                  placeholder="Somos Aroma Studio, importamos perfumes arabes..."></textarea>
                <span class="hint">El bot usara estas instrucciones para generar el mensaje de campana.</span>
              </div>
            </div>
          </div>

          <!-- OpenAI -->
          <div class="card">
            <h3>OpenAI</h3>
            <div class="field-row">
              <div class="field">
                <label>API Key</label>
                <input [(ngModel)]="openaiApiKey" type="password" placeholder="sk-..." />
              </div>
              <div class="field">
                <label>Modelo</label>
                <input [(ngModel)]="config().modeloAi" placeholder="gpt-4o-mini" />
              </div>
            </div>
          </div>

          <!-- Files -->
          <div class="card">
            <h3>Archivos</h3>
            <div class="fields">
              <div class="upload-row">
                <input type="file" id="fileInput" style="display:none"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                  (change)="onFileSelected($event)" />
                <button class="btn-ghost" (click)="triggerFileInput()">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 3v14M3 10h14"/>
                  </svg>
                  Subir archivo
                </button>
                @if (uploading()) { <span class="muted text-sm">Subiendo...</span> }
                @if (uploadError()) { <span class="error-text">{{ uploadError() }}</span> }
              </div>
              <span class="hint">Catalogo, imagenes, documentos. Max 50MB.</span>

              @if (archivos().length > 0) {
                <div class="file-list">
                  @for (archivo of archivos(); track archivo.nombre) {
                    <div class="file-item">
                      <div class="file-meta">
                        <span class="file-name">{{ archivo.nombre }}</span>
                        <span class="file-size">{{ archivo['tamano'] || archivo['tamaño'] || '' }}</span>
                      </div>
                      <div class="file-actions">
                        <button class="icon-btn" (click)="copyFileUrl(archivo.url)" title="Copiar link">
                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="6" y="6" width="10" height="10" rx="2"/><path d="M14 6V4a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h2"/>
                          </svg>
                        </button>
                        <button class="icon-btn danger" (click)="deleteFile(archivo.nombre)" title="Eliminar">
                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 5h10M8 5V3h4v2M6 5v11a1 1 0 001 1h6a1 1 0 001-1V5"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Smart Catalog -->
          <div class="card">
            <h3>Catalogo Inteligente (IA)</h3>
            <p class="subtitle" style="margin-bottom: 14px">Sube tu catalogo o pega un link. La IA usara el contenido para responder.</p>
            <div class="fields">
              <div class="upload-row">
                <input type="file" id="catalogoInput" style="display:none"
                  accept=".pdf,.xlsx,.xls" (change)="onCatalogoSelected($event)" />
                <button class="btn-ghost" (click)="triggerCatalogoInput()">Subir PDF / Excel</button>
                @if (catalogoUploading()) { <span class="muted text-sm">Procesando...</span> }
              </div>

              <div class="field">
                <label>Link de Google Drive / Sheets</label>
                <div class="inline-action">
                  <input [(ngModel)]="catalogoLink" placeholder="https://docs.google.com/spreadsheets/d/..." />
                  <button class="btn-ghost sm" (click)="procesarCatalogoLink()" [disabled]="!catalogoLink">Procesar</button>
                </div>
              </div>

              @if (catalogoError()) { <span class="error-text">{{ catalogoError() }}</span> }
              @if (catalogoSuccess()) { <span class="success-text">{{ catalogoSuccess() }}</span> }

              @if (catalogos().length > 0) {
                <div class="file-list">
                  @for (cat of catalogos(); track cat.id) {
                    <div class="file-item">
                      <div class="file-meta">
                        <span class="file-name">{{ cat.nombre }}</span>
                        <span class="file-size">{{ cat.tipo }} | {{ cat.paginas }} pags | {{ cat.caracteres }} chars</span>
                      </div>
                      <button class="icon-btn danger" (click)="deleteCatalogo(cat.id)" title="Eliminar">
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M5 5h10M8 5V3h4v2M6 5v11a1 1 0 001 1h6a1 1 0 001-1V5"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Payments -->
          <div class="card">
            <div class="card-row">
              <div>
                <h3>Deteccion de pagos</h3>
                <p class="subtitle">Detectar automaticamente Yape/Plin</p>
              </div>
              <button class="toggle" [class.on]="config().verificacionPagosActivo"
                (click)="config().verificacionPagosActivo = !config().verificacionPagosActivo">
                <span class="toggle-thumb"></span>
              </button>
            </div>
          </div>

          <!-- Save -->
          <div class="save-row">
            <button class="btn-primary lg" (click)="save()">Guardar configuracion</button>
            @if (saved()) { <span class="success-text">Guardado correctamente</span> }
            @if (saveError()) { <span class="error-text">Error al guardar</span> }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-title { font-size: 22px; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.3px; }
    .loading-row { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 13px; }

    .sections { display: flex; flex-direction: column; gap: 12px; max-width: 720px; }

    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 20px;
    }
    .card h3 { font-size: 14px; font-weight: 600; margin: 0 0 4px; }
    .subtitle { font-size: 12px; color: var(--text-muted); margin: 0; }

    .card-row { display: flex; align-items: center; justify-content: space-between; }

    .toggle {
      width: 40px; height: 22px; border-radius: 11px; border: none;
      background: var(--border); cursor: pointer; position: relative;
      transition: background var(--transition); flex-shrink: 0;
    }
    .toggle.on { background: var(--success); }
    .toggle-thumb {
      position: absolute; top: 2px; left: 2px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #fff; transition: transform var(--transition);
    }
    .toggle.on .toggle-thumb { transform: translateX(18px); }

    .fields { display: flex; flex-direction: column; gap: 12px; margin-top: 14px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .field input, .field select, .field textarea {
      padding: 9px 12px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--bg);
      color: var(--text); font-size: 13px; outline: none;
      transition: border-color var(--transition); resize: vertical;
    }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--primary); }
    .hint { font-size: 11px; color: var(--text-muted); }

    .inline-action { display: flex; gap: 8px; }
    .inline-action input { flex: 1; }

    .upload-row { display: flex; align-items: center; gap: 10px; }

    .btn-ghost {
      padding: 8px 14px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: transparent;
      color: var(--text-muted); font-size: 12px; font-weight: 500;
      transition: all var(--transition);
      display: inline-flex; align-items: center; gap: 6px;
    }
    .btn-ghost:hover { background: var(--surface-hover); color: var(--text); border-color: var(--border-light); }
    .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-ghost.sm { padding: 6px 10px; font-size: 11px; }

    .btn-primary {
      padding: 10px 24px; border-radius: var(--radius-sm); border: none;
      background: var(--primary); color: #fff; font-weight: 600; font-size: 13px;
      transition: opacity var(--transition);
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary.lg { padding: 12px 32px; font-size: 14px; }

    .save-row { display: flex; align-items: center; gap: 14px; }

    .file-list { display: flex; flex-direction: column; gap: 6px; }
    .file-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; background: var(--bg); border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }
    .file-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
    .file-name { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .file-size { font-size: 10px; color: var(--text-muted); }
    .file-actions { display: flex; gap: 4px; flex-shrink: 0; }

    .icon-btn {
      width: 28px; height: 28px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: transparent;
      color: var(--text-muted); display: flex; align-items: center;
      justify-content: center; transition: all var(--transition);
    }
    .icon-btn:hover { background: var(--surface-hover); color: var(--text); }
    .icon-btn.danger:hover { background: var(--danger-bg); color: var(--danger); }

    .success-text { color: var(--success); font-size: 13px; font-weight: 500; }
    .error-text { color: var(--danger); font-size: 13px; font-weight: 500; }
    .muted { color: var(--text-muted); }
    .text-sm { font-size: 12px; }

    .spinner-sm {
      width: 12px; height: 12px;
      border: 2px solid var(--border); border-top-color: var(--primary);
      border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SettingsComponent implements OnInit {
  private api = inject(ApiService);
  config = signal<BotConfiguration>({} as BotConfiguration);
  openaiApiKey = '';
  loading = signal(true);
  saved = signal(false);
  saveError = signal(false);
  archivos = signal<any[]>([]);
  uploading = signal(false);
  uploadError = signal('');
  catalogos = signal<any[]>([]);
  catalogoUploading = signal(false);
  catalogoError = signal('');
  catalogoSuccess = signal('');
  catalogoLink = '';

  ngOnInit() {
    this.api.getBotConfig().subscribe({
      next: data => { this.config.set(data); this.loading.set(false); },
      error: () => {
        this.config.set({ activo: false, verificacionPagosActivo: false, tiempoEntrega: '1 a 2 semanas' } as BotConfiguration);
        this.loading.set(false);
      }
    });
    this.api.getOpenAiApiKey().subscribe({ next: (data: any) => { this.openaiApiKey = data?.valor || ''; }, error: () => {} });
    this.loadFiles();
    this.loadCatalogos();
  }

  loadFiles() { this.api.getFiles().subscribe({ next: files => this.archivos.set(files || []), error: () => {} }); }

  toggleBot() {
    const isActive = this.config().activo;
    (isActive ? this.api.deactivateBot() : this.api.activateBot()).subscribe({
      next: () => this.config.set({ ...this.config(), activo: !isActive }), error: () => {}
    });
  }

  toggleAutoRespuesta() {
    const current = this.config();
    const newValue = !current.autoRespuesta;
    this.config.set({ ...current, autoRespuesta: newValue });
    this.api.updateBotConfig({ ...current, autoRespuesta: newValue }).subscribe({
      next: data => this.config.set(data),
      error: () => this.config.set({ ...current, autoRespuesta: !newValue })
    });
  }

  save() {
    this.saved.set(false); this.saveError.set(false);
    this.api.updateBotConfig(this.config()).subscribe({
      next: data => { this.config.set(data); this.saved.set(true); setTimeout(() => this.saved.set(false), 3000); },
      error: () => { this.saveError.set(true); setTimeout(() => this.saveError.set(false), 3000); }
    });
    if (this.openaiApiKey?.trim()) {
      this.api.saveOpenAiApiKey(this.openaiApiKey.trim()).subscribe({ error: (err: any) => console.error('Error guardando API key:', err) });
    }
  }

  triggerFileInput() { document.getElementById('fileInput')?.click(); }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0]; if (!file) return;
    this.uploading.set(true); this.uploadError.set('');
    this.api.uploadFile(file).subscribe({
      next: () => { this.uploading.set(false); this.loadFiles(); input.value = ''; },
      error: (err: any) => { this.uploading.set(false); this.uploadError.set(err?.error?.message || 'Error al subir'); input.value = ''; }
    });
  }

  copyFileUrl(url: string) {
    navigator.clipboard.writeText(environment.apiUrl.replace('/api', '') + url);
  }

  deleteFile(fileName: string) { this.api.deleteFile(fileName).subscribe({ next: () => this.loadFiles(), error: () => {} }); }

  loadCatalogos() { this.api.getCatalogos().subscribe({ next: catalogos => this.catalogos.set(catalogos || []), error: () => {} }); }

  triggerCatalogoInput() { document.getElementById('catalogoInput')?.click(); }

  onCatalogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0]; if (!file) return;
    this.catalogoUploading.set(true); this.catalogoError.set(''); this.catalogoSuccess.set('');
    this.api.uploadCatalogo(file).subscribe({
      next: (result: any) => {
        this.catalogoUploading.set(false);
        this.catalogoSuccess.set(`Procesado: ${result.paginas} paginas, ${result.caracteres} chars`);
        this.loadCatalogos(); input.value = '';
        setTimeout(() => this.catalogoSuccess.set(''), 5000);
      },
      error: (err: any) => {
        this.catalogoUploading.set(false);
        this.catalogoError.set(err?.error?.message || 'Error al procesar');
        input.value = ''; setTimeout(() => this.catalogoError.set(''), 5000);
      }
    });
  }

  procesarCatalogoLink() {
    if (!this.catalogoLink) return;
    this.catalogoUploading.set(true); this.catalogoError.set(''); this.catalogoSuccess.set('');
    this.api.procesarCatalogoLink(this.catalogoLink).subscribe({
      next: (result: any) => {
        this.catalogoUploading.set(false);
        this.catalogoSuccess.set(`Link procesado: ${result.caracteres} chars`);
        this.catalogoLink = ''; this.loadCatalogos();
        setTimeout(() => this.catalogoSuccess.set(''), 5000);
      },
      error: (err: any) => {
        this.catalogoUploading.set(false);
        this.catalogoError.set(err?.error?.message || 'Error al procesar link');
        setTimeout(() => this.catalogoError.set(''), 5000);
      }
    });
  }

  deleteCatalogo(catalogoId: number) { this.api.deleteCatalogo(catalogoId).subscribe({ next: () => this.loadCatalogos(), error: () => {} }); }
}
