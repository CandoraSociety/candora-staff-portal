export const CATEGORY_LABELS = {
  marketing: 'Marketing',
  board: 'Board',
  grants: 'Grants',
  events: 'Events',
  ed: 'Executive Director',
  general: 'General',
};

export const CATEGORY_COLORS = {
  marketing: '#2b2de8',
  board: '#0f1f6b',
  grants: '#f5c116',
  events: '#10b981',
  ed: '#8b5cf6',
  general: '#6b7280',
};

export const LAYOUT_LABELS = {
  title: 'Title Slide',
  section: 'Section Divider',
  title_content: 'Title + Content',
  title_image: 'Title + Image',
  title_content_image: 'Title + Content + Image',
};

export const genId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

export function newSlide(layout = 'title_content') {
  return {
    id: genId(),
    layout,
    title: '',
    content: '',
    image_url: '',
    notes: '',
  };
}