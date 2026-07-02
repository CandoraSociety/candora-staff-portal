import { Mail, MessageSquare, FileText, Table, Presentation } from 'lucide-react';

export const MICROSOFT_APPS = [
  { id: 'outlook', label: 'Outlook', icon: Mail, color: '#0078D4' },
  { id: 'teams', label: 'Teams', icon: MessageSquare, color: '#5059C9' },
  { id: 'word', label: 'New Word', icon: FileText, color: '#2B579A' },
  { id: 'excel', label: 'New Excel', icon: Table, color: '#217346' },
  { id: 'powerpoint', label: 'New PowerPoint', icon: Presentation, color: '#D24726' },
];

export const DEFAULT_MS_APP_IDS = MICROSOFT_APPS.map(a => a.id);