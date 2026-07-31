import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Empty, Popover, Spin } from 'antd';
import { BellOutlined } from '@ant-design/icons';

import {
  clearAllNotifications,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '../../../features/notifications/api/notificationApi';
import { getViewedAuditResultIds } from '../../../features/audit/model/viewedAuditResults';

import './NotificationBell.css';

const UNREAD_COUNT_POLL_MS = 30000;

function formatSentAt(value: string): string {
  return new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // 초기화(전체 삭제)로 로컬 상태를 비운 시점보다 먼저 나간 목록·안읽음 개수 조회가
  // 늦게 도착해 방금 비운 상태를 다시 채우는 것을 막기 위한 세대 값이다. 조회 시작 시점의
  // epoch을 캡처해두고, 응답이 왔을 때 그 사이에 초기화가 일어나지 않았는지 확인한다.
  const dataEpochRef = useRef(0);

  const refreshUnreadCount = useCallback(() => {
    const epoch = dataEpochRef.current;
    fetchUnreadNotificationCount()
      .then((count) => {
        if (dataEpochRef.current === epoch) setUnreadCount(count);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnreadCount();

    const timer = window.setInterval(refreshUnreadCount, UNREAD_COUNT_POLL_MS);
    return () => window.clearInterval(timer);
  }, [refreshUnreadCount]);

  const loadNotifications = useCallback(() => {
    setIsLoading(true);
    const epoch = dataEpochRef.current;

    fetchNotifications(1, 10)
      .then((response) => {
        if (dataEpochRef.current === epoch) setNotifications(response.content);
      })
      .catch(() => {
        if (dataEpochRef.current === epoch) setNotifications([]);
      })
      .finally(() => {
        if (dataEpochRef.current === epoch) setIsLoading(false);
      });
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open) {
      loadNotifications();
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await markNotificationRead(item.id);

        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === item.id
              ? { ...notification, isRead: true }
              : notification,
          ),
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      } catch {
        // 읽음 처리 실패는 조용히 무시한다 - 다음 폴링에서 배지 정합성이 복구된다.
      }
    }

    if (item.auditId !== null) {
      setIsOpen(false);
      // "결과 확인"을 이미 눌러본 감사면 STEP4(결과)로, 아직이면 STEP3(체크리스트)로 보낸다.
      const destination = getViewedAuditResultIds().has(item.auditId)
        ? `/audit/${item.auditId}/results`
        : `/audit/${item.auditId}`;
      navigate(destination);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
      setUnreadCount(0);
    } catch {
      // no-op
    }
  };

  const handleClearAll = async () => {
    if (isClearing) return;
    setIsClearing(true);

    try {
      await clearAllNotifications();

      // 진행 중이던(초기화 이전에 나간) 목록·안읽음 개수 조회 응답이 뒤늦게 도착해
      // 방금 비운 상태를 덮어쓰지 않도록 세대를 올려 무효화한다.
      dataEpochRef.current += 1;
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // no-op
    } finally {
      setIsClearing(false);
    }
  };

  const panel = (
    <div className="notification-bell__panel">
      <div className="notification-bell__panel-header">
        <span>알림</span>
        <div className="notification-bell__panel-actions">
          <button
            type="button"
            className="notification-bell__mark-all"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            모두 읽음
          </button>
          <button
            type="button"
            className="notification-bell__clear-all"
            onClick={handleClearAll}
            disabled={notifications.length === 0 || isClearing}
          >
            초기화
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="notification-bell__loading">
          <Spin size="small" />
        </div>
      ) : notifications.length === 0 ? (
        <Empty
          description="알림이 없습니다"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <ul className="notification-bell__list">
          {notifications.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`notification-bell__item${
                  item.isRead ? '' : ' notification-bell__item--unread'
                }`}
                onClick={() => handleItemClick(item)}
              >
                <span className="notification-bell__item-title">
                  {item.title}
                </span>
                <span className="notification-bell__item-message">
                  {item.message}
                </span>
                <span className="notification-bell__item-time">
                  {formatSentAt(item.sentAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Popover
      content={panel}
      trigger="click"
      open={isOpen}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
      arrow={false}
    >
      <button type="button" className="notification-bell__trigger" aria-label="알림">
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <BellOutlined style={{ fontSize: 20 }} />
        </Badge>
      </button>
    </Popover>
  );
}

export default NotificationBell;