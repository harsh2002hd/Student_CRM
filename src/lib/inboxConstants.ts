import { QuickReply, MessageTemplate, LeadTag } from '@/types';

export const INITIAL_QUICK_REPLIES: QuickReply[] = [
  {
    id: 'qr_1',
    title: 'Welcome & Greeting',
    shortcut: '/hello',
    category: 'Greeting',
    text: 'Hello! Welcome to M1 Company. How can our academic specialists help you with your coursework or assignment today?',
  },
  {
    id: 'qr_2',
    title: 'Request Syllabus & Rubric',
    shortcut: '/rubric',
    category: 'Intake',
    text: 'Could you please upload your assignment prompt, rubric guidelines, and any specific starter files or test cases?',
  },
  {
    id: 'qr_3',
    title: 'Solution Delivery Ready',
    shortcut: '/delivered',
    category: 'Delivery',
    text: "I have uploaded your verified solution and notes to this thread. Please download the attachment and let me know if you'd like any walkthrough!",
  },
  {
    id: 'qr_4',
    title: 'Escrow Milestone Funding',
    shortcut: '/escrow',
    category: 'Billing',
    text: 'To activate priority mentor matching and start work on your query, please complete the secure escrow payment using the order checkout above.',
  },
  {
    id: 'qr_5',
    title: 'Platform Privacy Reminder',
    shortcut: '/privacy',
    category: 'Policy',
    text: 'For your security and platform quality guarantee, all communications and files must remain strictly within the M1 Company encrypted portal.',
  },
  {
    id: 'qr_6',
    title: 'Lead Follow-up Check',
    shortcut: '/checkin',
    category: 'Follow-up',
    text: 'Just checking in on your recent academic query. Are you still looking for mentorship on this topic? We have PhD specialists available right now.',
  },
];

export const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl_1',
    name: 'Assignment Intake Form',
    category: 'Onboarding',
    description: 'Standard technical questionnaire for new student requests',
    content: `📋 **M1 Company Assignment Intake**
• **University Course:** [e.g., CS229 / MATH301]
• **Submission Deadline:** [Date & Time with Timezone]
• **Programming Language / Tools:** [e.g., Python / LaTeX / MATLAB]
• **Specific Deliverables:** [Code, Report PDF, or Derivation]
• **Budget Expectation:** [Standard / Express]`,
  },
  {
    id: 'tpl_2',
    name: 'Solution Delivery & Integrity Note',
    category: 'Delivery',
    description: 'Final submission message with academic integrity clearance',
    content: `✅ **Milestone Solution Complete**
Dear Student,
Your solution has been carefully prepared by our specialist according to your rubric.
• **Files Attached:** Derivations & Executable Scripts
• **Integrity Check:** Original Work • Zero Plagiarism Guarantee
Please review the delivered files and click "Confirm & Complete Order" in the top bar when satisfied.`,
  },
  {
    id: 'tpl_3',
    name: 'Lead Reconnect (Closed Lead)',
    category: 'Re-engagement',
    description: 'Re-open communication for previous students or leads',
    content: `👋 **Hi there! Following up from M1 Company**
We noticed you previously inquired about coursework support. Our department has opened priority review slots for this semester. Would you like us to review your upcoming homework or project proposal today?`,
  },
];

export const INITIAL_LEAD_TAGS: LeadTag[] = [
  { id: 'tag_1', name: 'lead_reconnect', color: '#10b981', bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'tag_2', name: 'VIP Lead', color: '#8b5cf6', bgClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'tag_3', name: 'urgent_review', color: '#ef4444', bgClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'tag_4', name: 'Computer Science', color: '#0284c7', bgClass: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'tag_5', name: 'Mathematics', color: '#f59e0b', bgClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'tag_6', name: 'Unassigned', color: '#64748b', bgClass: 'bg-slate-100 text-slate-700 border-slate-200' },
];
