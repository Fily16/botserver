import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, timeout, retry, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  ApiResponse, Business, BotConfiguration, WhatsAppInstance,
  Product, Category, Customer, Conversation, Message,
  Order, DetectedPayment, DashboardStats, SalesTechnique
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = environment.apiUrl;

  private get bid() { return this.auth.getEmpresaId(); }

  // Ruta base para empresa (coincide con backend Spring Boot)
  private emp(empresaId = this.bid) { return `${this.base}/v1/empresas/${empresaId}`; }

  // Helper to extract data from ApiResponse wrapper
  private extract<T>(obs: Observable<ApiResponse<T>>): Observable<T> {
    return obs.pipe(map(r => r.data));
  }

  // ============================================================
  // HEALTH
  // ============================================================
  health() { return this.http.get<any>(`${this.base}/health`); }

  // ============================================================
  // EMPRESAS
  // ============================================================
  getBusinesses() { return this.extract(this.http.get<ApiResponse<Business[]>>(`${this.base}/v1/empresas`)); }
  getBusiness(id: number) { return this.extract(this.http.get<ApiResponse<Business>>(`${this.base}/v1/empresas/${id}`)); }
  createBusiness(data: Partial<Business>) { return this.extract(this.http.post<ApiResponse<Business>>(`${this.base}/v1/empresas`, data)); }
  updateBusiness(id: number, data: Partial<Business>) { return this.extract(this.http.put<ApiResponse<Business>>(`${this.base}/v1/empresas/${id}`, data)); }

  // ============================================================
  // DASHBOARD
  // ============================================================
  getDashboard(businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<DashboardStats>>(`${this.emp(businessId)}/dashboard`));
  }

  // ============================================================
  // CONFIGURACIÓN BOT
  // ============================================================
  getBotConfig(businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<BotConfiguration>>(`${this.emp(businessId)}/configuracion-bot`));
  }
  updateBotConfig(data: Partial<BotConfiguration>, businessId = this.bid) {
    return this.extract(this.http.put<ApiResponse<BotConfiguration>>(`${this.emp(businessId)}/configuracion-bot`, data));
  }
  activateBot(businessId = this.bid) {
    return this.extract(this.http.patch<ApiResponse<any>>(`${this.emp(businessId)}/configuracion-bot/activar`, {}));
  }
  deactivateBot(businessId = this.bid) {
    return this.extract(this.http.patch<ApiResponse<any>>(`${this.emp(businessId)}/configuracion-bot/desactivar`, {}));
  }

  // OpenAI API Key (stored in configuracion_saas, separate from bot config)
  saveOpenAiApiKey(apiKey: string) {
    return this.extract(this.http.put<ApiResponse<any>>(`${this.base}/v1/configuracion-saas/OPENAI_API_KEY`, {
      valor: apiKey, descripcion: 'OpenAI API Key'
    }));
  }
  getOpenAiApiKey() {
    return this.extract(this.http.get<ApiResponse<any>>(`${this.base}/v1/configuracion-saas/OPENAI_API_KEY`));
  }

  // ============================================================
  // WHATSAPP
  // ============================================================
  private get whatsappInstanceUrl() {
    return `${environment.whatsappServiceUrl}/${this.auth.getInstanceName()}`;
  }

  sendMessage(phone: string, message: string, businessId = this.bid) {
    const params = new HttpParams().set('telefono', phone).set('mensaje', message);
    return this.extract(this.http.post<ApiResponse<any>>(`${this.emp(businessId)}/whatsapp/enviar`, null, { params }));
  }
  getWhatsAppStatus(businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<boolean>>(`${this.emp(businessId)}/whatsapp/estado`));
  }

  // --- Baileys direct (QR, connection) ---
  getWhatsAppQR() {
    return this.http.get<{ status: string; qr: string | null; message?: string }>(`${this.whatsappInstanceUrl}/qr`);
  }
  getWhatsAppConnectionStatus() {
    return this.http.get<{ status: string; user: any }>(`${this.whatsappInstanceUrl}/status`);
  }
  reconnectWhatsApp(cleanAuth = false) {
    return this.http.post<any>(`${this.whatsappInstanceUrl}/reconnect`, { cleanAuth });
  }
  logoutWhatsApp() {
    return this.http.post<any>(`${this.whatsappInstanceUrl}/logout`, {});
  }

  // ============================================================
  // CONVERSACIONES
  // ============================================================
  getConversations(page = 0, size = 100, businessId = this.bid) {
    // Pedimos 100 registros y le decimos a Java que los ordene por el mensaje más reciente
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'fechaUltimoMensaje,desc'); // ¡Este es el truco clave!

    return this.extract(this.http.get<ApiResponse<any>>(`${this.emp(businessId)}/conversaciones`, { params }));
  }
  getActiveConversations(businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<Conversation[]>>(`${this.emp(businessId)}/conversaciones/activas`));
  }
  getConversation(id: number, businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<Conversation>>(`${this.emp(businessId)}/conversaciones/${id}`));
  }
// Reemplaza el método viejo por este:
  getMessagesByConversation(id: number) {
    // Apuntamos a la ruta real de tu MensajeController
    return this.extract(this.http.get<ApiResponse<Message[]>>(`${this.base}/v1/conversaciones/${id}/mensajes/todos`));
  }
  closeConversation(id: number, businessId = this.bid) {
    return this.extract(this.http.patch<ApiResponse<any>>(`${this.emp(businessId)}/conversaciones/${id}/cerrar`, {}));
  }
  getConversationStats(businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<any>>(`${this.emp(businessId)}/conversaciones/estadisticas`));
  }

  // 1. Obtener todos los mensajes de un chat (Apunta a MensajeController)
  getMessages(conversacionId: number) {
    return this.extract(this.http.get<ApiResponse<any[]>>(`${this.base}/v1/conversaciones/${conversacionId}/mensajes/todos`));
  }

  // 2. Marcar los mensajes como leídos (Apunta a MensajeController)
  markAsRead(conversacionId: number) {
    return this.extract(this.http.patch<ApiResponse<any>>(`${this.base}/v1/conversaciones/${conversacionId}/mensajes/marcar-leidos`, {}));
  }

  // 3. Enviar mensaje desde la vista del chat (Reutiliza tu endpoint de enviar)
  sendConversationMessage(conversacionId: number, phone: string, message: string, businessId = this.bid) {
    const params = new HttpParams().set('telefono', phone).set('mensaje', message);
    return this.extract(this.http.post<ApiResponse<any>>(`${this.emp(businessId)}/whatsapp/enviar`, null, { params }));
  }
  // ============================================================
  // PRODUCTOS
  // ============================================================
  getProducts(page = 0, size = 20, businessId = this.bid) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.extract(this.http.get<ApiResponse<any>>(`${this.emp(businessId)}/productos`, { params }));
  }
  getActiveProducts(businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<Product[]>>(`${this.emp(businessId)}/productos/activos`));
  }
  getFeaturedProducts(businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<Product[]>>(`${this.emp(businessId)}/productos/destacados`));
  }
  searchProducts(query: string, businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<Product[]>>(`${this.emp(businessId)}/productos/buscar`, { params: { q: query } }));
  }
  createProduct(data: Partial<Product>, businessId = this.bid) {
    return this.extract(this.http.post<ApiResponse<Product>>(`${this.emp(businessId)}/productos`, data));
  }
  updateProduct(id: number, data: Partial<Product>, businessId = this.bid) {
    return this.extract(this.http.put<ApiResponse<Product>>(`${this.emp(businessId)}/productos/${id}`, data));
  }
  deleteProduct(id: number, businessId = this.bid) {
    return this.extract(this.http.delete<ApiResponse<any>>(`${this.emp(businessId)}/productos/${id}`));
  }

  // ============================================================
  // CATEGORÍAS
  // ============================================================
  getCategories(businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<Category[]>>(`${this.emp(businessId)}/categorias`));
  }
  createCategory(data: Partial<Category>, businessId = this.bid) {
    return this.extract(this.http.post<ApiResponse<Category>>(`${this.emp(businessId)}/categorias`, data));
  }

  // ============================================================
  // CLIENTES
  // ============================================================
  getCustomers(page = 0, size = 20, businessId = this.bid) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.extract(this.http.get<ApiResponse<any>>(`${this.emp(businessId)}/clientes`, { params }));
  }
  getCustomer(id: number, businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<Customer>>(`${this.emp(businessId)}/clientes/${id}`));
  }
  getCustomerByPhone(phone: string, businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<Customer>>(`${this.emp(businessId)}/clientes/telefono/${phone}`));
  }

  // ============================================================
  // PEDIDOS
  // ============================================================
  getOrders(page = 0, size = 20, businessId = this.bid) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.extract(this.http.get<ApiResponse<any>>(`${this.emp(businessId)}/pedidos`, { params }));
  }
  getOrder(id: number, businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<Order>>(`${this.emp(businessId)}/pedidos/${id}`));
  }

  // ============================================================
  // PAGOS
  // ============================================================
  getPayments(page = 0, size = 20, businessId = this.bid) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.extract(this.http.get<ApiResponse<any>>(`${this.emp(businessId)}/pagos`, { params }));
  }

  // ============================================================
  // TÉCNICAS DE VENTA
  // ============================================================
  getSalesTechniques() {
    return this.extract(this.http.get<ApiResponse<SalesTechnique[]>>(`${this.base}/v1/tecnicas-venta`));
  }
// === GRUPOS Y CAMPAÑAS ===

  getGroups(businessId = this.bid) {
    const url = `${this.emp(businessId)}/campanas/grupos`;
    console.log('[API] getGroups → GET', url);
    return this.http.get<any>(url).pipe(
      timeout(120_000), // 2 minutos max
      retry({ count: 1, delay: 2000 }), // 1 reintento tras 2s
      tap(res => console.log('[API] getGroups raw response (first 500 chars):', JSON.stringify(res).substring(0, 500))),
      map(res => {
        // Normalizar: el backend puede devolver array directo o envuelto en ApiResponse
        if (Array.isArray(res)) return res;
        if (res?.data && Array.isArray(res.data)) return res.data;
        console.warn('[API] getGroups formato inesperado:', typeof res, res);
        return [];
      })
    );
  }

  createCampaign(data: any, businessId = this.bid) {
    const url = `${this.emp(businessId)}/campanas`;
    console.log('[API] createCampaign → POST', url, data);
    return this.http.post<any>(url, data);
  }

  getCampaigns(businessId = this.bid) {
    const url = `${this.emp(businessId)}/campanas`;
    console.log('[API] getCampaigns → GET', url);
    return this.http.get<any>(url).pipe(
      map(res => {
        console.log('[API] getCampaigns raw response:', JSON.stringify(res).substring(0, 500));
        if (Array.isArray(res)) return res;
        if (res?.data && Array.isArray(res.data)) return res.data;
        return [];
      })
    );
  }

  getGroupParticipants(groupJid: string, businessId = this.bid) {
    return this.http.get<any[]>(`${this.emp(businessId)}/campanas/grupos/participantes`, {
      params: { groupJid }
    });
  }

  getCampaign(campaignId: number, businessId = this.bid) {
    return this.http.get<any>(`${this.emp(businessId)}/campanas/${campaignId}`);
  }

  startCampaign(campaignId: number, businessId = this.bid) {
    return this.http.post<any>(`${this.emp(businessId)}/campanas/${campaignId}/iniciar`, {});
  }

  pauseCampaign(campaignId: number, businessId = this.bid) {
    return this.http.post<any>(`${this.emp(businessId)}/campanas/${campaignId}/pausar`, {});
  }

  resumeCampaign(campaignId: number, businessId = this.bid) {
    return this.http.post<any>(`${this.emp(businessId)}/campanas/${campaignId}/reanudar`, {});
  }

  cancelCampaign(campaignId: number, businessId = this.bid) {
    return this.http.post<any>(`${this.emp(businessId)}/campanas/${campaignId}/cancelar`, {});
  }

  changeCampaignDelay(campaignId: number, delaySegundos: number, businessId = this.bid) {
    return this.http.patch<any>(`${this.emp(businessId)}/campanas/${campaignId}/delay`, { delaySegundos });
  }

  // ============================================================
  // ARCHIVOS
  // ============================================================
  uploadFile(file: File, businessId = this.bid) {
    const formData = new FormData();
    formData.append('file', file);
    return this.extract(this.http.post<ApiResponse<any>>(`${this.emp(businessId)}/archivos/upload`, formData));
  }

  getFiles(businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<any[]>>(`${this.emp(businessId)}/archivos`));
  }

  deleteFile(fileName: string, businessId = this.bid) {
    return this.extract(this.http.delete<ApiResponse<any>>(`${this.emp(businessId)}/archivos/${fileName}`));
  }

  // ============================================================
  // CATÁLOGO INTELIGENTE
  // ============================================================
  uploadCatalogo(file: File, businessId = this.bid) {
    const formData = new FormData();
    formData.append('file', file);
    return this.extract(this.http.post<ApiResponse<any>>(`${this.emp(businessId)}/archivos/catalogo/upload`, formData));
  }

  procesarCatalogoLink(url: string, businessId = this.bid) {
    return this.extract(this.http.post<ApiResponse<any>>(`${this.emp(businessId)}/archivos/catalogo/link`, { url }));
  }

  getCatalogos(businessId = this.bid) {
    return this.extract(this.http.get<ApiResponse<any[]>>(`${this.emp(businessId)}/archivos/catalogo`));
  }

  deleteCatalogo(catalogoId: number, businessId = this.bid) {
    return this.extract(this.http.delete<ApiResponse<any>>(`${this.emp(businessId)}/archivos/catalogo/${catalogoId}`));
  }
}
