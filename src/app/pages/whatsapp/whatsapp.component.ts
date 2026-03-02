import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { interval, switchMap } from 'rxjs';

@Component({
  selector: 'app-whatsapp',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page" style="animation: fadeUp 0.3s ease">
      <h1 class="page-title">WhatsApp</h1>

      <!-- Connection status -->
      <div class="card">
        <div class="card-row">
          <div class="status-info">
            <span class="status-dot" [class.on]="connectionStatus() === 'open'" [class.off]="connectionStatus() !== 'open'"></span>
            @if (connectionStatus() === 'open') {
              <span class="status-text on">Conectado {{ userName() ? '(' + userName() + ')' : '' }}</span>
            } @else if (connectionStatus() === 'connecting') {
              <span class="status-text"><span class="spinner-sm"></span> Conectando...</span>
            } @else {
              <span class="status-text off">Desconectado</span>
            }
          </div>
          <div class="btn-group">
            <button class="btn-ghost" (click)="checkStatus()">Verificar</button>
            @if (connectionStatus() !== 'open') {
              <button class="btn-ghost" (click)="reconnect()">Reconectar</button>
              <button class="btn-ghost warn" (click)="reconnectClean()" title="Borra la sesion anterior y genera QR nuevo">Limpiar y reconectar</button>
            } @else {
              <button class="btn-ghost danger" (click)="logout()">Cerrar sesion</button>
            }
          </div>
        </div>
      </div>

      <!-- QR Code -->
      @if (connectionStatus() !== 'open') {
        <div class="card qr-section">
          <h3>Escanea el QR con WhatsApp</h3>
          <p class="hint">Abre WhatsApp > Dispositivos vinculados > Vincular dispositivo</p>
          @if (qrImage()) {
            <div class="qr-wrap">
              <img [src]="qrImage()" alt="QR Code" class="qr-img" />
            </div>
            <p class="hint small">El QR se actualiza automaticamente cada 30 segundos</p>
          } @else {
            <div class="qr-wrap qr-empty">
              <span class="spinner-lg"></span>
              <p>Generando QR code...</p>
              <p class="hint small">Si tarda, haz click en "Reconectar"</p>
            </div>
          }
        </div>
      }

      <!-- Test message -->
      @if (connectionStatus() === 'open') {
        <div class="card">
          <h3>Enviar mensaje de prueba</h3>
          <div class="test-row">
            <div class="field">
              <label>Telefono</label>
              <input [(ngModel)]="testPhone" placeholder="51999888777" />
            </div>
            <div class="field grow">
              <label>Mensaje</label>
              <input [(ngModel)]="testMessage" placeholder="Hola, esto es una prueba..."
                (keyup.enter)="sendTest()" />
            </div>
            <button class="btn-primary" (click)="sendTest()" [disabled]="!testPhone || !testMessage || sending()">
              {{ sending() ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>
          @if (testResult()) {
            <div class="test-feedback" [class.ok]="testResult()!.ok" [class.fail]="!testResult()!.ok">
              {{ testResult()!.message }}
            </div>
          }
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
    .card h3 { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
    .card-row { display: flex; align-items: center; justify-content: space-between; }
    .status-info { display: flex; align-items: center; gap: 10px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .status-dot.on { background: var(--success); box-shadow: 0 0 8px var(--success); }
    .status-dot.off { background: var(--danger); }
    .status-text { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .status-text.on { color: var(--success); }
    .status-text.off { color: var(--text-muted); }

    .btn-group { display: flex; gap: 6px; }
    .btn-ghost {
      padding: 7px 14px; font-size: 12px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: transparent;
      color: var(--text-muted); font-weight: 500;
      transition: all var(--transition);
    }
    .btn-ghost:hover { background: var(--surface-hover); color: var(--text); border-color: var(--border-light); }
    .btn-ghost.danger:hover { background: var(--danger-bg); color: var(--danger); border-color: rgba(239,68,68,0.3); }
    .btn-ghost.warn:hover { background: var(--warning-bg); color: var(--warning); border-color: rgba(245,158,11,0.3); }

    .qr-section { text-align: center; }
    .hint { font-size: 12px; color: var(--text-muted); margin-bottom: 16px; }
    .hint.small { font-size: 11px; margin-bottom: 0; margin-top: 12px; }
    .qr-wrap {
      display: flex; justify-content: center; align-items: center;
      min-height: 280px; margin: 16px 0;
    }
    .qr-img {
      width: 280px; height: 280px; border-radius: 14px;
      border: 1px solid var(--border);
    }
    .qr-empty {
      flex-direction: column; gap: 12px; color: var(--text-muted); font-size: 13px;
    }

    .test-row { display: flex; gap: 12px; align-items: flex-end; }
    .field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .field.grow { flex: 2; }
    .field label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .field input {
      padding: 9px 12px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--bg);
      color: var(--text); font-size: 13px; outline: none;
      transition: border-color var(--transition);
    }
    .field input:focus { border-color: var(--primary); }

    .btn-primary {
      padding: 10px 20px; border-radius: var(--radius-sm); border: none;
      background: var(--primary); color: #fff; font-weight: 600; font-size: 13px;
      white-space: nowrap; align-self: flex-end;
      transition: opacity var(--transition);
    }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

    .test-feedback {
      margin-top: 12px; padding: 10px 14px; border-radius: var(--radius-sm);
      font-size: 12px; font-weight: 500;
    }
    .test-feedback.ok { background: var(--success-bg); color: var(--success); }
    .test-feedback.fail { background: var(--danger-bg); color: var(--danger); }

    .spinner-sm {
      width: 12px; height: 12px;
      border: 2px solid var(--border); border-top-color: var(--primary);
      border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block;
    }
    .spinner-lg {
      width: 28px; height: 28px;
      border: 3px solid var(--border); border-top-color: var(--primary);
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class WhatsappComponent implements OnInit {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  connectionStatus = signal<string>('disconnected');
  userName = signal<string | null>(null);
  qrImage = signal<string | null>(null);

  testPhone = '';
  testMessage = '';
  sending = signal(false);
  testResult = signal<{ ok: boolean; message: string } | null>(null);

  ngOnInit() {
    this.checkStatus();
    this.startPolling();
  }

  startPolling() {
    interval(3000).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(() => this.api.getWhatsAppConnectionStatus())
    ).subscribe({
      next: (data) => {
        this.connectionStatus.set(data.status);
        this.userName.set(data.user?.name || null);
        if (data.status !== 'open') this.fetchQR(); else this.qrImage.set(null);
      },
      error: () => this.connectionStatus.set('disconnected')
    });
  }

  checkStatus() {
    this.api.getWhatsAppConnectionStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.connectionStatus.set(data.status);
        this.userName.set(data.user?.name || null);
        if (data.status !== 'open') this.fetchQR();
      },
      error: () => this.connectionStatus.set('disconnected')
    });
  }

  fetchQR() {
    this.api.getWhatsAppQR().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { if (data.qr) this.qrImage.set(data.qr); },
      error: () => {}
    });
  }

  reconnect(cleanAuth = false) {
    this.connectionStatus.set('connecting');
    this.qrImage.set(null);
    this.api.reconnectWhatsApp(cleanAuth).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => setTimeout(() => this.fetchQR(), 3000),
      error: (err) => console.error('Error reconnecting:', err)
    });
  }

  reconnectClean() { this.reconnect(true); }

  logout() {
    this.api.logoutWhatsApp().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.connectionStatus.set('disconnected'); this.userName.set(null); this.qrImage.set(null); },
      error: (err) => console.error('Error logging out:', err)
    });
  }

  sendTest() {
    this.testResult.set(null);
    this.sending.set(true);
    this.api.sendMessage(this.testPhone, this.testMessage).subscribe({
      next: () => { this.testResult.set({ ok: true, message: 'Mensaje enviado correctamente' }); this.sending.set(false); },
      error: (err: any) => { this.testResult.set({ ok: false, message: 'Error: ' + (err.error?.message || err.message) }); this.sending.set(false); }
    });
  }
}
