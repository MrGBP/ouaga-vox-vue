/** Navigation only: route guards and database policies enforce access. */
export function accountNavigation(isOwner: boolean, isAdmin = false) {
  return [
    ...(isAdmin ? [{ path: '/admin', label: 'Administration', icon: 'admin' as const }] : []),
    { path: '/mon-compte', label: 'Mon compte', icon: 'account' as const },
    { path: '/mon-compte?tab=sejours', label: 'Mes séjours et reçus', icon: 'calendar' as const },
    { path: '/notifications', label: 'Notifications', icon: 'bell' as const },
    ...(isOwner ? [
      { path: '/proprietaire', label: 'Espace propriétaire', icon: 'dashboard' as const },
      { path: '/proprietaire/biens', label: 'Mes biens', icon: 'home' as const },
      { path: '/proprietaire/reservations', label: 'Réservations et visites', icon: 'calendar' as const },
      { path: '/proprietaire/messages', label: 'Messages', icon: 'messages' as const },
    ] : []),
  ];
}
