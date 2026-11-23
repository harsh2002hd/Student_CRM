const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const hasProductionBuild = fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID'));
const dev = process.env.NODE_ENV === 'development' ? true : (process.env.NODE_ENV === 'production' ? false : !hasProductionBuild);
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

// Simple database helper for socket events
const dbPath = path.join(__dirname, 'src', 'data', 'db.json');

function getDbData() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    }
  } catch (e) {
    console.warn('Error reading db.json in server.js', e);
  }
  return null;
}

function saveDbData(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving db.json in server.js', e);
  }
}

// Security scanner for sockets
const HANDLE_REGEXES = [
  /(?:https?:\/\/)?(?:wa\.me\/\S*|whatsapp(?:\.com\/\S*)?|whatsapp\s*(?:me|number)?)/gi,
  /(?:https?:\/\/)?(?:t\.me\/\S*|telegram(?:\.org\/\S*)?|ping\s*on\s*telegram|tele\s*id)/gi,
  /(?:https?:\/\/)?(?:instagram\.com\/\S*|insta\s*id|ig\s*handle|ig\s*:\s*@?\w+)/gi,
  /(?:https?:\/\/)?(?:discord\.gg\/\S*|discord(?:\.com\/\S*)?|skype\s*id|snapchat|snap\s*id)/gi,
  /(?:dm|text|message|ping|contact|call|reach)\s*(?:me\s*)?(?:at|on)?\s*@[a-zA-Z0-9._]{3,30}\b/gi,
];

const EMAIL_REGEXES = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi,
  /\b[A-Za-z0-9._%+-]+\s*(?:\[at\]|\(at\)|\sat\s|@)\s*[A-Za-z0-9.-]+\s*(?:\[dot\]|\(dot\)|\sdot\s|\.)\s*(?:com|org|net|in|co|edu|io)\b/gi,
];

const PHONE_REGEXES = [
  /(?:\+\s*)?(?:91[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}\b/gi,
  /(?:\+\s*)?(?:91[\s.-]?)?[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/gi,
  /\b[6-9]\d{9}\b/g,
  /(?:\+\s*)?(?:\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  /\b(?:[6-9][\s_.-]*\d[\s_.-]*\d[\s_.-]*\d[\s_.-]*\d[\s_.-]*\d[\s_.-]*\d[\s_.-]*\d[\s_.-]*\d[\s_.-]*\d)\b/g,
];

function scanMessage(content) {
  let sanitized = content;
  const detectedTypes = [];

  // 1. Handles / URLs FIRST
  for (const r of HANDLE_REGEXES) {
    r.lastIndex = 0;
    if (r.test(sanitized)) {
      if (!detectedTypes.includes('EXTERNAL_HANDLE')) detectedTypes.push('EXTERNAL_HANDLE');
      r.lastIndex = 0;
      sanitized = sanitized.replace(r, '[REDACTED EXTERNAL LINK/HANDLE]');
    }
  }

  // 2. Emails SECOND
  for (const r of EMAIL_REGEXES) {
    r.lastIndex = 0;
    if (r.test(sanitized)) {
      if (!detectedTypes.includes('EMAIL')) detectedTypes.push('EMAIL');
      r.lastIndex = 0;
      sanitized = sanitized.replace(r, '[REDACTED EMAIL ADDRESS - PRIVACY POLICY]');
    }
  }

  // 3. Phones THIRD
  for (const r of PHONE_REGEXES) {
    r.lastIndex = 0;
    if (r.test(sanitized)) {
      if (!detectedTypes.includes('PHONE')) detectedTypes.push('PHONE');
      r.lastIndex = 0;
      sanitized = sanitized.replace(r, '[REDACTED PHONE NUMBER - PRIVACY POLICY]');
    }
  }

  // Deduplicate consecutive identical redactions
  sanitized = sanitized.replace(/(?:\[REDACTED EXTERNAL LINK\/HANDLE\][\s,]*)+/g, '[REDACTED EXTERNAL LINK/HANDLE] ');
  sanitized = sanitized.replace(/(?:\[REDACTED PHONE NUMBER - PRIVACY POLICY\][\s,]*)+/g, '[REDACTED PHONE NUMBER - PRIVACY POLICY] ');
  sanitized = sanitized.replace(/(?:\[REDACTED EMAIL ADDRESS - PRIVACY POLICY\][\s,]*)+/g, '[REDACTED EMAIL ADDRESS - PRIVACY POLICY] ');

  return {
    isViolating: detectedTypes.length > 0,
    sanitized: sanitized.trim(),
    detectedTypes,
  };
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });
  global.io = io;

  // Online sockets map: userId -> socketId
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    // console.log(`[Socket Connected] ID: ${socket.id}`);

    // Register active user
    socket.on('register_user', ({ userId, role, name }) => {
      if (userId) {
        socket.userId = userId;
        socket.userName = name;
        socket.userRole = role;
        onlineUsers.set(userId, socket.id);
        io.emit('online_users_list', Array.from(onlineUsers.keys()));
      }
    });

    // Join conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conv_${conversationId}`);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conv_${conversationId}`);
      }
    });

    // Real-time message dispatch with anti-bypass security
    socket.on('send_message', (payload) => {
      const { conversationId, senderId, senderRole, senderName, content, attachment } = payload;
      if (!conversationId || !senderId) return;

      socket.join(`conv_${conversationId}`);

      const scan = scanMessage(content || '');
      const messageId = `msg_${Date.now()}`;
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newMessage = {
        id: messageId,
        conversationId,
        senderId,
        senderRole,
        senderName,
        content: scan.sanitized,
        originalContent: scan.isViolating ? content : undefined,
        isFlagged: scan.isViolating,
        flagReason: scan.isViolating ? scan.detectedTypes.join(', ') : undefined,
        attachment,
        status: 'SENT',
        timestamp,
      };

      // Persist in db
      const dbData = getDbData();
      if (dbData) {
        dbData.messages.push(newMessage);
        const conv = dbData.conversations.find((c) => c.id === conversationId);
        if (conv) {
          conv.lastMessage = scan.sanitized || (attachment ? `📎 ${attachment.name}` : '');
          conv.lastMessageTime = timestamp;
          if (senderRole === 'STUDENT') conv.unreadCountExpert += 1;
          else conv.unreadCountStudent += 1;
        }

        if (scan.isViolating) {
          const flaggedItem = {
            id: `flg_${Date.now()}`,
            messageId,
            conversationId,
            senderId,
            senderRole,
            senderName,
            attemptedLeakType: scan.detectedTypes,
            flaggedText: content,
            redactedText: scan.sanitized,
            timestamp: new Date().toISOString(),
            status: 'PENDING_REVIEW',
          };
          dbData.flaggedMessages.unshift(flaggedItem);
          io.emit('flagged_incident_logged', {
            incident: flaggedItem,
            count: dbData.flaggedMessages.length,
          });
        }
        saveDbData(dbData);
      }

      // Broadcast to room instantly
      io.to(`conv_${conversationId}`).emit('receive_message', {
        message: newMessage,
        scanResult: scan,
      });

      // Broadcast snippet update to all clients
      io.emit('conversation_updated', {
        conversationId,
        lastMessage: newMessage.content,
        lastMessageTime: timestamp,
      });
    });

    // Typing indicators
    socket.on('typing_start', ({ conversationId, userId, userName }) => {
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        userName,
        isTyping: true,
      });
    });

    socket.on('typing_stop', ({ conversationId, userId }) => {
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // Real-time financial / escrow update broadcast
    socket.on('broadcast_financial_update', (payload) => {
      io.emit('realtime_financial_update', payload);
    });

    // Real-time order status update broadcast
    socket.on('broadcast_order_update', (payload) => {
      io.emit('realtime_order_update', payload);
    });

    // ================= REALTIME MASKED WEBRTC CALL SIGNALING =================
    socket.on('call_initiate', ({ callerId, callerName, targetUserId, sessionToken, callType }) => {
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('incoming_call_request', {
          callerId,
          callerName,
          sessionToken,
          callType: callType || 'AUDIO',
        });
      }
    });

    socket.on('call_accept', ({ callerId, targetUserId, sessionToken }) => {
      const callerSocketId = onlineUsers.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call_was_accepted', {
          targetUserId,
          sessionToken,
        });
      }
    });

    socket.on('call_reject', ({ callerId, targetUserId }) => {
      const callerSocketId = onlineUsers.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call_was_rejected', { targetUserId });
      }
    });

    socket.on('call_terminate', ({ targetUserId }) => {
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call_was_terminated');
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('online_users_list', Array.from(onlineUsers.keys()));
      }
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> M1 Company Global Enterprise Server Ready on http://localhost:${port}`);
    console.log(`> Mode: ${dev ? 'Development (Hot-Reload)' : 'Production (Optimized Pre-Compiled)'}`);
    console.log(`> Socket.io Real-time Messaging & Financial Sync Online on Port ${port}`);
  });
});
