// ============================================================
// ENUMS
// ============================================================
export enum Plan { BASICO = 'BASICO', PRO = 'PRO', ENTERPRISE = 'ENTERPRISE' }
export enum ConversationStatus { ACTIVA = 'ACTIVA', CERRADA = 'CERRADA', ESPERANDO_PAGO = 'ESPERANDO_PAGO', ATENDIDA_HUMANO = 'ATENDIDA_HUMANO' }
export enum OrderStatus { PENDIENTE_PAGO = 'PENDIENTE_PAGO', PAGADO = 'PAGADO', CONFIRMADO = 'CONFIRMADO', EN_PREPARACION = 'EN_PREPARACION', ENVIADO = 'ENVIADO', ENTREGADO = 'ENTREGADO', CANCELADO = 'CANCELADO' }
export enum PaymentMethod { YAPE = 'YAPE', PLIN = 'PLIN', EFECTIVO = 'EFECTIVO', TRANSFERENCIA = 'TRANSFERENCIA' }
export enum MessageDirection { INCOMING = 'INCOMING', OUTGOING = 'OUTGOING' }
export enum MessageType { TEXT = 'TEXT', IMAGE = 'IMAGE', AUDIO = 'AUDIO', DOCUMENT = 'DOCUMENT', LOCATION = 'LOCATION' }
export enum ConversationTone { FORMAL = 'FORMAL', AMIGABLE = 'AMIGABLE', PROFESIONAL = 'PROFESIONAL' }

// ============================================================
// API RESPONSE WRAPPER
// ============================================================
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PaginatedData<T> {
  content?: T[];        // Spring Page
  conversations?: T[];  // Custom wrapper
  products?: T[];
  customers?: T[];
  orders?: T[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

// ============================================================
// ENTITIES
// ============================================================
export interface Business {
  id: number;
  name: string;
  ruc?: string;
  email?: string;
  phone?: string;
  address?: string;
  plan: Plan;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BotConfiguration {
  id: number;
  empresaId: number;
  activo: boolean;
  nombreBot?: string;
  mensajeBienvenida?: string;
  promptSistema?: string;
  tonoConversacion?: ConversationTone;
  modeloAi?: string;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionInstancia?: string;
  verificacionPagosActivo: boolean;
  emailNotificacionesPago?: string;
  linkGrupoConsolidado?: string;
  linkCatalogo?: string;
  tiempoEntrega?: string;
  linkTiktok?: string;
  promptCampana?: string;
  horarioInicio?: string;
  horarioFin?: string;
  mensajeFueraHorario?: string;
  autoRespuesta?: boolean;
}

export interface WhatsAppInstance {
  id: number;
  businessId: number;
  instanceName: string;
  displayName?: string;
  apiToken?: string;
  status: string;
  connected: boolean;
  phoneNumber?: string;
  webhookUrl?: string;
  createdAt: string;
}

export interface Product {
  id: number;
  businessId: number;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  imageUrl?: string;
  active: boolean;
  featured: boolean;
  categoryId?: number;
  categoryName?: string;
}

export interface Category {
  id: number;
  businessId: number;
  name: string;
  description?: string;
  productCount?: number;
}

export interface Customer {
  id: number;
  businessId: number;
  name?: string;
  phoneNumber: string;
  email?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastInteraction?: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  businessId: number;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  status: ConversationStatus;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt?: string;
  needsHumanAttention: boolean;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  content: string;
  direction: MessageDirection;
  messageType: MessageType;
  whatsAppMessageId?: string;
  deliveryStatus?: string;
  createdAt: string;
}

export interface Order {
  id: number;
  businessId: number;
  customerId: number;
  conversationId?: number;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface DetectedPayment {
  id: number;
  businessId: number;
  orderId?: number;
  platform: string;
  amount: number;
  senderName?: string;
  referenceNumber?: string;
  verified: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalConversations: number;
  activeConversations: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
}

export interface SalesTechnique {
  id: number;
  name: string;
  description: string;
  example?: string;
  active: boolean;
}
