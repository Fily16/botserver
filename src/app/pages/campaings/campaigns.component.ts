import { Component, DestroyRef, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="page" style="animation: fadeUp 0.3s ease">
      <h1 class="page-title">Campanas</h1>

      @if (groupsError()) {
        <div class="alert-error">
          <strong>Error cargando grupos:</strong> {{ groupsError() }}
          <button class="btn-ghost sm" (click)="loadGroups()" style="margin-left: 10px">Reintentar</button>
        </div>
      }

      <!-- STEP 1: Select group with autocomplete -->
      <div class="card">
        <div class="step-header">
          <span class="step-num">1</span>
          <h3>Seleccionar Grupo</h3>
        </div>

        @if (loadingGroups()) {
          <div class="loading-row"><span class="spinner-sm"></span> Cargando grupos de WhatsApp...</div>
        } @else {
          <div class="autocomplete-wrap">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16" class="ac-icon">
              <circle cx="8.5" cy="8.5" r="5.5"/><path d="M14 14l3 3" stroke-linecap="round"/>
            </svg>
            <input [(ngModel)]="groupSearch" placeholder="Buscar grupo por nombre..."
              (focus)="dropdownOpen = true" (input)="onSearchInput()"
              class="ac-input" autocomplete="off" />
            @if (selectedGroupName) {
              <button class="ac-clear" (click)="clearGroupSelection()">
                <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                  <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
                </svg>
              </button>
            }

            @if (dropdownOpen && filteredGroups().length > 0 && !selectedGroupName) {
              <div class="ac-dropdown">
                @for (g of filteredGroups(); track g.id) {
                  <div class="ac-option" (mousedown)="selectGroup(g)">
                    <span class="ac-option-name">{{ g.subject || 'Sin nombre' }}</span>
                    <span class="ac-option-meta">{{ g.size || '?' }} miembros</span>
                  </div>
                }
              </div>
            }
          </div>

          @if (selectedGroupName) {
            <div class="selected-group">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="color: var(--success)">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.7 5.7l-4.4 5.6a.75.75 0 01-1.1.1L6.3 11.5a.75.75 0 011-1l1.4 1.4 3.9-5a.75.75 0 011.1.8z"/>
              </svg>
              <span>{{ selectedGroupName }}</span>
            </div>
          }
        }
      </div>

      <!-- STEP 2: Members + Config -->
      @if (selectedGroupJid && !activeCampaign()) {
        <div class="card">
          <div class="step-header">
            <span class="step-num">2</span>
            <h3>Miembros del grupo</h3>
          </div>

          @if (loadingParticipants()) {
            <div class="loading-row"><span class="spinner-sm"></span> Cargando miembros...</div>
          } @else if (participants().length > 0) {
            <div class="members-info">
              <strong>{{ participants().length }}</strong> miembros
              <span class="hint">(sin contar admins)</span>
            </div>

            <div class="members-list">
              @for (p of participants(); track p.id) {
                <div class="member-item">{{ p.id }}</div>
              }
            </div>

            <div class="delay-config">
              <label>Pausa entre mensajes:</label>
              <input [(ngModel)]="delaySegundos" type="number" min="10" max="600" class="delay-input" />
              <span class="hint">segundos (10-600)</span>
            </div>

            <button class="btn-action success" (click)="createAndStart()" [disabled]="creating()">
              @if (creating()) { <span class="spinner-sm white"></span> Preparando... }
              @else { Iniciar Envio }
            </button>
          } @else {
            <p class="empty-text">No se encontraron miembros en este grupo</p>
          }
        </div>
      }

      <!-- STEP 3: Active campaign -->
      @if (activeCampaign()) {
        <div class="card campaign-card" [class.progreso]="activeCampaign()!.estado === 'EN_PROGRESO'"
          [class.pausada]="activeCampaign()!.estado === 'PAUSADA'"
          [class.completada]="activeCampaign()!.estado === 'COMPLETADA'">

          <div class="campaign-header">
            @if (activeCampaign()!.estado === 'EN_PROGRESO') { <h3>Enviando mensajes...</h3> }
            @else if (activeCampaign()!.estado === 'PAUSADA') { <h3>Campana pausada</h3> }
            @else if (activeCampaign()!.estado === 'COMPLETADA') { <h3>Campana completada</h3> }
            @else if (activeCampaign()!.estado === 'CREADA') { <h3>Listo para iniciar</h3> }
            @else { <h3>{{ activeCampaign()!.estado }}</h3> }
            <span class="campaign-group">{{ activeCampaign()!.groupNombre || activeCampaign()!.nombre }}</span>
          </div>

          <!-- Progress bar -->
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="activeCampaign()!.progreso || 0">
              @if ((activeCampaign()!.progreso || 0) > 10) {
                <span>{{ activeCampaign()!.progreso | number:'1.0-0' }}%</span>
              }
            </div>
          </div>

          <div class="campaign-stats">
            <span><strong>{{ activeCampaign()!.totalEnviados }}</strong> enviados / <strong>{{ activeCampaign()!.totalContactos }}</strong> total</span>
            @if (activeCampaign()!.totalFallidos > 0) {
              <span class="failed">{{ activeCampaign()!.totalFallidos }} fallidos</span>
            }
            <span class="delay-info">Pausa: {{ activeCampaign()!.delaySegundos || 60 }}s</span>
          </div>

          @if (activeCampaign()!.estado === 'PAUSADA') {
            <div class="delay-edit-box">
              <label>Cambiar pausa:</label>
              <input [(ngModel)]="editDelay" type="number" min="10" max="600" class="delay-input" />
              <span class="hint">seg</span>
              <button class="btn-ghost sm" (click)="saveDelay()" [disabled]="savingDelay()">
                {{ savingDelay() ? 'Guardando...' : 'Guardar' }}
              </button>
              @if (delaySaved()) { <span class="saved-text">OK</span> }
            </div>
          }

          <div class="campaign-controls">
            @if (activeCampaign()!.estado === 'CREADA') {
              <button class="btn-action success" (click)="startCampaign()">Iniciar</button>
            }
            @if (activeCampaign()!.estado === 'EN_PROGRESO') {
              <button class="btn-action warn" (click)="pauseCampaign()">Pausar</button>
              <button class="btn-action danger" (click)="cancelCampaign()">Detener</button>
            }
            @if (activeCampaign()!.estado === 'PAUSADA') {
              <button class="btn-action success" (click)="resumeCampaign()">Reanudar</button>
              <button class="btn-action danger" (click)="cancelCampaign()">Detener</button>
            }
            @if (activeCampaign()!.estado === 'COMPLETADA' || activeCampaign()!.estado === 'CANCELADA') {
              <button class="btn-ghost" (click)="clearCampaign()">Nueva Campana</button>
            }
          </div>
        </div>
      }

      <!-- Campaign history -->
      @if (campaigns().length > 0) {
        <div class="card">
          <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 14px">Historial</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Estado</th>
                  <th>Progreso</th>
                  <th>Delay</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                @for (c of campaigns(); track c.id) {
                  <tr>
                    <td>{{ c.groupNombre || c.nombre }}</td>
                    <td>
                      <span class="tag" [class.s-ok]="c.estado === 'COMPLETADA'" [class.s-run]="c.estado === 'EN_PROGRESO'"
                        [class.s-fail]="c.estado === 'CANCELADA'" [class.s-pause]="c.estado === 'PAUSADA'">
                        {{ c.estado }}
                      </span>
                    </td>
                    <td class="mono">{{ c.totalEnviados }}/{{ c.totalContactos }}</td>
                    <td class="mono muted">{{ c.delaySegundos || 60 }}s</td>
                    <td class="muted">{{ c.fechaCreacion | date:'short' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-title { font-size: 22px; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.3px; }

    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 20px; margin-bottom: 14px;
    }

    .alert-error {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; border-radius: var(--radius);
      background: var(--danger-bg); color: var(--danger);
      border: 1px solid rgba(239,68,68,0.15);
      font-size: 13px; margin-bottom: 14px;
    }

    .step-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .step-num {
      width: 24px; height: 24px; border-radius: 6px;
      background: var(--primary-bg); color: var(--primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; flex-shrink: 0;
    }
    .step-header h3 { font-size: 14px; font-weight: 600; margin: 0; }

    .loading-row {
      display: flex; align-items: center; gap: 8px;
      color: var(--text-muted); font-size: 13px;
    }

    /* Autocomplete */
    .autocomplete-wrap { position: relative; }
    .ac-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; z-index: 2; }
    .ac-input {
      width: 100%; padding: 10px 36px 10px 36px;
      border-radius: var(--radius); border: 1px solid var(--border);
      background: var(--bg); color: var(--text); font-size: 13px; outline: none;
      transition: border-color var(--transition);
    }
    .ac-input:focus { border-color: var(--primary); }
    .ac-clear {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: var(--text-muted);
      cursor: pointer; padding: 4px; display: flex;
    }
    .ac-clear:hover { color: var(--text); }
    .ac-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0;
      background: var(--surface-2); border: 1px solid var(--border);
      border-radius: var(--radius); max-height: 240px; overflow-y: auto;
      z-index: 50; box-shadow: var(--shadow-lg);
    }
    .ac-option {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; cursor: pointer; transition: background var(--transition);
    }
    .ac-option:hover { background: var(--surface-hover); }
    .ac-option-name { font-size: 13px; font-weight: 500; }
    .ac-option-meta { font-size: 11px; color: var(--text-muted); }

    .selected-group {
      display: flex; align-items: center; gap: 8px;
      margin-top: 10px; padding: 8px 12px;
      background: var(--success-bg); border-radius: var(--radius-sm);
      font-size: 13px; font-weight: 500; color: var(--success);
    }

    /* Members */
    .members-info { font-size: 13px; margin-bottom: 10px; }
    .members-info strong { color: var(--text); }
    .hint { font-size: 11px; color: var(--text-muted); }

    .members-list {
      max-height: 160px; overflow-y: auto;
      border: 1px solid var(--border); border-radius: var(--radius-sm);
      padding: 6px 10px; margin-bottom: 16px;
    }
    .member-item { padding: 3px 0; font-size: 12px; color: var(--text-muted); }

    .delay-config {
      display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
    }
    .delay-config label { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
    .delay-input {
      padding: 6px 10px; width: 70px; border: 1px solid var(--border);
      border-radius: var(--radius-sm); background: var(--bg); color: var(--text);
      font-size: 13px; text-align: center; outline: none;
    }
    .delay-input:focus { border-color: var(--primary); }

    .btn-action {
      padding: 10px 22px; border: none; border-radius: var(--radius-sm);
      font-weight: 600; font-size: 13px; cursor: pointer;
      color: #fff; transition: opacity var(--transition);
      display: inline-flex; align-items: center; gap: 8px;
    }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-action.success { background: var(--success); }
    .btn-action.warn { background: var(--warning); }
    .btn-action.danger { background: var(--danger); }

    .btn-ghost {
      padding: 8px 16px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: transparent;
      color: var(--text-muted); font-size: 12px; font-weight: 500;
      transition: all var(--transition);
    }
    .btn-ghost:hover { background: var(--surface-hover); color: var(--text); }
    .btn-ghost.sm { padding: 5px 10px; font-size: 11px; }

    /* Campaign card */
    .campaign-card { border-left: 3px solid var(--border); }
    .campaign-card.progreso { border-left-color: var(--success); }
    .campaign-card.pausada { border-left-color: var(--warning); }
    .campaign-card.completada { border-left-color: var(--primary); }

    .campaign-header h3 { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
    .campaign-group { font-size: 12px; color: var(--text-muted); }

    .progress-track {
      background: var(--border); border-radius: 6px; height: 20px;
      margin: 14px 0 10px; overflow: hidden;
    }
    .progress-fill {
      background: linear-gradient(90deg, var(--success), #34d399);
      height: 100%; border-radius: 6px;
      transition: width 0.5s ease;
      display: flex; align-items: center; justify-content: center;
    }
    .progress-fill span { color: #fff; font-size: 11px; font-weight: 700; }

    .campaign-stats {
      display: flex; align-items: center; gap: 16px;
      font-size: 13px; margin-bottom: 6px;
    }
    .campaign-stats .failed { color: var(--danger); }
    .delay-info { color: var(--text-muted); font-size: 12px; }

    .delay-edit-box {
      display: flex; align-items: center; gap: 8px;
      margin-top: 12px; padding: 10px 14px;
      background: var(--bg); border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }
    .delay-edit-box label { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
    .saved-text { color: var(--success); font-size: 12px; font-weight: 600; }

    .campaign-controls { display: flex; gap: 8px; margin-top: 14px; }

    /* History table */
    .table-wrap { overflow: hidden; border-radius: var(--radius-sm); border: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left; padding: 8px 14px; font-size: 11px;
      color: var(--text-muted); border-bottom: 1px solid var(--border);
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;
    }
    td { padding: 8px 14px; font-size: 12px; border-bottom: 1px solid rgba(39,39,42,0.5); }
    .mono { font-variant-numeric: tabular-nums; }
    .muted { color: var(--text-muted); }

    .tag {
      padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.3px;
      background: var(--border); color: var(--text-muted);
    }
    .tag.s-ok { background: var(--success-bg); color: var(--success); }
    .tag.s-run { background: var(--primary-bg); color: var(--primary); }
    .tag.s-fail { background: var(--danger-bg); color: var(--danger); }
    .tag.s-pause { background: var(--warning-bg); color: var(--warning); }

    .empty-text { color: var(--text-muted); font-size: 13px; }

    .spinner-sm {
      width: 12px; height: 12px;
      border: 2px solid var(--border); border-top-color: var(--primary);
      border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block;
    }
    .spinner-sm.white { border-color: rgba(255,255,255,0.3); border-top-color: #fff; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class CampaignsComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  api = inject(ApiService);

  groups = signal<any[]>([]);
  participants = signal<any[]>([]);
  campaigns = signal<any[]>([]);
  activeCampaign = signal<any>(null);

  loadingGroups = signal(false);
  loadingParticipants = signal(false);
  creating = signal(false);
  savingDelay = signal(false);
  delaySaved = signal(false);
  groupsError = signal<string | null>(null);

  groupSearch = '';
  selectedGroupJid = '';
  selectedGroupName = '';
  dropdownOpen = false;
  delaySegundos = 60;
  editDelay = 60;

  private refreshInterval: any;

  filteredGroups = signal<any[]>([]);

  ngOnInit() {
    this.loadGroups();
    this.loadCampaigns();
    this.refreshInterval = setInterval(() => {
      const active = this.activeCampaign();
      if (active && (active.estado === 'EN_PROGRESO' || active.estado === 'CREADA')) {
        this.refreshActiveCampaign(active.id);
      }
    }, 8000);
  }

  ngOnDestroy() { if (this.refreshInterval) clearInterval(this.refreshInterval); }

  loadGroups() {
    this.loadingGroups.set(true);
    this.groupsError.set(null);
    this.api.getGroups().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (groups: any[]) => { this.groups.set(groups || []); this.filteredGroups.set(groups || []); this.loadingGroups.set(false); },
      error: (err) => {
        this.groupsError.set(err.error?.message || err.message || 'Error cargando grupos');
        this.loadingGroups.set(false);
      }
    });
  }

  loadCampaigns() {
    this.api.getCampaigns().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (campaigns: any[]) => {
        this.campaigns.set(campaigns || []);
        const active = (campaigns || []).find(c =>
          c.estado === 'EN_PROGRESO' || c.estado === 'PAUSADA' || c.estado === 'CREADA'
        );
        if (active) { this.activeCampaign.set(active); this.editDelay = active.delaySegundos || 60; }
      },
      error: () => {}
    });
  }

  onSearchInput() {
    this.dropdownOpen = true;
    const search = this.groupSearch.toLowerCase().trim();
    if (!search) {
      this.filteredGroups.set(this.groups());
    } else {
      this.filteredGroups.set(
        this.groups().filter(g => (g.subject || '').toLowerCase().includes(search))
      );
    }
  }

  selectGroup(g: any) {
    this.selectedGroupJid = g.id;
    this.selectedGroupName = g.subject || 'Sin nombre';
    this.groupSearch = g.subject || '';
    this.dropdownOpen = false;
    this.onGroupSelected();
  }

  clearGroupSelection() {
    this.selectedGroupJid = '';
    this.selectedGroupName = '';
    this.groupSearch = '';
    this.participants.set([]);
  }

  onGroupSelected() {
    this.participants.set([]);
    if (!this.selectedGroupJid) return;
    this.loadingParticipants.set(true);
    this.api.getGroupParticipants(this.selectedGroupJid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (participants: any[]) => {
        this.participants.set((participants || []).filter(p => !p.admin));
        this.loadingParticipants.set(false);
      },
      error: () => this.loadingParticipants.set(false)
    });
  }

  createAndStart() {
    if (!this.selectedGroupJid) return;
    const selectedGroup = this.groups().find(g => g.id === this.selectedGroupJid);
    this.creating.set(true);
    this.api.createCampaign({
      groupJid: this.selectedGroupJid,
      groupNombre: selectedGroup?.subject || '',
      nombre: selectedGroup?.subject || '',
      delaySegundos: this.delaySegundos,
    }).subscribe({
      next: (res: any) => {
        const campaign = res?.data || res;
        this.creating.set(false);
        this.editDelay = campaign.delaySegundos || this.delaySegundos;
        this.api.startCampaign(campaign.id).subscribe({
          next: (startRes: any) => { this.activeCampaign.set(startRes?.data || startRes); this.loadCampaigns(); },
          error: () => { this.activeCampaign.set(campaign); this.loadCampaigns(); }
        });
      },
      error: (err) => { this.creating.set(false); alert('Error: ' + (err.error?.message || err.message)); }
    });
  }

  startCampaign() {
    const c = this.activeCampaign(); if (!c) return;
    this.api.startCampaign(c.id).subscribe({
      next: (res: any) => { this.activeCampaign.set(res?.data || res); this.loadCampaigns(); },
      error: (err) => alert('Error: ' + (err.error?.message || err.message))
    });
  }

  pauseCampaign() {
    const c = this.activeCampaign(); if (!c) return;
    this.api.pauseCampaign(c.id).subscribe({
      next: (res: any) => {
        const campaign = res?.data || res;
        this.activeCampaign.set(campaign); this.editDelay = campaign.delaySegundos || 60; this.loadCampaigns();
      },
      error: (err) => alert('Error: ' + (err.error?.message || err.message))
    });
  }

  resumeCampaign() {
    const c = this.activeCampaign(); if (!c) return;
    this.api.resumeCampaign(c.id).subscribe({
      next: (res: any) => { this.activeCampaign.set(res?.data || res); this.loadCampaigns(); },
      error: (err) => alert('Error: ' + (err.error?.message || err.message))
    });
  }

  cancelCampaign() {
    const c = this.activeCampaign(); if (!c) return;
    this.api.cancelCampaign(c.id).subscribe({
      next: (res: any) => { this.activeCampaign.set(res?.data || res); this.loadCampaigns(); },
      error: (err) => alert('Error: ' + (err.error?.message || err.message))
    });
  }

  saveDelay() {
    const c = this.activeCampaign();
    if (!c || this.editDelay < 10 || this.editDelay > 600) return;
    this.savingDelay.set(true); this.delaySaved.set(false);
    this.api.changeCampaignDelay(c.id, this.editDelay).subscribe({
      next: (res: any) => {
        this.activeCampaign.set(res?.data || res);
        this.savingDelay.set(false); this.delaySaved.set(true);
        setTimeout(() => this.delaySaved.set(false), 3000);
      },
      error: (err) => { this.savingDelay.set(false); alert('Error: ' + (err.error?.message || err.message)); }
    });
  }

  clearCampaign() {
    this.activeCampaign.set(null);
    this.clearGroupSelection();
  }

  private refreshActiveCampaign(id: number) {
    this.api.getCampaign(id).subscribe({
      next: (res: any) => {
        const campaign = res?.data || res;
        this.activeCampaign.set(campaign);
        if (campaign.estado === 'COMPLETADA' || campaign.estado === 'CANCELADA' || campaign.estado === 'ERROR') {
          this.loadCampaigns();
        }
      },
      error: () => {}
    });
  }
}
