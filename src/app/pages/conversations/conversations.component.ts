import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="chat-layout">
      <div class="chat-list">
        <div class="chat-list-header">
          <h2>Chats</h2>
          <span class="count-badge">{{ conversations().length }}</span>
        </div>

        <div class="chat-list-body">
          @for (conv of conversations(); track conv.id) {
            <div class="chat-item" [class.active]="selected()?.id === conv.id" (click)="selectConversation(conv)">
              <div class="avatar">{{ (conv.nombreCliente || conv.telefonoCliente || '?')[0].toUpperCase() }}</div>
              <div class="chat-info">
                <div class="chat-name">{{ conv.nombreCliente || conv.telefonoCliente || 'Sin nombre' }}</div>
                <div class="chat-preview">{{ conv.totalMensajes || 0 }} mensajes</div>
              </div>
              <div class="chat-meta">
                <span class="chat-time">{{ formatTime(conv.fechaUltimoMensaje) }}</span>
                <span class="status-dot" [class]="conv.estado ? conv.estado.toLowerCase() : ''"></span>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1" width="32" height="32" style="color: var(--text-muted)">
                <path d="M4 4h12a1 1 0 011 1v7a1 1 0 01-1 1H8l-4 3V5a1 1 0 011-1z" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <p>No hay conversaciones</p>
            </div>
          }
        </div>
      </div>

      <div class="chat-panel">
        @if (selected()) {
          <div class="panel-header">
            <div class="panel-header-info">
              <div class="avatar sm">{{ (selected()!.nombreCliente || selected()!.telefonoCliente || '?')[0].toUpperCase() }}</div>
              <div>
                <strong>{{ selected()!.nombreCliente || selected()!.telefonoCliente }}</strong>
                <span class="tag" [class]="selected()?.estado ? selected()!.estado.toLowerCase() : ''">{{ selected()?.estado }}</span>
              </div>
            </div>
            <div class="panel-actions">
              <button class="btn-ghost" (click)="markRead()">Leido</button>
              <button class="btn-ghost danger" (click)="closeConv()">Cerrar</button>
            </div>
          </div>

          <div class="messages-area">
            @for (msg of messages(); track msg.id) {
              <div class="msg" [class.out]="msg.tipoRemitente === 'BOT' || msg.tipoRemitente === 'HUMANO'" [class.in]="msg.tipoRemitente === 'CLIENTE'">
                <div class="bubble">
                  {{ msg.contenido }}
                  <span class="msg-time">{{ formatTime(msg.fechaEnvio) }}</span>
                </div>
              </div>
            } @empty {
              <div class="empty-state"><p>No hay mensajes</p></div>
            }
          </div>

          <div class="input-area">
            <input [(ngModel)]="replyText" placeholder="Escribir mensaje..." class="msg-input"
              (keyup.enter)="sendReply()" />
            <button class="btn-send" (click)="sendReply()" [disabled]="!replyText">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path d="M2 10l7-7v4h8v6H9v4L2 10z"/>
              </svg>
            </button>
          </div>
        } @else {
          <div class="no-chat">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1" width="48" height="48" style="color: var(--border-light)">
              <path d="M4 4h12a1 1 0 011 1v7a1 1 0 01-1 1H8l-4 3V5a1 1 0 011-1z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>Selecciona una conversacion</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .chat-layout { display: flex; height: calc(100vh - 56px); margin: -28px -36px; }

    .chat-list {
      width: 320px; min-width: 320px;
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column; background: var(--surface);
    }
    .chat-list-header {
      padding: 18px 20px; display: flex; align-items: center;
      justify-content: space-between; border-bottom: 1px solid var(--border);
    }
    .chat-list-header h2 { font-size: 16px; font-weight: 700; }
    .count-badge {
      background: var(--primary-bg); color: var(--primary);
      padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;
    }
    .chat-list-body { flex: 1; overflow-y: auto; }

    .chat-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 20px; cursor: pointer; transition: background var(--transition);
      border-bottom: 1px solid rgba(39,39,42,0.5);
    }
    .chat-item:hover { background: var(--surface-hover); }
    .chat-item.active { background: var(--primary-bg); }

    .avatar {
      width: 36px; height: 36px; border-radius: 10px;
      background: var(--border); display: flex; align-items: center;
      justify-content: center; font-weight: 700; font-size: 14px;
      flex-shrink: 0; color: var(--text-secondary);
    }
    .avatar.sm { width: 30px; height: 30px; font-size: 12px; border-radius: 8px; }

    .chat-info { flex: 1; min-width: 0; }
    .chat-name { font-size: 13px; font-weight: 600; }
    .chat-preview { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
    .chat-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .chat-time { font-size: 10px; color: var(--text-muted); }

    .status-dot { width: 7px; height: 7px; border-radius: 50%; }
    .status-dot.activa { background: var(--success); }
    .status-dot.cerrada { background: var(--text-muted); }
    .status-dot.esperando_pago { background: var(--warning); }
    .status-dot.atendida_humano { background: var(--primary); }

    .chat-panel { flex: 1; display: flex; flex-direction: column; background: var(--bg); }

    .panel-header {
      padding: 14px 20px; border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      background: var(--surface);
    }
    .panel-header-info { display: flex; align-items: center; gap: 10px; }
    .panel-header-info strong { font-size: 14px; }
    .tag {
      font-size: 10px; padding: 2px 7px; border-radius: 4px; margin-left: 8px;
      background: var(--border); color: var(--text-muted); font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.3px;
    }
    .tag.activa { background: var(--success-bg); color: var(--success); }
    .tag.esperando_pago { background: var(--warning-bg); color: var(--warning); }

    .panel-actions { display: flex; gap: 6px; }
    .btn-ghost {
      padding: 6px 12px; font-size: 12px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: transparent;
      color: var(--text-muted); font-weight: 500;
      transition: all var(--transition);
    }
    .btn-ghost:hover { background: var(--surface-hover); color: var(--text); border-color: var(--border-light); }
    .btn-ghost.danger:hover { background: var(--danger-bg); color: var(--danger); border-color: rgba(239,68,68,0.3); }

    .messages-area { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 6px; }

    .msg { display: flex; }
    .msg.out { justify-content: flex-end; }
    .bubble {
      max-width: 60%; padding: 10px 14px; border-radius: 12px;
      font-size: 13px; line-height: 1.5;
    }
    .in .bubble { background: var(--surface); border: 1px solid var(--border); }
    .out .bubble { background: var(--primary-bg); color: var(--primary-hover); }
    .msg-time { display: block; font-size: 10px; color: var(--text-muted); margin-top: 4px; text-align: right; }

    .input-area {
      padding: 14px 20px; border-top: 1px solid var(--border);
      display: flex; gap: 10px; background: var(--surface);
    }
    .msg-input {
      flex: 1; padding: 10px 14px; border-radius: var(--radius);
      border: 1px solid var(--border); background: var(--bg);
      color: var(--text); font-size: 13px; outline: none;
      transition: border-color var(--transition);
    }
    .msg-input:focus { border-color: var(--primary); }
    .btn-send {
      width: 40px; height: 40px; border-radius: var(--radius);
      border: none; background: var(--primary); color: #fff;
      display: flex; align-items: center; justify-content: center;
      transition: opacity var(--transition);
    }
    .btn-send:disabled { opacity: 0.3; cursor: not-allowed; }

    .no-chat, .empty-state {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: var(--text-muted); gap: 12px; font-size: 13px;
    }
  `]
})
export class ConversationsComponent implements OnInit {
  private api = inject(ApiService);
  conversations = signal<any[]>([]);
  selected = signal<any>(null);
  messages = signal<any[]>([]);
  replyText = '';

  ngOnInit() { this.loadConversations(); }

  loadConversations() {
    this.api.getConversations().subscribe({
      next: (data: any) => {
        const allConvs = data.conversations || data.content || [];
        this.conversations.set(allConvs.filter((c: any) => c.totalMensajes > 0));
      },
      error: () => {}
    });
  }

  selectConversation(conv: any) {
    this.selected.set(conv);
    this.api.getMessagesByConversation(conv.id).subscribe({
      next: (data: any) => this.messages.set(data || []),
      error: () => this.messages.set([])
    });
  }

  sendReply() {
    if (!this.replyText || !this.selected()) return;
    const phone = this.selected()!.telefonoCliente || '';
    this.api.sendConversationMessage(this.selected()!.id, phone, this.replyText).subscribe({
      next: () => { this.replyText = ''; this.selectConversation(this.selected()!); }
    });
  }

  markRead() {
    if (!this.selected()) return;
    this.api.markAsRead(this.selected()!.id).subscribe(() => this.loadConversations());
  }

  closeConv() {
    if (!this.selected()) return;
    this.api.closeConversation(this.selected()!.id).subscribe(() => {
      this.selected.set(null); this.loadConversations();
    });
  }

  formatTime(date?: string) {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }
}
