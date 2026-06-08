export const appParams = {
  appId: import.meta.env.VITE_BASE44_APP_ID || '',
  token: localStorage.getItem('base44_token') || '',
};