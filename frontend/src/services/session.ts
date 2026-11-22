export type SessionUser = {
  firstName: string;
  lastName: string;
  role?: string;
};

const roleLabels: Record<string, string> = {
  admin: 'Адміністратор',
  dispatcher: 'Диспетчер',
  logistician: 'Логіст',
  driver: 'Водій',
  user: 'Клієнт',
  mechanic: 'Механік',
  cashier: 'Касир',
};

export function getCurrentUser(): SessionUser | null {
  try {
    const value = localStorage.getItem('currentUser');
    return value ? JSON.parse(value) as SessionUser : null;
  } catch {
    return null;
  }
}

export function getRoleLabel(role?: string): string {
  return role ? roleLabels[role] ?? role : 'Користувач';
}

export function getUserInitials(user: SessionUser | null): string {
  return `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toLocaleUpperCase('uk-UA') || 'К';
}
