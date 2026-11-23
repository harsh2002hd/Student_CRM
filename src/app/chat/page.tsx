'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import {
  Conversation,
  ChatMessage,
  Order,
  User,
  AgentAvailability,
  QuickReply,
  MessageTemplate,
  LeadTag,
} from '@/types';
import {
  Search,
  Paperclip,
  Send,
  ArrowLeft,
  Info,
  Check,
  CheckCheck,
  Clock,
  Download,
  AlertTriangle,
  ShieldCheck,
  Phone,
  Video,
  Tag,
  FileText,
  Zap,
  BookOpen,
  User as UserIcon,
  Bell,
  ChevronDown,
  CheckCircle2,
  X,
  Sparkles,
  Filter,
  Plus,
  Radio,
  Globe,
  Layers,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  PlayCircle,
  MessageSquare,
} from 'lucide-react';
import { formatGlobalAmount } from '@/lib/currencies';
import MaskedCallModal from '@/components/call/MaskedCallModal';
import PaymentCheckoutModal from '@/components/orders/PaymentCheckoutModal';
import RatingModal from '@/components/orders/RatingModal';
import AuthModal from '@/components/auth/AuthModal';
import { INITIAL_QUICK_REPLIES, INITIAL_TEMPLATES, INITIAL_LEAD_TAGS } from '@/lib/inboxConstants';

export default function MobileFirstChatInbox() {
  const { currentUser, currentRole, switchUser, allUsers, refreshUserData } = useAuth();
  const {
    socket,
    isConnected,
    onlineUserIds,
    typingUsers,
    sendRealtimeMessage,
    sendTypingSignal,
  } = useSocket();

  // Primary Data States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [counterpartUser, setCounterpartUser] = useState<User | null>(null);

  // Mobile View Navigation State: 'INBOX' list or 'THREAD' detail
  const [mobileView, setMobileView] = useState<'INBOX' | 'THREAD'>('INBOX');

  // Top Bar & Agent Availability State
  const [availability, setAvailability] = useState<AgentAvailability>('ONLINE');
  const [isAvailabilityMenuOpen, setIsAvailabilityMenuOpen] = useState(false);
  const [businessStatus, setBusinessStatus] = useState<string>('Operational • 24/7 Global');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusInput, setStatusInput] = useState('Operational • 24/7 Global');

  // Simulated / Real-time Notification Banner
  const [showBannerNotification, setShowBannerNotification] = useState(true);
  const [bannerText, setBannerText] = useState('[M1 Workspace] • New message from 1 chat');

  // Inbox Queue Filters & Search
  const [queueTab, setQueueTab] = useState<'ALL' | 'MY' | 'UNASSIGNED'>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Composer States
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [warningBanner, setWarningBanner] = useState<string | null>(null);
  const [isThreadLoading, setIsThreadLoading] = useState(false);

  // Bottom Navigation & Utility Modals
  const [bottomNavTab, setBottomNavTab] = useState<'INBOX' | 'MENU' | 'PROFILE'>('INBOX');
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isQuickRepliesOpen, setIsQuickRepliesOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [isTagChangeModalOpen, setIsTagChangeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Modals for Call, Pay, Rate
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  // Quick replies & templates stored in local state for customization
  const [quickRepliesList, setQuickRepliesList] = useState<QuickReply[]>(INITIAL_QUICK_REPLIES);
  const [templatesList] = useState<MessageTemplate[]>(INITIAL_TEMPLATES);
  const [tagsList, setTagsList] = useState<LeadTag[]>(INITIAL_LEAD_TAGS);
  const [newTagInput, setNewTagInput] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Conversations from API
  const loadConversations = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/chat/conversations?userId=${currentUser.id}&role=${currentRole || 'STUDENT'}`);
      const data = await res.json();
      if (data.success && data.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0) {
          const exists = data.conversations.some((c: any) => c.id === activeConversationId);
          if (!exists || !activeConversationId) {
            setActiveConversationId(data.conversations[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching conversations', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUser, currentRole]);

  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;
  }, [conversations, activeConversationId]);

  // 2. Fetch Messages & Linked Order when Active Conversation changes
  useEffect(() => {
    if (!activeConversationId) return;

    let isMounted = true;
    setIsThreadLoading(true);

    const fetchThread = async () => {
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${activeConversationId}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setMessages(data.messages);
        }

        // Fetch counterparty details
        if (activeConversation) {
          const targetId = currentRole === 'STUDENT' ? activeConversation.expertId : activeConversation.studentId;
          const userRes = await fetch('/api/auth/users');
          const userData = await userRes.json();
          if (userData.success) {
            const user = userData.users.find((u: User) => u.id === targetId);
            if (isMounted) setCounterpartUser(user || null);
          }

          // Fetch order if present
          if (activeConversation.orderId) {
            const ordRes = await fetch(`/api/orders/${activeConversation.orderId}`);
            const ordData = await ordRes.json();
            if (isMounted && ordData.success) {
              setActiveOrder(ordData.order);
            }
          } else {
            if (isMounted) setActiveOrder(null);
          }
        }
      } catch (err) {
        console.error('Error fetching thread details', err);
      } finally {
        if (isMounted) {
          setTimeout(() => setIsThreadLoading(false), 250);
        }
      }
    };

    fetchThread();

    // Mark as read when entering conversation
    if (activeConversation) {
      fetch(`/api/chat/conversations/${activeConversationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: currentRole }),
      }).then(() => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? currentRole === 'STUDENT'
                ? { ...c, unreadCountStudent: 0 }
                : { ...c, unreadCountExpert: 0 }
              : c
          )
        );
      });
    }

    return () => {
      isMounted = false;
    };
  }, [activeConversationId, activeConversation?.orderId, currentRole]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThreadLoading]);

  // 3. Socket.io Real-Time Listener Registration
  useEffect(() => {
    if (!socket) return;

    if (activeConversationId) {
      socket.emit('join_conversation', { conversationId: activeConversationId });
    }

    const handleReceiveMessage = (data: { message: ChatMessage; scanResult: any }) => {
      if (data.message.conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }

      // Update snippet in conversations queue
      setConversations((prev) => {
        const found = prev.some((c) => c.id === data.message.conversationId);
        if (!found) {
          // New student or conversation created! Reload queue so they appear instantly
          loadConversations();
          return prev;
        }
        return prev.map((c) => {
          if (c.id === data.message.conversationId) {
            const isMe = data.message.senderId === currentUser?.id;
            return {
              ...c,
              lastMessage: data.message.content || '📎 Attachment',
              lastMessageTime: data.message.timestamp,
              unreadCountExpert: !isMe && currentRole !== 'STUDENT' ? c.unreadCountExpert + 1 : c.unreadCountExpert,
              unreadCountStudent: !isMe && currentRole === 'STUDENT' ? c.unreadCountStudent + 1 : c.unreadCountStudent,
            };
          }
          return c;
        });
      });

      // Trigger incoming banner notification if not viewing that thread
      if (data.message.conversationId !== activeConversationId) {
        setBannerText(`[M1 Workspace] • New message from ${data.message.senderName}`);
        setShowBannerNotification(true);
      }
    };

    const handleConversationUpdated = (data: { conversationId: string; lastMessage: string; lastMessageTime: string }) => {
      setConversations((prev) => {
        const found = prev.some((c) => c.id === data.conversationId);
        if (!found) {
          loadConversations();
          return prev;
        }
        return prev.map((c) => {
          if (c.id === data.conversationId) {
            return {
              ...c,
              lastMessage: data.lastMessage,
              lastMessageTime: data.lastMessageTime,
            };
          }
          return c;
        });
      });
    };

    const handleNewLeadRegistered = (data: { user: User; conversation: Conversation; message: ChatMessage }) => {
      loadConversations();
      if (currentRole !== 'STUDENT') {
        setBannerText(`[M1 Workspace] • New lead: ${data.user.name} sent a message!`);
        setShowBannerNotification(true);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('new_lead_registered', handleNewLeadRegistered);

    return () => {
      if (activeConversationId) {
        socket.emit('leave_conversation', { conversationId: activeConversationId });
      }
      socket.off('receive_message', handleReceiveMessage);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('new_lead_registered', handleNewLeadRegistered);
    };
  }, [socket, activeConversationId, currentUser?.id, currentRole]);

  // 4. Typing Signal
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeConversationId) return;

    sendTypingSignal(activeConversationId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingSignal(activeConversationId, false);
    }, 2000);
  };

  // 5. Send Message Dispatch
  const handleSendMessage = () => {
    if (!inputText.trim() || !activeConversationId) return;
    const textToSend = inputText.trim();
    setInputText('');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingSignal(activeConversationId, false);

    const payload = {
      conversationId: activeConversationId,
      senderId: currentUser.id,
      senderRole: currentRole,
      senderName: currentUser.name,
      content: textToSend,
    };

    sendRealtimeMessage(
      payload,
      textToSend,
      (scan) => {
        if (scan?.isViolating) {
          setWarningBanner('Notice: Sharing phone numbers, emails, or personal handles is restricted for student privacy.');
          setTimeout(() => setWarningBanner(null), 7000);
        }
      }
    );
  };

  // 6. Real File Upload Dispatch
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.file) {
        const payload = {
          conversationId: activeConversationId,
          senderId: currentUser.id,
          senderRole: currentRole,
          senderName: currentUser.name,
          content: `📎 Shared file: ${data.file.name}`,
          attachment: {
            name: data.file.name,
            size: data.file.size,
            type: data.file.type,
            url: data.file.url,
          },
        };
        sendRealtimeMessage(payload);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 7. Filter & Search Logic for Conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const contactMatch = (c.contactName || '').toLowerCase().includes(query);
        const msgMatch = (c.lastMessage || '').toLowerCase().includes(query);
        const assigneeMatch = (c.assigneeName || '').toLowerCase().includes(query);
        const tagMatch = (c.tags || []).some((t) => t.toLowerCase().includes(query));
        if (!contactMatch && !msgMatch && !assigneeMatch && !tagMatch) return false;
      }

      // 2. Unread Only Toggle
      if (unreadOnly) {
        const unreadCount = currentRole === 'STUDENT' ? c.unreadCountStudent : c.unreadCountExpert;
        if (unreadCount <= 0) return false;
      }

      // 3. Queue Tabs (All, My, Unassigned)
      if (currentRole === 'STUDENT') {
        // Students only see their own chat
        return true;
      }

      if (queueTab === 'MY') {
        return c.expertId === currentUser?.id || c.assignedToId === currentUser?.id;
      }
      if (queueTab === 'UNASSIGNED') {
        return !c.assignedToId || c.assigneeName === 'Unassigned' || !c.expertId;
      }
      return true;
    });
  }, [conversations, searchQuery, unreadOnly, queueTab, currentRole, currentUser?.id]);

  // Total Unread Count for Inbox badge
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, c) => {
      return sum + (currentRole === 'STUDENT' ? c.unreadCountStudent : c.unreadCountExpert);
    }, 0);
  }, [conversations, currentRole]);

  // Insert Quick Reply into composer
  const handleInsertQuickReply = (qr: QuickReply) => {
    setInputText((prev) => (prev ? `${prev} ${qr.text}` : qr.text));
    setIsQuickRepliesOpen(false);
  };

  // Insert Template into composer
  const handleInsertTemplate = (tpl: MessageTemplate) => {
    setInputText(tpl.content);
    setIsTemplatesOpen(false);
  };

  // Change conversation status / tag
  const handleUpdateStatusTag = async (newTag: string, status: 'OPEN' | 'CLOSED' = 'OPEN') => {
    if (!activeConversationId) return;
    try {
      await fetch(`/api/chat/conversations/${activeConversationId}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusTag: newTag, status }),
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversationId ? { ...c, statusTag: newTag, status } : c))
      );
      setIsTagChangeModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Add new Tag
  const handleAddNewTag = () => {
    if (!newTagInput.trim()) return;
    const tagItem: LeadTag = {
      id: `tag_${Date.now()}`,
      name: newTagInput.trim(),
      color: '#10b981',
      bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
    setTagsList((prev) => [...prev, tagItem]);
    setNewTagInput('');
  };

  // Mark active thread as read manually
  const handleMarkAsReadManual = async () => {
    if (!activeConversationId) return;
    await fetch(`/api/chat/conversations/${activeConversationId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: currentRole }),
    });
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? currentRole === 'STUDENT'
            ? { ...c, unreadCountStudent: 0 }
            : { ...c, unreadCountExpert: 0 }
          : c
      )
    );
  };

  const activeTypingList = useMemo(() => {
    if (!typingUsers || !activeConversationId) return [];
    if (Array.isArray(typingUsers)) {
      return (typingUsers as any[])
        .filter((t) => t.conversationId === activeConversationId && t.userId !== currentUser?.id)
        .map((t) => t.userName || 'Counterparty');
    }
    if (typeof typingUsers === 'object') {
      const list = (typingUsers as Record<string, string[]>)[activeConversationId] || [];
      return list.filter((name: string) => name !== currentUser?.name);
    }
    return [];
  }, [typingUsers, activeConversationId, currentUser]);

  const isOtherUserTyping = activeTypingList.length > 0;

  if (!mounted) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full bg-slate-50 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center animate-pulse">
            <MessageSquare className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading M1 Workspace Chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full bg-slate-50 font-sans antialiased text-slate-800 overflow-hidden sm:p-3">
      
      {/* ========================================================================= */}
      {/* 1. TOP BAR & AGENT AVAILABILITY & INCOMING NOTIFICATION BANNER             */}
      {/* ========================================================================= */}
      <div className="w-full bg-white border-b border-emerald-100/90 shadow-2xs z-30 shrink-0">
        
        {/* Top Status & Availability Header */}
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2 border-b border-slate-100">
          
          {/* Business Status Badge */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setStatusInput(businessStatus);
                setShowStatusModal(true);
              }}
              title="Click to change business status"
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="max-w-[130px] sm:max-w-none truncate">{businessStatus}</span>
              <SlidersHorizontal className="h-3 w-3 text-emerald-600 opacity-70" />
            </button>

            {/* Socket.io Indicator */}
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isConnected ? 'Socket.io Live' : 'Connecting'}
            </span>
          </div>

          {/* Interactive Agent Availability Selector */}
          <div className="relative">
            <button
              onClick={() => setIsAvailabilityMenuOpen(!isAvailabilityMenuOpen)}
              className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  availability === 'ONLINE'
                    ? 'bg-emerald-500 shadow-xs shadow-emerald-400'
                    : availability === 'BUSY'
                    ? 'bg-amber-500 shadow-xs shadow-amber-400'
                    : 'bg-slate-400'
                }`}
              />
              <span className="capitalize">{availability.toLowerCase()}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Availability Dropdown Menu */}
            {isAvailabilityMenuOpen && (
              <div className="absolute right-0 mt-1 w-36 rounded-2xl bg-white border border-slate-100 shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setAvailability('ONLINE');
                    setIsAvailabilityMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium transition-colors ${
                    availability === 'ONLINE' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Online</span>
                </button>
                <button
                  onClick={() => {
                    setAvailability('BUSY');
                    setIsAvailabilityMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium transition-colors ${
                    availability === 'BUSY' ? 'bg-amber-50 text-amber-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Busy</span>
                </button>
                <button
                  onClick={() => {
                    setAvailability('OFFLINE');
                    setIsAvailabilityMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium transition-colors ${
                    availability === 'OFFLINE' ? 'bg-slate-100 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span>Offline</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Real-time / Simulated Incoming Message Notification Banner */}
        {showBannerNotification && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-3 sm:px-4 py-1.5 text-xs flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2 min-w-0">
              <Bell className="h-3.5 w-3.5 shrink-0 text-emerald-200 animate-bounce" />
              <span className="font-medium truncate">{bannerText}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
              >
                Switch account
              </button>
              <button
                onClick={() => setShowBannerNotification(false)}
                className="text-white/80 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MAIN BODY: SPLIT VIEW (RESPONSIVE MOBILE FIRST)                            */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative sm:rounded-2xl sm:border sm:border-slate-200/90 sm:shadow-lg sm:bg-white">
        
        {/* ========================================================================= */}
        {/* 2. INBOX QUEUE, FILTERS & SEARCH (LEFT PANE / MOBILE INBOX VIEW)           */}
        {/* ========================================================================= */}
        <div
          className={`flex flex-col bg-white border-r border-slate-200/80 w-full md:w-80 lg:w-96 shrink-0 h-full transition-transform duration-200 ${
            mobileView === 'THREAD' ? 'hidden md:flex' : 'flex'
          }`}
        >
          
          {/* Search Leads Input */}
          <div className="p-3 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-100 font-medium transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Primary Queue Tabs & Unread Toggle */}
          <div className="px-3 pt-2 pb-1 border-b border-slate-100 bg-white space-y-2">
            
            {/* Primary Queue Tabs (All Chats, My Chats, Unassigned) */}
            {currentRole !== 'STUDENT' ? (
              <div className="flex bg-slate-100/90 p-1 rounded-xl gap-1 text-xs">
                <button
                  onClick={() => setQueueTab('ALL')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                    queueTab === 'ALL'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All Chats
                </button>
                <button
                  onClick={() => setQueueTab('MY')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                    queueTab === 'MY'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  My Chats
                </button>
                <button
                  onClick={() => setQueueTab('UNASSIGNED')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                    queueTab === 'UNASSIGNED'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Unassigned
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between">
                <span>My Academic Support Chat</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full font-bold">
                  Direct Line
                </span>
              </div>
            )}

            {/* Quick Filter Toggles: "All" vs "Unread Only" */}
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {filteredConversations.length} {filteredConversations.length === 1 ? 'Conversation' : 'Conversations'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setUnreadOnly(false)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                    !unreadOnly ? 'bg-emerald-100 text-emerald-800' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setUnreadOnly(true)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                    unreadOnly ? 'bg-rose-100 text-rose-700' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>Unread Only</span>
                  {totalUnreadCount > 0 && (
                    <span className="h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {totalUnreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Conversation List Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No leads found</p>
                <p className="text-[11px]">Try clearing filters or search query.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                const contactName = conv.contactName || (conv.studentId === currentUser?.id ? 'M1 Support' : 'Student Lead');
                const initials = contactName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();
                const unreadCount = currentRole === 'STUDENT' ? conv.unreadCountStudent : conv.unreadCountExpert;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConversationId(conv.id);
                      setMobileView('THREAD');
                    }}
                    className={`flex items-start gap-3 p-3 transition-colors cursor-pointer relative ${
                      isActive
                        ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    
                    {/* Soft Mint-Green Circular Avatar */}
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-100 text-emerald-800 flex items-center justify-center font-bold text-xs shadow-2xs border border-emerald-200/60">
                        {initials}
                      </div>
                      {/* Live dot indicator */}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>

                    {/* Contact Info & Preview */}
                    <div className="flex-1 min-w-0">
                      
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {contactName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {conv.lastMessageTime}
                        </span>
                      </div>

                      {/* Last message preview with media icon indicators */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate font-normal">
                        {conv.hasMedia && conv.mediaType === 'video' && (
                          <PlayCircle className="h-3 w-3 text-emerald-600 shrink-0" />
                        )}
                        {conv.hasMedia && conv.mediaType !== 'video' && (
                          <Paperclip className="h-3 w-3 text-emerald-600 shrink-0" />
                        )}
                        <span className="truncate">{conv.lastMessage || 'No messages yet'}</span>
                      </div>

                      {/* Row Footer: Assignee Label & Red Pill Badge */}
                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        
                        {/* Assignee label */}
                        <span className="text-[10px] text-slate-400 truncate font-medium">
                          {conv.assigneeName ? `Assigned to ${conv.assigneeName.split(' ')[0]}` : 'Unassigned'}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Status Tag Pill if present */}
                          {conv.statusTag && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-medium truncate max-w-[100px]">
                              {conv.statusTag}
                            </span>
                          )}

                          {/* Red Pill Badge showing unread message count */}
                          {unreadCount > 0 && (
                            <span className="h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                              {unreadCount}
                            </span>
                          )}
                        </div>

                      </div>

                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 4. CONVERSATION / MESSAGE HISTORY SCREEN (RIGHT PANE / MOBILE THREAD VIEW) */}
        {/* ========================================================================= */}
        <div
          className={`flex-1 flex flex-col bg-white h-full relative ${
            mobileView === 'INBOX' ? 'hidden md:flex' : 'flex'
          }`}
        >
          
          {/* Conversation Screen Header */}
          <div className="p-3 bg-white border-b border-slate-200/80 flex items-center justify-between gap-2 z-20 shrink-0 shadow-2xs">
            
            <div className="flex items-center gap-2.5 min-w-0">
              
              {/* Back Button (Mobile) */}
              <button
                onClick={() => setMobileView('INBOX')}
                className="md:hidden rounded-full p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Back to Inbox"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              {/* Avatar */}
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {(activeConversation?.contactName || 'Lead')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()}
              </div>

              {/* Title & Subtitle */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    {activeConversation?.contactName || 'Message History'}
                  </h3>
                  {activeConversation?.contactCountry && (
                    <span className="text-[10px] text-slate-500 font-mono font-medium">
                      ({activeConversation.contactCountry})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{activeConversation?.assigneeName ? `Assigned to ${activeConversation.assigneeName}` : 'Unassigned'}</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-medium">Active Lead</span>
                </div>
              </div>

            </div>

            {/* Header Action Buttons: "Mark as read" & Info ("i") */}
            <div className="flex items-center gap-1.5 shrink-0">
              
              {/* Masked WebRTC Call trigger */}
              <button
                onClick={() => setIsCallModalOpen(true)}
                className="p-1.5 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                title="Encrypted Masked Call"
              >
                <Phone className="h-4 w-4" />
              </button>

              {/* "Mark as read" Action Button */}
              <button
                onClick={handleMarkAsReadManual}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                title="Mark thread as read"
              >
                <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Mark as read</span>
              </button>

              {/* Info ("i") Button */}
              <button
                onClick={() => setIsInfoDrawerOpen(true)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                title="View Lead Details"
              >
                <Info className="h-4 w-4" />
              </button>

            </div>

          </div>

          {/* Privacy & Anti-Bypass Banner */}
          {warningBanner && (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2 text-xs flex items-center justify-between gap-2 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{warningBanner}</span>
              </div>
              <button onClick={() => setWarningBanner(null)} className="text-amber-600 hover:text-amber-800">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Message Thread Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30">
            
            {/* Centered "CHAT STARTED" Pill Divider */}
            <div className="flex items-center justify-center my-3">
              <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-2xs flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span>CHAT STARTED • ENCRYPTED SESSION</span>
              </div>
            </div>

            {/* Skeleton Loading State when switching threads */}
            {isThreadLoading ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="flex justify-start">
                  <div className="bg-slate-200 h-10 w-48 rounded-2xl" />
                </div>
                <div className="flex justify-end">
                  <div className="bg-emerald-100 h-12 w-64 rounded-2xl" />
                </div>
                <div className="flex justify-start">
                  <div className="bg-slate-200 h-16 w-56 rounded-2xl" />
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <MessageSquare className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No messages in this chat yet</p>
                <p className="text-[11px]">Send a greeting or select a Quick Reply below.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    
                    {/* Sender Label */}
                    <span className="text-[10px] text-slate-400 px-1 font-medium">
                      {isMe ? 'You' : msg.senderName}
                    </span>

                    {/* Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-md rounded-2xl px-3.5 py-2.5 text-xs shadow-xs break-words leading-relaxed ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-xs'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {/* Flagged warning badge */}
                      {msg.isFlagged && (
                        <div className="mb-1 rounded-md bg-amber-500/20 text-amber-200 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Sanitized for privacy</span>
                        </div>
                      )}

                      {/* Content */}
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Attachment card if present */}
                      {msg.attachment && (
                        <div
                          className={`mt-2 p-2 rounded-xl flex items-center justify-between gap-2 ${
                            isMe ? 'bg-emerald-700/50 text-white' : 'bg-slate-50 border border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {msg.attachment.type?.includes('video') ? (
                              <PlayCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                            )}
                            <div className="truncate text-[11px]">
                              <div className="font-bold truncate">{msg.attachment.name}</div>
                              <div className="text-[9px] opacity-80">{msg.attachment.size}</div>
                            </div>
                          </div>
                          <a
                            href={msg.attachment.url}
                            download={msg.attachment.name}
                            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                              isMe ? 'bg-emerald-800 hover:bg-emerald-900 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            }`}
                            title="Download file"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Timestamp & Ticks */}
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                          isMe ? 'text-emerald-100' : 'text-slate-400'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {isMe && (
                          <span>
                            {msg.status === 'READ' ? (
                              <CheckCheck className="h-3 w-3 text-emerald-200" />
                            ) : (
                              <Check className="h-3 w-3 text-emerald-300" />
                            )}
                          </span>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })
            )}

            {/* Other User Typing Indicator */}
            {isOtherUserTyping && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 w-fit px-3 py-1.5 rounded-full border border-emerald-200/80 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce" />
                <span className="text-[11px] font-medium">{activeTypingList[0] || 'Counterparty'} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM COMPOSER BAR                                                       */}
          {/* ========================================================================= */}
          <div className="p-3 bg-white border-t border-slate-200/80 shrink-0 space-y-2">
            
            {/* Top Toolbar: Status/Tag Pill & Quick Action Shortcuts */}
            <div className="flex items-center justify-between gap-2">
              
              {/* Conversation status/tag pill (clickable to change tag) */}
              <button
                onClick={() => setIsTagChangeModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer"
                title="Click to update status or tag"
              >
                <Tag className="h-3 w-3 text-emerald-600" />
                <span>{activeConversation?.statusTag || 'Open: lead_reconnect'}</span>
                <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
              </button>

              {/* Quick Shortcuts */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsQuickRepliesOpen(true)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-colors cursor-pointer"
                  title="Quick Replies"
                >
                  <Zap className="h-3 w-3 text-emerald-600" />
                  <span className="hidden sm:inline">Quick Reply</span>
                </button>
                <button
                  onClick={() => setIsTemplatesOpen(true)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                  title="Templates"
                >
                  <BookOpen className="h-3 w-3 text-slate-500" />
                  <span className="hidden sm:inline">Template</span>
                </button>
              </div>

            </div>

            {/* Input Row: Paperclip, Text Input, Send Button */}
            <div className="flex items-center gap-2">
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Paperclip Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2.5 rounded-full text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer"
                title="Upload Assignment / PDF / Video"
              >
                {isUploading ? (
                  <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
                ) : (
                  <Paperclip className="h-5 w-5" />
                )}
              </button>

              {/* Text Input */}
              <input
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-100 font-medium transition-all"
              />

              {/* Circular Green Send Button */}
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className={`p-2.5 rounded-full transition-all shrink-0 cursor-pointer ${
                  inputText.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title="Send Message"
              >
                <Send className="h-4 w-4" />
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. FIXED BOTTOM NAVIGATION BAR & UTILITY MENU (INBOX, MENU, PROFILE)        */}
      {/* ========================================================================= */}
      <div className="w-full bg-white border-t border-slate-200/90 py-1.5 px-6 flex items-center justify-around z-30 shrink-0 shadow-lg">
        
        {/* Nav Item 1: Inbox (with total unread badge count) */}
        <button
          onClick={() => {
            setBottomNavTab('INBOX');
            setMobileView('INBOX');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors relative ${
            bottomNavTab === 'INBOX' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <MessageSquare className="h-5 w-5" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-2 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {totalUnreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Inbox</span>
        </button>

        {/* Nav Item 2: Menu (opens Action Sheet / Popover) */}
        <button
          onClick={() => {
            setBottomNavTab('MENU');
            setIsMenuSheetOpen(true);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors ${
            bottomNavTab === 'MENU' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-5 w-5" />
          <span className="text-[10px]">Menu</span>
        </button>

        {/* Nav Item 3: Profile & Switcher */}
        <button
          onClick={() => {
            setBottomNavTab('PROFILE');
            setIsAuthModalOpen(true);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors ${
            bottomNavTab === 'PROFILE' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserIcon className="h-5 w-5" />
          <span className="text-[10px]">Profile</span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* ACTION SHEET / UTILITY MENU POPOVER (Quick Replies, Templates, Tags, etc.) */}
      {/* ========================================================================= */}
      {isMenuSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-100 p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  M1
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Utility Menu</h3>
                  <p className="text-[10px] text-slate-400">Agent tools & canned automation</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuSheetOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              
              <button
                onClick={() => {
                  setIsMenuSheetOpen(false);
                  setIsQuickRepliesOpen(true);
                }}
                className="flex flex-col items-start p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left"
              >
                <Zap className="h-5 w-5 text-emerald-600 mb-2" />
                <span className="font-bold text-slate-900">Quick Replies</span>
                <span className="text-[10px] text-slate-500">Insert common greetings & FAQs</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuSheetOpen(false);
                  setIsTemplatesOpen(true);
                }}
                className="flex flex-col items-start p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left"
              >
                <BookOpen className="h-5 w-5 text-teal-600 mb-2" />
                <span className="font-bold text-slate-900">Templates</span>
                <span className="text-[10px] text-slate-500">Intake, rubrics & delivery forms</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuSheetOpen(false);
                  setIsTagsModalOpen(true);
                }}
                className="flex flex-col items-start p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left"
              >
                <Tag className="h-5 w-5 text-amber-600 mb-2" />
                <span className="font-bold text-slate-900">Tags Manager</span>
                <span className="text-[10px] text-slate-500">Lead categories & priority markers</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuSheetOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="flex flex-col items-start p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left"
              >
                <LogOut className="h-5 w-5 text-rose-600 mb-2" />
                <span className="font-bold text-slate-900">Switch / Direct Login</span>
                <span className="text-[10px] text-slate-500">Change role or register lead</span>
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK REPLIES MODAL / DRAWER                                              */}
      {/* ========================================================================= */}
      {isQuickRepliesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 p-5 space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Quick Replies</h3>
                  <p className="text-[10px] text-slate-400">Tap any reply to insert into composer</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickRepliesOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {quickRepliesList.map((qr) => (
                <div
                  key={qr.id}
                  onClick={() => handleInsertQuickReply(qr)}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-800">
                      {qr.title}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                      {qr.shortcut}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {qr.text}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEMPLATES MODAL / DRAWER                                                  */}
      {/* ========================================================================= */}
      {isTemplatesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 p-5 space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-teal-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Message Templates</h3>
                  <p className="text-[10px] text-slate-400">Structured academic intake & delivery forms</p>
                </div>
              </div>
              <button
                onClick={() => setIsTemplatesOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {templatesList.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleInsertTemplate(tpl)}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-800">
                      {tpl.name}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-semibold">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">{tpl.description}</p>
                  <pre className="text-[10px] text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200 whitespace-pre-wrap font-sans">
                    {tpl.content}
                  </pre>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAGS MANAGER MODAL                                                        */}
      {/* ========================================================================= */}
      {isTagsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Lead Tags</h3>
                  <p className="text-[10px] text-slate-400">Available classification tags</p>
                </div>
              </div>
              <button
                onClick={() => setIsTagsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tag Pills */}
            <div className="flex flex-wrap gap-2">
              {tagsList.map((tag) => (
                <span
                  key={tag.id}
                  className={`text-xs px-2.5 py-1 rounded-full border font-bold ${tag.bgClass}`}
                >
                  {tag.name}
                </span>
              ))}
            </div>

            {/* Add Tag */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="New tag name..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800"
              />
              <button
                onClick={handleAddNewTag}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Add Tag
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK STATUS / TAG CHANGE PILL MODAL                                      */}
      {/* ========================================================================= */}
      {isTagChangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xs rounded-3xl bg-white shadow-2xl border border-slate-100 p-5 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Select Conversation Tag</h3>
            <div className="space-y-1.5 text-xs">
              {[
                { tag: 'Closed: lead_reconnect', status: 'CLOSED' as const },
                { tag: 'Open: Active Doubt', status: 'OPEN' as const },
                { tag: 'Open: urgent_review', status: 'OPEN' as const },
                { tag: 'In Progress: Assignment', status: 'OPEN' as const },
                { tag: 'Delivered: Milestone', status: 'OPEN' as const },
              ].map((opt) => (
                <button
                  key={opt.tag}
                  onClick={() => handleUpdateStatusTag(opt.tag, opt.status)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-800 border border-slate-100 transition-colors font-medium flex items-center justify-between"
                >
                  <span>{opt.tag}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsTagChangeModalOpen(false)}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 border-t border-slate-100 mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONVERSATION INFO ("i") DRAWER                                            */}
      {/* ========================================================================= */}
      {isInfoDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm h-full bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900">Lead & Thread Details</h3>
                <button
                  onClick={() => setIsInfoDrawerOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-center py-3">
                <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl shadow-xs">
                  {(activeConversation?.contactName || 'Lead')
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <h4 className="font-bold text-sm text-slate-900 mt-2">
                  {activeConversation?.contactName || 'Lead Student'}
                </h4>
                <p className="text-xs text-slate-500">
                  {activeConversation?.contactUniversity || 'University Student'}
                </p>
              </div>

              <div className="space-y-3 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Assignee</span>
                  <span className="font-bold text-slate-800">{activeConversation?.assigneeName || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Current Tag</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {activeConversation?.statusTag || 'Open'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Country</span>
                  <span className="font-bold text-slate-800">{activeConversation?.contactCountry || 'US'}</span>
                </div>
                {activeOrder && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-800">Linked Order {activeOrder.orderNumber}</div>
                    <div className="text-slate-500">Status: <span className="text-emerald-700 font-bold">{activeOrder.status}</span></div>
                    <div className="text-slate-500">Escrow: <span className="font-bold">${activeOrder.amount} USD</span></div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsInfoDrawerOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Close Details
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BUSINESS STATUS CONFIGURATION MODAL                                       */}
      {/* ========================================================================= */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xs rounded-3xl bg-white shadow-2xl border border-slate-100 p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Update Business Status</h3>
            <p className="text-xs text-slate-500">
              Customize status badge displayed to leads and agents.
            </p>
            <input
              type="text"
              value={statusInput}
              onChange={(e) => setStatusInput(e.target.value)}
              placeholder="e.g. Business Closed or 24/7 Global"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBusinessStatus(statusInput || 'Operational');
                  setShowStatusModal(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUTH & DIRECT REGISTRATION MODAL                                          */}
      {/* ========================================================================= */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          loadConversations();
        }}
        defaultTab="REGISTER"
      />

      {/* ========================================================================= */}
      {/* CALL MODAL                                                                */}
      {/* ========================================================================= */}
      <MaskedCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        targetRole={currentRole === 'STUDENT' ? 'EXPERT' : 'STUDENT'}
        targetMaskedName={activeConversation?.contactName || 'Lead Contact'}
        targetMaskedId={activeConversation?.id || 'M1-CALL'}
      />

    </div>
  );
}
