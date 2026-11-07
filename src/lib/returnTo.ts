import type { NavigateFunction } from 'react-router-dom';

/** Remember the mobile tab to reopen when the user comes back from a sub-page. */
export function rememberReturnTab(tab: string) {
  try { sessionStorage.setItem('sapsap_force_tab', tab); } catch { /* noop */ }
}

/** Go back to where the user came from; fall back to the homepage. */
export function goBack(navigate: NavigateFunction) {
  const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
  if (idx > 0) navigate(-1); else navigate('/');
}
