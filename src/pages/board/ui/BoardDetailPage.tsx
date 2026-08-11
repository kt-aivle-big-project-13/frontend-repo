import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Modal, message } from 'antd';

import { useAuthStore } from '../../../entities/user/model/authStore';
import MainLayout from '../../../widgets/layout/ui/MainLayout';
import {
  deletePost,
  downloadAttachment,
  fetchPost,
  type Attachment,
  type PostDetail,
} from '../../../features/board/api/boardApi';

import './BoardDetailPage.css';

function formatDateTime(value: string) {
  return value.replace('T', ' ').slice(0, 16);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function BoardDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  const numericPostId = Number(postId);
  const isValidPostId = Number.isInteger(numericPostId) && numericPostId > 0;

  const [post, setPost] = useState<PostDetail | null>(null);

  const loadPost = useCallback(() => {
    if (!user) return;
    if (!isValidPostId) {
      navigate('/board', { replace: true });
      return;
    }

    fetchPost(numericPostId)
      .then(setPost)
      .catch(() => {
        message.error('공지사항을 불러오지 못했습니다.');
        navigate('/board');
      });
  }, [user, isValidPostId, numericPostId, navigate]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleDeletePost = () => {
    if (!post) return;

    Modal.confirm({
      title: '공지사항 삭제',
      content: '공지사항을 삭제하면 되돌릴 수 없습니다. 삭제하시겠습니까?',
      okText: '삭제',
      cancelText: '취소',
      okButtonProps: { danger: true },
      centered: true,
      async onOk() {
        try {
          await deletePost(post.id);
          message.success('공지사항이 삭제되었습니다.');
          navigate('/board');
        } catch {
          message.error('공지사항 삭제에 실패했습니다.');
        }
      },
    });
  };

  const handleDownload = async (attachment: Attachment) => {
    if (!post) return;

    try {
      await downloadAttachment(post.id, attachment);
    } catch {
      message.error('파일 다운로드에 실패했습니다.');
    }
  };

  return (
    <MainLayout>
      <div className="board-detail-page">
        {!user ? (
          <p className="board-detail-page__denied" role="alert">
            로그인이 필요합니다.
          </p>
        ) : !post ? (
          <p className="board-detail-page__loading">불러오는 중...</p>
        ) : (
          <>
            <div className="board-detail-page__back-row">
              <Link to="/board" className="board-detail-page__back">
                목록으로
              </Link>
            </div>

            <header className="board-detail-page__header">
              <h1 className="board-detail-page__title">{post.title}</h1>

              <div className="board-detail-page__meta">
                <span>{post.authorName}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDateTime(post.createdAt)}</span>
              </div>
            </header>

            <div className="board-detail-page__actions">
              {isAdmin && (
                <>
                  <button
                    type="button"
                    className="board-detail-page__action"
                    onClick={() => navigate(`/board/${post.id}/edit`)}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="board-detail-page__action board-detail-page__action--danger"
                    onClick={handleDeletePost}
                  >
                    삭제
                  </button>
                </>
              )}
            </div>

            <div className="board-detail-page__content">{post.content}</div>

            {post.attachments.length > 0 && (
              <div className="board-detail-page__attachments">
                <h2 className="board-detail-page__section-title">
                  첨부파일 {post.attachments.length}개
                </h2>
                <ul>
                  {post.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <button type="button" onClick={() => handleDownload(attachment)}>
                        {attachment.originalName}
                      </button>
                      <span className="board-detail-page__file-size">
                        {formatFileSize(attachment.size)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default BoardDetailPage;
