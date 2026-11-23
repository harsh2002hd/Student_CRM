export type UserRole = 'STUDENT' | 'EXPERT' | 'ADMIN';

export type ExpertApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type QueryUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type QueryStatus = 
  | 'OPEN' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'DELIVERED' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type OrderStatus = 
  | 'SUBMITTED' 
  | 'EXPERT_ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'DELIVERED' 
  | 'COMPLETED' 
  | 'DISPUTED';

export type PaymentStatus = 
  | 'PENDING' 
  | 'ESCROW_HELD' 
  | 'RELEASED' 
  | 'REFUNDED';

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface User {
  id: string;
  name: string;
  email: string; // Strictly hidden from counterparties
  phone: string; // Strictly hidden from counterparties
  password?: string;
  role: UserRole;
  avatar: string;
  country: string; // e.g. "US", "GB", "IN", "DE"
  currency: string; // e.g. "USD", "GBP", "INR", "EUR"
  createdAt: string;
  maskedId: string; // e.g. "STU-8821", "EXP-104", "ADM-001"
}

export interface ExpertProfile {
  id: string;
  userId: string;
  user?: User;
  title: string;
  bio: string;
  subjects: string[];
  qualifications: string;
  hourlyRate: number; // in USD baseline
  approvalStatus: ExpertApprovalStatus;
  verificationDoc: string;
  rejectionReason?: string;
  rating: number;
  reviewCount: number;
  totalEarnings: number;
  pendingBalance: number;
  completedTasks: number;
}

export interface StudentProfile {
  id: string;
  userId: string;
  user?: User;
  institution: string;
  major: string;
  year: string;
  totalSpent: number;
  activeOrdersCount: number;
}

export interface QueryAttachment {
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface StudentQuery {
  id: string;
  studentId: string;
  studentMaskedName?: string;
  subject: string;
  title: string;
  description: string;
  deadline: string;
  budget: number; // in USD baseline
  currency?: string;
  urgency: QueryUrgency;
  attachments?: QueryAttachment[];
  status: QueryStatus;
  assignedExpertId?: string;
  createdAt: string;
}

export interface DeliveryFile {
  name: string;
  size: string;
  url: string;
  submittedAt: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  queryId: string;
  queryTitle: string;
  subject: string;
  studentId: string;
  studentMaskedId: string;
  expertId: string;
  expertMaskedId: string;
  expertName: string;
  amount: number; // in USD baseline
  currency: string;
  platformFee: number;
  expertEarnings: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryFiles: DeliveryFile[];
  deliveryNote?: string;
  deadline: string;
  createdAt: string;
  completedAt?: string;
  invoiceId?: string;
}

export interface PaymentInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  studentId: string;
  studentNameMasked: string;
  amount: number;
  tax: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  transactionRef: string;
  status: 'PAID' | 'PENDING' | 'REFUNDED';
  issuedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  content: string; // Sanitized content
  originalContent?: string;
  isFlagged: boolean;
  flagReason?: string;
  attachment?: {
    name: string;
    size: string;
    type: string;
    url: string;
  };
  status: MessageStatus;
  timestamp: string;
}

export type AgentAvailability = 'ONLINE' | 'BUSY' | 'OFFLINE';

export interface QuickReply {
  id: string;
  title: string;
  text: string;
  shortcut?: string;
  category?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  description?: string;
}

export interface LeadTag {
  id: string;
  name: string;
  color: string;
  bgClass: string;
}

export interface Conversation {
  id: string;
  orderId?: string;
  orderStatus?: OrderStatus;
  orderNumber?: string;
  studentId: string;
  expertId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCountStudent: number;
  unreadCountExpert: number;
  unreadCountAdmin?: number;
  assigneeName?: string;
  assignedToId?: string;
  statusTag?: string; // e.g. "Closed: lead_reconnect", "Open: Query"
  status?: 'OPEN' | 'CLOSED' | 'PENDING';
  tags?: string[];
  hasMedia?: boolean;
  mediaType?: 'image' | 'video' | 'file';
  contactName?: string;
  contactUniversity?: string;
  contactCountry?: string;
}

export interface FlaggedMessageRecord {
  id: string;
  messageId: string;
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  attemptedLeakType: string[];
  flaggedText: string;
  redactedText: string;
  timestamp: string;
  status: 'PENDING_REVIEW' | 'WARNING_ISSUED' | 'DISMISSED';
}

export interface AdBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  category: string;
  isActive: boolean;
  viewsCount: number;
  clicksCount: number;
  createdAt: string;
}

export interface ExpertReview {
  id: string;
  orderId: string;
  orderNumber: string;
  studentId: string;
  studentMaskedName: string;
  expertId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MaskedCallState {
  isOpen: boolean;
  targetRole: UserRole;
  targetMaskedName: string;
  targetMaskedId: string;
  callType: 'AUDIO' | 'VIDEO';
  status: 'DIALING' | 'CONNECTED' | 'ENDED';
  durationSeconds: number;
}
