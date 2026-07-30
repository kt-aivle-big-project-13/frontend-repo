import { apiClient } from '../../../shared/api/client';

export type NotificationType =
  | 'LAW_REVISION'
  | 'REAUDIT_RECOMMEND'
  | 'AUDIT_COMPLETE';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string;
  auditId: number | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export async function fetchNotifications(
  page = 1,
  size = 10,
): Promise<PageResponse<NotificationItem>> {
  const { data } = await apiClient.get<PageResponse<NotificationItem>>(
    '/notifications',
    { params: { page, size } },
  );
  return data;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<UnreadCountResponse>(
    '/notifications/unread-count',
  );
  return data.unreadCount;
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  await apiClient.patch(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}