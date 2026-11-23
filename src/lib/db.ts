import fs from 'fs';
import path from 'path';
import {
  User,
  ExpertProfile,
  StudentProfile,
  StudentQuery,
  Order,
  PaymentInvoice,
  ChatMessage,
  Conversation,
  FlaggedMessageRecord,
  AdBanner,
  ExpertReview,
  ExpertApprovalStatus,
  OrderStatus,
  PaymentStatus,
  UserRole,
} from '@/types';
import {
  INITIAL_USERS,
  INITIAL_EXPERT_PROFILES,
  INITIAL_STUDENT_PROFILES,
  INITIAL_QUERIES,
  INITIAL_ORDERS,
  INITIAL_INVOICES,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_FLAGGED_MESSAGES,
  INITIAL_AD_BANNERS,
  INITIAL_REVIEWS,
} from '@/data/seedData';
import { scanAndSanitizeMessage } from './security';

interface DatabaseSchema {
  users: User[];
  expertProfiles: ExpertProfile[];
  studentProfiles: StudentProfile[];
  queries: StudentQuery[];
  orders: Order[];
  invoices: PaymentInvoice[];
  conversations: Conversation[];
  messages: ChatMessage[];
  flaggedMessages: FlaggedMessageRecord[];
  adBanners: AdBanner[];
  reviews: ExpertReview[];
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let inMemoryStore: DatabaseSchema | null = null;

function loadDatabase(): DatabaseSchema {
  if (inMemoryStore) {
    return inMemoryStore;
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryStore = JSON.parse(data);
      return inMemoryStore!;
    }
  } catch (err) {
    console.warn('Could not read db.json, initializing fresh store', err);
  }

  inMemoryStore = {
    users: JSON.parse(JSON.stringify(INITIAL_USERS)),
    expertProfiles: JSON.parse(JSON.stringify(INITIAL_EXPERT_PROFILES)),
    studentProfiles: JSON.parse(JSON.stringify(INITIAL_STUDENT_PROFILES)),
    queries: JSON.parse(JSON.stringify(INITIAL_QUERIES)),
    orders: JSON.parse(JSON.stringify(INITIAL_ORDERS)),
    invoices: JSON.parse(JSON.stringify(INITIAL_INVOICES)),
    conversations: JSON.parse(JSON.stringify(INITIAL_CONVERSATIONS)),
    messages: JSON.parse(JSON.stringify(INITIAL_MESSAGES)),
    flaggedMessages: JSON.parse(JSON.stringify(INITIAL_FLAGGED_MESSAGES)),
    adBanners: JSON.parse(JSON.stringify(INITIAL_AD_BANNERS)),
    reviews: JSON.parse(JSON.stringify(INITIAL_REVIEWS)),
  };

  saveDatabase(inMemoryStore);
  return inMemoryStore;
}

function saveDatabase(data: DatabaseSchema): void {
  inMemoryStore = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

export const db = {
  resetToSeed: () => {
    const seed: DatabaseSchema = {
      users: JSON.parse(JSON.stringify(INITIAL_USERS)),
      expertProfiles: JSON.parse(JSON.stringify(INITIAL_EXPERT_PROFILES)),
      studentProfiles: JSON.parse(JSON.stringify(INITIAL_STUDENT_PROFILES)),
      queries: JSON.parse(JSON.stringify(INITIAL_QUERIES)),
      orders: JSON.parse(JSON.stringify(INITIAL_ORDERS)),
      invoices: JSON.parse(JSON.stringify(INITIAL_INVOICES)),
      conversations: JSON.parse(JSON.stringify(INITIAL_CONVERSATIONS)),
      messages: JSON.parse(JSON.stringify(INITIAL_MESSAGES)),
      flaggedMessages: JSON.parse(JSON.stringify(INITIAL_FLAGGED_MESSAGES)),
      adBanners: JSON.parse(JSON.stringify(INITIAL_AD_BANNERS)),
      reviews: JSON.parse(JSON.stringify(INITIAL_REVIEWS)),
    };
    saveDatabase(seed);
    return seed;
  },

  // USERS & AUTH
  getUsers: () => loadDatabase().users,
  getUserById: (id: string) => loadDatabase().users.find((u) => u.id === id),
  getUserByEmail: (email: string) =>
    loadDatabase().users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()),

  registerUser: (payload: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role: UserRole;
    country: string;
    currency: string;
    institution?: string;
    major?: string;
    title?: string;
    bio?: string;
    subjects?: string[];
    qualifications?: string;
    hourlyRate?: number;
    verificationDoc?: string;
    initialMessage?: string;
  }) => {
    const data = loadDatabase();
    const cleanHandle = payload.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const userEmail = payload.email && payload.email.trim()
      ? payload.email.trim()
      : `${cleanHandle || 'lead'}_${Date.now()}@m1company.internal`;

    const existing = data.users.find((u) => u.email.toLowerCase() === userEmail.toLowerCase().trim());
    if (existing && payload.email && !payload.email.includes('@m1company.internal')) {
      throw new Error('An account with this email address already exists.');
    }

    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const prefix = payload.role === 'EXPERT' ? 'EXP' : 'STU';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const maskedId = `${prefix}-${randNum}`;

    const defaultAvatar = payload.role === 'EXPERT'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80';

    const newUser: User = {
      id,
      name: payload.name.trim(),
      email: userEmail,
      phone: payload.phone || '+1 555 0100',
      password: payload.password || 'direct_access',
      role: payload.role,
      avatar: defaultAvatar,
      country: payload.country || 'US',
      currency: payload.currency || 'USD',
      createdAt: new Date().toISOString(),
      maskedId,
    };

    data.users.push(newUser);

    let createdConversation: Conversation | undefined;
    let initialChatMessage: ChatMessage | undefined;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (payload.role === 'EXPERT') {
      const expertProfile: ExpertProfile = {
        id: `prof_${id}`,
        userId: id,
        title: payload.title || 'Academic & Research Specialist',
        bio: payload.bio || 'Verified academic mentor helping students master complex university coursework.',
        subjects: payload.subjects && payload.subjects.length > 0 ? payload.subjects : ['General Studies', 'STEM'],
        qualifications: payload.qualifications || 'University Graduate / Specialist',
        hourlyRate: Number(payload.hourlyRate) || 30,
        approvalStatus: 'PENDING', // STRICT GATE: requires Admin verification
        verificationDoc: payload.verificationDoc || 'Degree_Transcript.pdf',
        rating: 5.0,
        reviewCount: 0,
        totalEarnings: 0,
        pendingBalance: 0,
        completedTasks: 0,
      };
      data.expertProfiles.push(expertProfile);

      const expertText = payload.initialMessage?.trim() || `Hello Admin! I am ${payload.name.trim()}, I just applied as an Expert Specialist on M1 Company and submitted my profile for verification.`;
      
      createdConversation = {
        id: `conv_${id}_admin`,
        studentId: id,
        expertId: 'usr_admin',
        contactName: payload.name.trim(),
        contactUniversity: payload.institution || 'Verified Specialist',
        contactCountry: payload.country || 'US',
        assigneeName: 'Platform Operations Admin',
        assignedToId: 'usr_admin',
        statusTag: 'Open: Expert Application',
        status: 'OPEN',
        tags: ['Expert Applicant', 'Pending Verification'],
        lastMessage: expertText,
        lastMessageTime: 'Just now',
        unreadCountStudent: 0,
        unreadCountExpert: 1,
        unreadCountAdmin: 1,
        hasMedia: false,
      };
      data.conversations.unshift(createdConversation);

      initialChatMessage = {
        id: `msg_init_${Date.now()}`,
        conversationId: createdConversation.id,
        senderId: id,
        senderRole: 'EXPERT',
        senderName: `${payload.name.trim()} (${maskedId})`,
        content: expertText,
        isFlagged: false,
        status: 'DELIVERED',
        timestamp: nowTime,
      };
      data.messages.push(initialChatMessage);

    } else if (payload.role === 'STUDENT') {
      const studentProfile: StudentProfile = {
        id: `prof_${id}`,
        userId: id,
        institution: payload.institution || 'International University',
        major: payload.major || 'Undergraduate Studies',
        year: 'Current Year',
        totalSpent: 0,
        activeOrdersCount: 0,
      };
      data.studentProfiles.push(studentProfile);

      const studentText = payload.initialMessage?.trim() || `Hello M1 Support! I am ${payload.name.trim()}, I just registered as a student and need coursework guidance.`;

      // Auto initialize conversation between student and M1 Company support
      createdConversation = {
        id: `conv_${id}_direct`,
        studentId: id,
        expertId: 'usr_exp_1',
        contactName: payload.name.trim(),
        contactUniversity: payload.institution || 'University Student',
        contactCountry: payload.country || 'US',
        assigneeName: 'Dr. Marcus Vance',
        assignedToId: 'usr_exp_1',
        statusTag: 'Open: Active Inquiry',
        status: 'OPEN',
        tags: ['New Lead', 'Direct Register'],
        lastMessage: studentText,
        lastMessageTime: 'Just now',
        unreadCountStudent: 0,
        unreadCountExpert: 1, // Admin & Expert has 1 unread message from this student!
        hasMedia: false,
      };
      data.conversations.unshift(createdConversation);

      // Student sends their first message to the Admin / Support Expert
      initialChatMessage = {
        id: `msg_student_${Date.now()}`,
        conversationId: createdConversation.id,
        senderId: id,
        senderRole: 'STUDENT',
        senderName: `${payload.name.trim()} (${maskedId})`,
        content: studentText,
        isFlagged: false,
        status: 'DELIVERED',
        timestamp: nowTime,
      };
      data.messages.push(initialChatMessage);
    }

    saveDatabase(data);
    return {
      user: newUser,
      conversation: createdConversation,
      message: initialChatMessage,
    };
  },

  updateUserProfile: (userId: string, updates: Partial<User> & { bio?: string; hourlyRate?: number; subjects?: string[] }) => {
    const data = loadDatabase();
    const user = data.users.find((u) => u.id === userId);
    if (!user) return null;

    if (updates.name) user.name = updates.name.trim();
    if (updates.country) user.country = updates.country;
    if (updates.currency) user.currency = updates.currency;
    if (updates.avatar) user.avatar = updates.avatar;

    if (user.role === 'EXPERT') {
      const profile = data.expertProfiles.find((p) => p.userId === userId);
      if (profile) {
        if (updates.bio) profile.bio = updates.bio;
        if (updates.hourlyRate) profile.hourlyRate = Number(updates.hourlyRate);
        if (updates.subjects) profile.subjects = updates.subjects;
      }
    }

    saveDatabase(data);
    return user;
  },

  // EXPERTS
  getExpertProfiles: () => {
    const data = loadDatabase();
    return data.expertProfiles.map((p) => {
      const user = data.users.find((u) => u.id === p.userId);
      return { ...p, user };
    });
  },
  getExpertProfileByUserId: (userId: string) => {
    const data = loadDatabase();
    const profile = data.expertProfiles.find((p) => p.userId === userId);
    if (!profile) return undefined;
    const user = data.users.find((u) => u.id === userId);
    return { ...profile, user };
  },
  getApprovedExperts: () => {
    const data = loadDatabase();
    return data.expertProfiles
      .filter((p) => p.approvalStatus === 'APPROVED')
      .map((p) => {
        const user = data.users.find((u) => u.id === p.userId);
        return { ...p, user };
      });
  },
  getPendingExperts: () => {
    const data = loadDatabase();
    return data.expertProfiles
      .filter((p) => p.approvalStatus === 'PENDING')
      .map((p) => {
        const user = data.users.find((u) => u.id === p.userId);
        return { ...p, user };
      });
  },
  updateExpertApprovalStatus: (userId: string, status: ExpertApprovalStatus, reason?: string) => {
    const data = loadDatabase();
    const profile = data.expertProfiles.find((p) => p.userId === userId);
    if (!profile) return null;
    profile.approvalStatus = status;
    if (reason) profile.rejectionReason = reason;
    saveDatabase(data);
    return profile;
  },

  // STUDENTS
  getStudentProfiles: () => loadDatabase().studentProfiles,
  getStudentProfileByUserId: (userId: string) => {
    const data = loadDatabase();
    const profile = data.studentProfiles.find((p) => p.userId === userId);
    if (!profile) return undefined;
    const user = data.users.find((u) => u.id === userId);
    return { ...profile, user };
  },

  // QUERIES
  getQueries: () => loadDatabase().queries,
  getQueryById: (id: string) => loadDatabase().queries.find((q) => q.id === id),
  getQueriesByStudentId: (studentId: string) =>
    loadDatabase().queries.filter((q) => q.studentId === studentId),
  getOpenQueriesForApprovedExperts: () =>
    loadDatabase().queries.filter((q) => q.status === 'OPEN'),
  createQuery: (newQuery: Omit<StudentQuery, 'id' | 'createdAt' | 'status'>) => {
    const data = loadDatabase();
    const id = `qry_${Date.now()}`;
    const student = data.users.find((u) => u.id === newQuery.studentId);
    const query: StudentQuery = {
      ...newQuery,
      id,
      studentMaskedName: student ? `${student.name.split(' ')[0]} (${student.maskedId})` : 'Student',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    data.queries.unshift(query);
    saveDatabase(data);
    return query;
  },
  assignExpertToQuery: (queryId: string, expertId: string) => {
    const data = loadDatabase();
    const query = data.queries.find((q) => q.id === queryId);
    if (!query) return null;

    query.assignedExpertId = expertId;
    query.status = 'ASSIGNED';

    const expert = data.users.find((u) => u.id === expertId);
    const student = data.users.find((u) => u.id === query.studentId);
    const orderNumber = `ORD-GLOBAL-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ord_${Date.now()}`;
    const amount = query.budget || 80;
    const platformFee = Math.round(amount * 0.15 * 100) / 100;
    const expertEarnings = Math.round((amount - platformFee) * 100) / 100;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      queryId: query.id,
      queryTitle: query.title,
      subject: query.subject,
      studentId: query.studentId,
      studentMaskedId: student?.maskedId || 'STU-0000',
      expertId: expertId,
      expertMaskedId: expert?.maskedId || 'EXP-0000',
      expertName: expert?.name || 'Verified Mentor',
      amount,
      currency: student?.currency || 'USD',
      platformFee,
      expertEarnings,
      status: 'EXPERT_ASSIGNED',
      paymentStatus: 'PENDING',
      deliveryFiles: [],
      deadline: query.deadline,
      createdAt: new Date().toISOString(),
    };
    data.orders.unshift(newOrder);

    let conversation = data.conversations.find(
      (c) => c.studentId === query.studentId && c.expertId === expertId
    );
    if (!conversation) {
      conversation = {
        id: `conv_${Date.now()}`,
        orderId: newOrder.id,
        orderStatus: newOrder.status,
        orderNumber: newOrder.orderNumber,
        studentId: query.studentId,
        expertId: expertId,
        lastMessage: `Expert accepted assignment: "${query.title}"`,
        lastMessageTime: 'Just now',
        unreadCountStudent: 1,
        unreadCountExpert: 0,
      };
      data.conversations.unshift(conversation);
    } else {
      conversation.orderId = newOrder.id;
      conversation.orderStatus = newOrder.status;
      conversation.orderNumber = newOrder.orderNumber;
    }

    saveDatabase(data);
    return { query, order: newOrder, conversation };
  },

  // ORDERS
  getOrders: () => loadDatabase().orders,
  getOrderById: (id: string) => loadDatabase().orders.find((o) => o.id === id),
  getOrdersByStudentId: (studentId: string) =>
    loadDatabase().orders.filter((o) => o.studentId === studentId),
  getOrdersByExpertId: (expertId: string) =>
    loadDatabase().orders.filter((o) => o.expertId === expertId),
  updateOrderStatus: (orderId: string, status: OrderStatus) => {
    const data = loadDatabase();
    const order = data.orders.find((o) => o.id === orderId);
    if (!order) return null;
    order.status = status;
    if (status === 'COMPLETED') {
      order.completedAt = new Date().toISOString();
      order.paymentStatus = 'RELEASED';

      const expertProfile = data.expertProfiles.find((p) => p.userId === order.expertId);
      if (expertProfile) {
        expertProfile.totalEarnings += order.expertEarnings;
        expertProfile.completedTasks += 1;
        expertProfile.pendingBalance = Math.max(0, expertProfile.pendingBalance - order.expertEarnings);
      }
    }

    const query = data.queries.find((q) => q.id === order.queryId);
    if (query) {
      if (status === 'IN_PROGRESS') query.status = 'IN_PROGRESS';
      if (status === 'DELIVERED') query.status = 'DELIVERED';
      if (status === 'COMPLETED') query.status = 'COMPLETED';
    }

    const conversation = data.conversations.find((c) => c.orderId === orderId);
    if (conversation) {
      conversation.orderStatus = status;
    }

    saveDatabase(data);
    return order;
  },
  deliverOrderSolution: (
    orderId: string,
    file: { name: string; size: string; url: string; note?: string },
    deliveryNote?: string
  ) => {
    const data = loadDatabase();
    const order = data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.deliveryFiles.push({
      ...file,
      submittedAt: new Date().toISOString(),
    });
    order.status = 'DELIVERED';
    if (deliveryNote) order.deliveryNote = deliveryNote;

    const query = data.queries.find((q) => q.id === order.queryId);
    if (query) query.status = 'DELIVERED';

    const conversation = data.conversations.find((c) => c.orderId === orderId);
    if (conversation) {
      conversation.orderStatus = 'DELIVERED';
      conversation.lastMessage = `Solution delivered: "${file.name}"`;
      conversation.lastMessageTime = 'Just now';
      conversation.unreadCountStudent += 1;

      const expert = data.users.find((u) => u.id === order.expertId);
      data.messages.push({
        id: `msg_${Date.now()}`,
        conversationId: conversation.id,
        senderId: order.expertId,
        senderRole: 'EXPERT',
        senderName: expert?.name || 'Verified Expert',
        content: `🎉 Final Solution Delivered!\n${deliveryNote || 'Please review the solution file and confirm completion.'}`,
        isFlagged: false,
        attachment: {
          name: file.name,
          size: file.size,
          type: 'application/pdf',
          url: file.url,
        },
        status: 'DELIVERED',
        timestamp: 'Just now',
      });
    }

    saveDatabase(data);
    return order;
  },

  // PAYMENTS & INVOICES
  getInvoices: () => loadDatabase().invoices,
  getInvoiceById: (id: string) => loadDatabase().invoices.find((i) => i.id === id),
  processPayment: (orderId: string, paymentMethod: string) => {
    const data = loadDatabase();
    const order = data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.paymentStatus = 'ESCROW_HELD';
    order.status = 'IN_PROGRESS';

    const student = data.users.find((u) => u.id === order.studentId);
    const invoiceNumber = `INV-2026-GLOBAL-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceId = `inv_${Date.now()}`;
    const tax = Math.round(order.amount * 0.10 * 100) / 100;
    const totalAmount = Math.round((order.amount + tax) * 100) / 100;

    const invoice: PaymentInvoice = {
      id: invoiceId,
      invoiceNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      studentId: order.studentId,
      studentNameMasked: student ? `${student.name.split(' ')[0]} (${student.maskedId})` : 'Student',
      amount: order.amount,
      tax,
      totalAmount,
      currency: order.currency || 'USD',
      paymentMethod,
      transactionRef: `TXN_SECURE_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      status: 'PAID',
      issuedAt: new Date().toISOString(),
    };

    order.invoiceId = invoice.id;
    data.invoices.unshift(invoice);

    const query = data.queries.find((q) => q.id === order.queryId);
    if (query) query.status = 'IN_PROGRESS';

    const expertProfile = data.expertProfiles.find((p) => p.userId === order.expertId);
    if (expertProfile) {
      expertProfile.pendingBalance += order.expertEarnings;
    }

    saveDatabase(data);
    return { order, invoice };
  },

  // CHAT & ANTI-BYPASS SECURITY
  getConversations: (userId: string, role: UserRole) => {
    const data = loadDatabase();
    
    // Enrich conversation with contact names and metadata if missing
    const enriched = data.conversations.map((c) => {
      const student = data.users.find((u) => u.id === c.studentId);
      const studentProfile = data.studentProfiles.find((p) => p.userId === c.studentId);
      return {
        ...c,
        contactName: c.contactName || (student ? student.name : 'Student Lead'),
        contactUniversity: c.contactUniversity || (studentProfile ? studentProfile.institution : 'University Student'),
        contactCountry: c.contactCountry || (student ? student.country : 'US'),
      };
    });

    if (role === 'ADMIN' || role === 'EXPERT') {
      // Agent / Admin sees ALL conversations ("i see all chat")
      return enriched;
    }
    
    // Student sees ONLY their conversation with M1 Company ("student will see only chat with me")
    const studentConvs = enriched.filter((c) => c.studentId === userId);
    if (studentConvs.length === 0) {
      // Auto-initialize conversation with support
      const student = data.users.find((u) => u.id === userId);
      const newConv: Conversation = {
        id: `conv_${userId}_direct`,
        studentId: userId,
        expertId: 'usr_exp_1',
        contactName: student ? student.name : 'Student Lead',
        contactUniversity: 'University Student',
        contactCountry: student?.country || 'US',
        assigneeName: 'Dr. Marcus Vance',
        assignedToId: 'usr_exp_1',
        statusTag: 'Open: Active Inquiry',
        status: 'OPEN',
        tags: ['New Lead', 'Support'],
        lastMessage: 'Welcome to M1 Company! How can our academic specialists help you today?',
        lastMessageTime: 'Just now',
        unreadCountStudent: 0,
        unreadCountExpert: 1,
      };
      data.conversations.unshift(newConv);
      saveDatabase(data);
      return [newConv];
    }
    return studentConvs;
  },
  markConversationAsRead: (conversationId: string, role: UserRole) => {
    const data = loadDatabase();
    const conv = data.conversations.find((c) => c.id === conversationId);
    if (conv) {
      if (role === 'STUDENT') {
        conv.unreadCountStudent = 0;
      } else {
        conv.unreadCountExpert = 0;
      }
      saveDatabase(data);
    }
    return conv;
  },
  updateConversationStatusTag: (
    conversationId: string,
    statusTag: string,
    status?: 'OPEN' | 'CLOSED' | 'PENDING',
    tags?: string[]
  ) => {
    const data = loadDatabase();
    const conv = data.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.statusTag = statusTag;
      if (status) conv.status = status;
      if (tags) conv.tags = tags;
      saveDatabase(data);
    }
    return conv;
  },
  updateConversationAssignee: (
    conversationId: string,
    assigneeName: string,
    assignedToId?: string
  ) => {
    const data = loadDatabase();
    const conv = data.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.assigneeName = assigneeName;
      conv.assignedToId = assignedToId;
      saveDatabase(data);
    }
    return conv;
  },
  getOrCreateConversation: (studentId: string, expertId: string) => {
    const data = loadDatabase();
    let conv = data.conversations.find((c) => c.studentId === studentId && c.expertId === expertId);
    if (!conv) {
      const student = data.users.find((u) => u.id === studentId);
      conv = {
        id: `conv_${Date.now()}`,
        studentId,
        expertId,
        contactName: student?.name || 'Student Lead',
        contactCountry: student?.country || 'US',
        assigneeName: 'Dr. Marcus Vance',
        assignedToId: expertId,
        statusTag: 'Open: Active Inquiry',
        status: 'OPEN',
        tags: ['New Lead'],
        lastMessage: 'Conversation initialized',
        lastMessageTime: 'Just now',
        unreadCountStudent: 0,
        unreadCountExpert: 0,
      };
      data.conversations.unshift(conv);
      saveDatabase(data);
    }
    return conv;
  },
  getConversationById: (conversationId: string) =>
    loadDatabase().conversations.find((c) => c.id === conversationId),
  getMessagesByConversationId: (conversationId: string) =>
    loadDatabase().messages.filter((m) => m.conversationId === conversationId),
  sendMessage: (payload: {
    conversationId: string;
    senderId: string;
    senderRole: UserRole;
    senderName: string;
    content: string;
    attachment?: { name: string; size: string; type: string; url: string };
  }) => {
    const data = loadDatabase();
    const conversation = data.conversations.find((c) => c.id === payload.conversationId);
    if (!conversation) return null;

    const scan = scanAndSanitizeMessage(payload.content);

    const messageId = `msg_${Date.now()}`;
    const newMessage: ChatMessage = {
      id: messageId,
      conversationId: payload.conversationId,
      senderId: payload.senderId,
      senderRole: payload.senderRole,
      senderName: payload.senderName,
      content: scan.sanitizedContent,
      originalContent: scan.isViolating ? scan.originalContent : undefined,
      isFlagged: scan.isViolating,
      flagReason: scan.isViolating ? scan.flagReasons.join(', ') : undefined,
      attachment: payload.attachment,
      status: 'SENT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    data.messages.push(newMessage);

    if (scan.isViolating) {
      const flaggedRecord: FlaggedMessageRecord = {
        id: `flg_${Date.now()}`,
        messageId,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        senderRole: payload.senderRole,
        senderName: payload.senderName,
        attemptedLeakType: scan.detectedTypes,
        flaggedText: scan.originalContent,
        redactedText: scan.sanitizedContent,
        timestamp: new Date().toISOString(),
        status: 'PENDING_REVIEW',
      };
      data.flaggedMessages.unshift(flaggedRecord);
    }

    conversation.lastMessage = scan.sanitizedContent || (payload.attachment ? `📎 ${payload.attachment.name}` : '');
    conversation.lastMessageTime = 'Just now';
    if (payload.senderRole === 'STUDENT') {
      conversation.unreadCountExpert += 1;
    } else {
      conversation.unreadCountStudent += 1;
    }

    saveDatabase(data);
    return {
      message: newMessage,
      scanResult: scan,
    };
  },
  getFlaggedMessages: () => loadDatabase().flaggedMessages,
  updateFlaggedMessageStatus: (
    id: string,
    status: 'PENDING_REVIEW' | 'WARNING_ISSUED' | 'DISMISSED',
    customWarning?: string
  ) => {
    const data = loadDatabase();
    const item = data.flaggedMessages.find((f) => f.id === id);
    if (!item) return null;
    item.status = status;

    let warningMessage: ChatMessage | null = null;
    if (status === 'WARNING_ISSUED') {
      const warningText =
        customWarning ||
        `⚠️ [OFFICIAL SAFETY WARNING] Our Zero Contact Leakage monitor intercepted an off-platform contact exchange attempt. Sharing mobile numbers, emails, or personal messaging handles (WhatsApp/Telegram/Instagram) violates M1 Company Platform Policy. All orders, communication, and payments must remain within M1 Company to preserve platform escrow guarantees and account safety.`;

      const conv =
        data.conversations.find((c) => c.id === item.conversationId) ||
        data.conversations.find((c) => c.studentId === item.senderId) ||
        data.conversations[0];

      if (conv) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        warningMessage = {
          id: `msg_warn_${Date.now()}`,
          conversationId: conv.id,
          senderId: 'm1_security_system',
          senderRole: 'ADMIN',
          senderName: 'M1 Security Enforcement',
          content: warningText,
          status: 'SENT',
          timestamp,
        };
        data.messages.push(warningMessage);
        conv.lastMessage = `⚠️ Safety Warning Issued to ${item.senderName}`;
        conv.lastMessageTime = 'Just now';
        conv.unreadCountStudent += 1;
      }
    }

    saveDatabase(data);
    return { item, warningMessage };
  },
  deleteFlaggedMessage: (id: string) => {
    const data = loadDatabase();
    const index = data.flaggedMessages.findIndex((f) => f.id === id);
    if (index === -1) return false;
    data.flaggedMessages.splice(index, 1);
    saveDatabase(data);
    return true;
  },
  clearFlaggedMessages: () => {
    const data = loadDatabase();
    data.flaggedMessages = [];
    saveDatabase(data);
    return true;
  },
  createFlaggedIncident: (payload: {
    senderId: string;
    senderRole: UserRole;
    senderName: string;
    conversationId?: string;
    content: string;
  }) => {
    const data = loadDatabase();
    const scan = scanAndSanitizeMessage(payload.content);
    if (!scan.isViolating) return null;

    let conv = payload.conversationId
      ? data.conversations.find((c) => c.id === payload.conversationId)
      : data.conversations.find((c) => c.studentId === payload.senderId);

    if (!conv) {
      conv = data.conversations[0];
    }

    const convId = conv ? conv.id : 'conv_direct';
    const messageId = `msg_sim_${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMessage: ChatMessage = {
      id: messageId,
      conversationId: convId,
      senderId: payload.senderId,
      senderRole: payload.senderRole,
      senderName: payload.senderName,
      content: scan.sanitizedContent,
      originalContent: scan.originalContent,
      isFlagged: true,
      flagReason: scan.flagReasons.join(', '),
      status: 'SENT',
      timestamp,
    };
    data.messages.push(newMessage);

    const flaggedRecord: FlaggedMessageRecord = {
      id: `flg_${Date.now()}`,
      messageId,
      conversationId: convId,
      senderId: payload.senderId,
      senderRole: payload.senderRole,
      senderName: payload.senderName,
      attemptedLeakType: scan.detectedTypes,
      flaggedText: scan.originalContent,
      redactedText: scan.sanitizedContent,
      timestamp: new Date().toISOString(),
      status: 'PENDING_REVIEW',
    };
    data.flaggedMessages.unshift(flaggedRecord);

    if (conv) {
      conv.lastMessage = scan.sanitizedContent;
      conv.lastMessageTime = timestamp;
      if (payload.senderRole === 'STUDENT') conv.unreadCountExpert += 1;
      else conv.unreadCountStudent += 1;
    }

    saveDatabase(data);
    return {
      incident: flaggedRecord,
      message: newMessage,
      scanResult: scan,
    };
  },

  // REVIEWS
  getReviews: () => loadDatabase().reviews,
  getReviewsByExpertId: (expertId: string) =>
    loadDatabase().reviews.filter((r) => r.expertId === expertId),
  createReview: (payload: {
    orderId: string;
    studentId: string;
    expertId: string;
    rating: number;
    comment: string;
  }) => {
    const data = loadDatabase();
    const order = data.orders.find((o) => o.id === payload.orderId);
    const student = data.users.find((u) => u.id === payload.studentId);
    const id = `rev_${Date.now()}`;

    const newReview: ExpertReview = {
      id,
      orderId: payload.orderId,
      orderNumber: order?.orderNumber || 'ORD-UNKNOWN',
      studentId: payload.studentId,
      studentMaskedName: student ? `${student.name.split(' ')[0]} (${student.maskedId})` : 'Student',
      expertId: payload.expertId,
      rating: payload.rating,
      comment: payload.comment,
      createdAt: new Date().toISOString(),
    };

    data.reviews.unshift(newReview);

    const expertReviews = data.reviews.filter((r) => r.expertId === payload.expertId);
    const avg = expertReviews.reduce((sum, r) => sum + r.rating, 0) / expertReviews.length;
    const expertProfile = data.expertProfiles.find((p) => p.userId === payload.expertId);
    if (expertProfile) {
      expertProfile.rating = parseFloat(avg.toFixed(1));
      expertProfile.reviewCount = expertReviews.length;
    }

    saveDatabase(data);
    return newReview;
  },

  // AD BANNERS
  getAdBanners: () => loadDatabase().adBanners,
  getActiveAdBanners: () => loadDatabase().adBanners.filter((b) => b.isActive),
  toggleAdBanner: (id: string) => {
    const data = loadDatabase();
    const banner = data.adBanners.find((b) => b.id === id);
    if (!banner) return null;
    banner.isActive = !banner.isActive;
    saveDatabase(data);
    return banner;
  },
  createAdBanner: (bannerData: Omit<AdBanner, 'id' | 'viewsCount' | 'clicksCount' | 'createdAt'>) => {
    const data = loadDatabase();
    const newBanner: AdBanner = {
      ...bannerData,
      id: `ad_${Date.now()}`,
      viewsCount: 0,
      clicksCount: 0,
      createdAt: new Date().toISOString(),
    };
    data.adBanners.unshift(newBanner);
    saveDatabase(data);
    return newBanner;
  },
  deleteAdBanner: (id: string) => {
    const data = loadDatabase();
    data.adBanners = data.adBanners.filter((b) => b.id !== id);
    saveDatabase(data);
    return true;
  },
};
