import { User, UserRole } from '@/types';

/**
 * STRICT PRIVACY & ANTI-BYPASS ENFORCEMENT ENGINE
 * 
 * Protects users from platform circumvention and contact leakage:
 * - Detects Indian (10-digit, +91, spaced, hyphenated, dotted) and international phone numbers
 * - Detects text/spelled out numbers ("nine eight...", "call me 9 8 7...")
 * - Detects email addresses (RFC + obfuscated "name [at] domain [dot] com")
 * - Detects social handles and external links (wa.me, WhatsApp, Telegram, Instagram, Discord, Skype)
 */

export interface SecurityScanResult {
  isViolating: boolean;
  sanitizedContent: string;
  originalContent: string;
  detectedTypes: ('PHONE' | 'EMAIL' | 'EXTERNAL_HANDLE')[];
  flagReasons: string[];
  warningMessage?: string;
}

// Regex definitions
const PHONE_REGEXES = [
  // 10-digit standard Indian mobile formats with optional +91/0 and optional spaces/dashes/dots
  /(?:\+?91[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}\b/gi,
  /(?:\+?91[\s.-]?)?[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/gi,
  /\b[6-9]\d{9}\b/g,
  // Generic phone numbers with brackets and hyphens: (123) 456-7890 or 123-456-7890
  /\b(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  // Obfuscated spaced single digits: e.g. "9 8 7 6 5 4 3 2 1 0"
  /\b(?:[6-9][\s_.-]*\d[\s_.-]*\d[\s_.-]*\d[\s_.-]*\d[\s_.-]*\d[\s_.-]*\d[\s_.-]*\d[\s_.-]*\d[\s_.-]*\d)\b/g,
  // Spelled out number sequences: "call 987...", "call nine eight..."
  /\b(?:nine|eight|seven|six|five|four|three|two|one|zero)[\s,]+(?:nine|eight|seven|six|five|four|three|two|one|zero)[\s,]+(?:nine|eight|seven|six|five|four|three|two|one|zero)/gi,
];

const EMAIL_REGEXES = [
  // Standard RFC email
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi,
  // Obfuscated emails: e.g., "name [at] gmail [dot] com" or "name(at)yahoo(dot)com"
  /\b[A-Za-z0-9._%+-]+\s*(?:\[at\]|\(at\)|\sat\s|@)\s*[A-Za-z0-9.-]+\s*(?:\[dot\]|\(dot\)|\sdot\s|\.)\s*(?:com|org|net|in|co|edu|io)\b/gi,
];

const EXTERNAL_HANDLE_REGEXES = [
  // WhatsApp links / keywords
  /(?:wa\.me\/\S*|whatsapp(?:\.com)?|whatsapp\s*me|ping\s*me\s*on\s*whatsapp)/gi,
  // Telegram links / keywords
  /(?:t\.me\/\S*|telegram(?:\.org)?|ping\s*on\s*telegram|tele\s*id)/gi,
  // Instagram
  /(?:instagram\.com\/\S*|insta\s*id|ig\s*handle|ig\s*:\s*@?\w+)/gi,
  // Discord / Skype / Snapchat
  /(?:discord\.gg\/\S*|discord(?:\.com)?|skype\s*id|snapchat|snap\s*id)/gi,
  // Direct @ handle solicitation e.g. "DM me @username" or "hit me on @..."
  /(?:dm|text|message|ping|contact|call|reach)\s*(?:me\s*)?(?:at|on)?\s*@[a-zA-Z0-9._]{3,30}\b/gi,
];

/**
 * Real-time content scanner & anti-bypass sanitizer
 */
export function scanAndSanitizeMessage(content: string): SecurityScanResult {
  let sanitized = content;
  const detectedTypes: ('PHONE' | 'EMAIL' | 'EXTERNAL_HANDLE')[] = [];
  const flagReasons: string[] = [];

  // 1. Check for Phone numbers
  for (const regex of PHONE_REGEXES) {
    regex.lastIndex = 0;
    if (regex.test(sanitized)) {
      if (!detectedTypes.includes('PHONE')) detectedTypes.push('PHONE');
      flagReasons.push('Mobile number or phone sequence detected');
      regex.lastIndex = 0;
      sanitized = sanitized.replace(regex, '[REDACTED PHONE NUMBER - PRIVACY POLICY]');
    }
  }

  // 2. Check for Emails
  for (const regex of EMAIL_REGEXES) {
    regex.lastIndex = 0;
    if (regex.test(sanitized)) {
      if (!detectedTypes.includes('EMAIL')) detectedTypes.push('EMAIL');
      flagReasons.push('Email address detected');
      regex.lastIndex = 0;
      sanitized = sanitized.replace(regex, '[REDACTED EMAIL ADDRESS - PRIVACY POLICY]');
    }
  }

  // 3. Check for External Handles and Links
  for (const regex of EXTERNAL_HANDLE_REGEXES) {
    regex.lastIndex = 0;
    if (regex.test(sanitized)) {
      if (!detectedTypes.includes('EXTERNAL_HANDLE')) detectedTypes.push('EXTERNAL_HANDLE');
      flagReasons.push('External messenger handle or social link detected');
      regex.lastIndex = 0;
      sanitized = sanitized.replace(regex, '[REDACTED EXTERNAL LINK/HANDLE]');
    }
  }

  const isViolating = detectedTypes.length > 0;
  
  return {
    isViolating,
    originalContent: content,
    sanitizedContent: sanitized,
    detectedTypes,
    flagReasons,
    warningMessage: isViolating
      ? 'For your safety and platform warranty, sharing personal contact details (phone numbers, emails, or social handles) is strictly prohibited. Your message has been sanitized.'
      : undefined,
  };
}

/**
 * Strip sensitive contact info from User payloads based on viewer role
 * Students never see Expert's personal phone or email.
 * Experts never see Student's personal phone or email.
 * Only Admins can see raw contact info for verified auditing.
 */
export function sanitizeUserForViewer(targetUser: User, viewerRole: UserRole): Partial<User> {
  if (viewerRole === 'ADMIN') {
    return targetUser; // Admin has full audit oversight
  }

  // Masked view for Student / Expert
  return {
    id: targetUser.id,
    name: targetUser.role === 'STUDENT'
      ? `${targetUser.name.split(' ')[0]} (Student ${targetUser.maskedId})`
      : `${targetUser.name} (${targetUser.maskedId})`,
    role: targetUser.role,
    avatar: targetUser.avatar,
    createdAt: targetUser.createdAt,
    maskedId: targetUser.maskedId,
    email: '••••••••••@masked.platform.safe',
    phone: '+91 ••••• •••••',
  };
}

/**
 * Generate a randomized safe session ID for simulated WebRTC/masked call
 */
export function generateMaskedCallSessionId(callerId: string, receiverId: string): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CALL-SECURE-${rand}`;
}
