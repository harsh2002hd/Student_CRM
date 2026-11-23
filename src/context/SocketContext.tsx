'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { ChatMessage, Order } from '@/types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUserIds: string[];
  typingUsers: { [convId: string]: string[] };
  incomingCall: {
    callerId: string;
    callerName: string;
    sessionToken: string;
    callType: 'AUDIO' | 'VIDEO';
  } | null;
  activeLiveCall: {
    partnerId: string;
    sessionToken: string;
    status: 'RINGING' | 'CONNECTED';
  } | null;
  sendRealtimeMessage: (payload: {
    conversationId: string;
    senderId: string;
    senderRole: string;
    senderName: string;
    content: string;
    attachment?: any;
  }) => void;
  sendTypingSignal: (conversationId: string, isTyping: boolean) => void;
  broadcastFinancialUpdate: (payload: { orderId: string; amount: number; paymentStatus: string }) => void;
  broadcastOrderUpdate: (payload: { orderId: string; status: string }) => void;
  initiateCall: (targetUserId: string, callerName: string) => void;
  acceptIncomingCall: () => void;
  rejectIncomingCall: () => void;
  endLiveCall: (partnerId: string) => void;
  lastFinancialUpdate: any;
  lastOrderUpdate: any;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, refreshUserData } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [convId: string]: string[] }>({});
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [activeLiveCall, setActiveLiveCall] = useState<any | null>(null);
  const [lastFinancialUpdate, setLastFinancialUpdate] = useState<any>(null);
  const [lastOrderUpdate, setLastOrderUpdate] = useState<any>(null);

  useEffect(() => {
    // Connect to same origin
    const newSocket = io({
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (currentUser?.id) {
        newSocket.emit('register_user', {
          userId: currentUser.id,
          role: currentUser.role,
          name: currentUser.name,
        });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('online_users_list', (users: string[]) => {
      setOnlineUserIds(users);
    });

    // Real-time financial update event
    newSocket.on('realtime_financial_update', (data) => {
      setLastFinancialUpdate(data);
      refreshUserData();
    });

    // Real-time order lifecycle update
    newSocket.on('realtime_order_update', (data) => {
      setLastOrderUpdate(data);
      refreshUserData();
    });

    // Real-time typing indicators
    newSocket.on('user_typing', ({ conversationId, userId, userName, isTyping }) => {
      setTypingUsers((prev) => {
        const currentList = prev[conversationId] || [];
        if (isTyping) {
          if (!currentList.includes(userName)) {
            return { ...prev, [conversationId]: [...currentList, userName] };
          }
        } else {
          return {
            ...prev,
            [conversationId]: currentList.filter((u) => u !== userName),
          };
        }
        return prev;
      });
    });

    // WebRTC call signaling
    newSocket.on('incoming_call_request', (callData) => {
      setIncomingCall(callData);
    });

    newSocket.on('call_was_accepted', ({ targetUserId, sessionToken }) => {
      setActiveLiveCall({
        partnerId: targetUserId,
        sessionToken,
        status: 'CONNECTED',
      });
    });

    newSocket.on('call_was_rejected', () => {
      setActiveLiveCall(null);
      alert('The recipient declined the masked call.');
    });

    newSocket.on('call_was_terminated', () => {
      setActiveLiveCall(null);
      setIncomingCall(null);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Sync user registration when currentUser changes
  useEffect(() => {
    if (socket && isConnected && currentUser?.id) {
      socket.emit('register_user', {
        userId: currentUser.id,
        role: currentUser.role,
        name: currentUser.name,
      });
    }
  }, [currentUser, socket, isConnected]);

  const sendRealtimeMessage = (
    first: any,
    contentArg?: string,
    onScanResult?: (scan: any) => void,
    attachmentArg?: any
  ) => {
    let payload: any;
    if (typeof first === 'object' && first !== null && first.conversationId) {
      payload = {
        ...first,
        senderId: first.senderId || currentUser?.id,
        senderRole: first.senderRole || currentUser?.role,
        senderName: first.senderName || currentUser?.name,
      };
    } else {
      payload = {
        conversationId: first,
        content: contentArg || '',
        senderId: currentUser?.id,
        senderRole: currentUser?.role,
        senderName: currentUser?.name,
        attachment: attachmentArg,
      };
    }

    if (!payload.conversationId || !payload.senderId) {
      console.warn('Cannot send message: missing conversationId or senderId', payload);
      return;
    }

    // Always emit through Socket.io if connected
    if (socket && isConnected) {
      socket.emit('join_conversation', { conversationId: payload.conversationId });
      socket.emit('send_message', payload);
    } else {
      // Fallback via HTTP POST
      fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.scanResult && onScanResult) {
            onScanResult(data.scanResult);
          }
        })
        .catch((err) => {
          console.error('HTTP send fallback error:', err);
        });
    }
  };

  const sendTypingSignal = (conversationId: string, isTyping: boolean) => {
    if (socket && currentUser) {
      if (isTyping) {
        socket.emit('typing_start', {
          conversationId,
          userId: currentUser.id,
          userName: currentUser.name.split(' ')[0],
        });
      } else {
        socket.emit('typing_stop', {
          conversationId,
          userId: currentUser.id,
        });
      }
    }
  };

  const broadcastFinancialUpdate = (payload: any) => {
    if (socket) {
      socket.emit('broadcast_financial_update', payload);
    }
  };

  const broadcastOrderUpdate = (payload: any) => {
    if (socket) {
      socket.emit('broadcast_order_update', payload);
    }
  };

  const initiateCall = (targetUserId: string, callerName: string) => {
    const sessionToken = `CALL-GLOBAL-${Math.floor(1000 + Math.random() * 9000)}`;
    if (socket && currentUser) {
      setActiveLiveCall({
        partnerId: targetUserId,
        sessionToken,
        status: 'RINGING',
      });
      socket.emit('call_initiate', {
        callerId: currentUser.id,
        callerName: currentUser.name,
        targetUserId,
        sessionToken,
        callType: 'AUDIO',
      });
    }
  };

  const acceptIncomingCall = () => {
    if (socket && incomingCall && currentUser) {
      setActiveLiveCall({
        partnerId: incomingCall.callerId,
        sessionToken: incomingCall.sessionToken,
        status: 'CONNECTED',
      });
      socket.emit('call_accept', {
        callerId: incomingCall.callerId,
        targetUserId: currentUser.id,
        sessionToken: incomingCall.sessionToken,
      });
      setIncomingCall(null);
    }
  };

  const rejectIncomingCall = () => {
    if (socket && incomingCall && currentUser) {
      socket.emit('call_reject', {
        callerId: incomingCall.callerId,
        targetUserId: currentUser.id,
      });
      setIncomingCall(null);
    }
  };

  const endLiveCall = (partnerId: string) => {
    if (socket) {
      socket.emit('call_terminate', { targetUserId: partnerId });
    }
    setActiveLiveCall(null);
    setIncomingCall(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUserIds,
        typingUsers,
        incomingCall,
        activeLiveCall,
        sendRealtimeMessage,
        sendTypingSignal,
        broadcastFinancialUpdate,
        broadcastOrderUpdate,
        initiateCall,
        acceptIncomingCall,
        rejectIncomingCall,
        endLiveCall,
        lastFinancialUpdate,
        lastOrderUpdate,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
