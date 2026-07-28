import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Modal, message } from 'antd';

import { useAuthStore } from '../../../entities/user/model/authStore';
import MainLayout from '../../../widgets/layout/ui/MainLayout';
import {
  createComment,
  deleteComment,
  deletePost,
  downloadAttachment,
  fetchComments,
  fetchPost,
  pinPost,
  updateComment,
  type Attachment,
  type Comment,
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

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(
    null,
  );
  const [editingCommentContent, setEditingCommentContent] = useState('');

  const loadPost = useCallback(() => {
    if (!user || !numericPostId) return;

    Promise.all([fetchPost(numericPostId), fetchComments(numericPostId)])
      .then(([postResponse, commentsResponse]) => {
        setPost(postResponse);
        setComments(commentsResponse);
      })
      .catch(() => {
        message.error('게시글을 불러오지 못했습니다.');
        navigate('/board');
      });
  }, [user, numericPostId, navigate]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const isMine = !!(user && post && post.authorId === user.id);
  const canEdit = isMine || isAdmin;

  const handleDeletePost = () => {
    if (!post) return;

    Modal.confirm({
      title: '게시글 삭제',
      content: '게시글을 삭제하면 되돌릴 수 없습니다. 삭제하시겠습니까?',
      okText: '삭제',
      cancelText: '취소',
      okButtonProps: { danger: true },
      centered: true,
      async onOk() {
        try {
          await deletePost(post.id);
          message.success('게시글이 삭제되었습니다.');
          navigate('/board');
        } catch {
          message.error('게시글 삭제에 실패했습니다.');
        }
      },
    });
  };

  const handleTogglePin = async () => {
    if (!post) return;

    try {
      const updated = await pinPost(post.id, !post.pinned);
      setPost(updated);
      message.success(
        updated.pinned ? '공지로 고정했습니다.' : '공지 고정을 해제했습니다.',
      );
    } catch {
      message.error('공지 설정에 실패했습니다.');
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    if (!post) return;

    try {
      await downloadAttachment(post.id, attachment);
    } catch {
      message.error('파일 다운로드에 실패했습니다.');
    }
  };

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!post || !commentInput.trim()) return;

    try {
      setIsSubmittingComment(true);
      const comment = await createComment(post.id, commentInput.trim());
      setComments((prev) => [...prev, comment]);
      setCommentInput('');
    } catch {
      message.error('댓글 등록에 실패했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!post || !editingCommentContent.trim()) return;

    try {
      const updated = await updateComment(
        post.id,
        commentId,
        editingCommentContent.trim(),
      );
      setComments((prev) =>
        prev.map((comment) => (comment.id === commentId ? updated : comment)),
      );
      cancelEditComment();
    } catch {
      message.error('댓글 수정에 실패했습니다.');
    }
  };

  const handleDeleteComment = (commentId: number) => {
    if (!post) return;

    Modal.confirm({
      title: '댓글 삭제',
      content: '댓글을 삭제하시겠습니까?',
      okText: '삭제',
      cancelText: '취소',
      okButtonProps: { danger: true },
      centered: true,
      async onOk() {
        try {
          await deleteComment(post.id, commentId);
          setComments((prev) =>
            prev.filter((comment) => comment.id !== commentId),
          );
        } catch {
          message.error('댓글 삭제에 실패했습니다.');
        }
      },
    });
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
              {post.pinned && (
                <span className="board-detail-page__badge">공지</span>
              )}
              <h1 className="board-detail-page__title">{post.title}</h1>

              <div className="board-detail-page__meta">
                <span>{post.authorName}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDateTime(post.createdAt)}</span>
              </div>
            </header>

            <div className="board-detail-page__actions">
              {isAdmin && (
                <button
                  type="button"
                  className="board-detail-page__action"
                  onClick={handleTogglePin}
                >
                  {post.pinned ? '공지 해제' : '공지로 지정'}
                </button>
              )}

              {canEdit && (
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
                      <button
                        type="button"
                        onClick={() => handleDownload(attachment)}
                      >
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

            <section className="board-detail-page__comments">
              <h2 className="board-detail-page__section-title">
                댓글 {comments.length}개
              </h2>

              {comments.length === 0 ? (
                <p className="board-detail-page__no-comments">
                  등록된 댓글이 없습니다.
                </p>
              ) : (
                <ul className="board-detail-page__comment-list">
                  {comments.map((comment) => (
                    <li key={comment.id} className="board-detail-page__comment">
                      {editingCommentId === comment.id ? (
                        <div className="board-detail-page__comment-edit">
                          <textarea
                            value={editingCommentContent}
                            onChange={(event) =>
                              setEditingCommentContent(event.target.value)
                            }
                            rows={2}
                          />
                          <div className="board-detail-page__comment-edit-actions">
                            <button
                              type="button"
                              onClick={() => handleUpdateComment(comment.id)}
                            >
                              저장
                            </button>
                            <button type="button" onClick={cancelEditComment}>
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="board-detail-page__comment-head">
                            <span className="board-detail-page__comment-author">
                              {comment.authorName}
                              <span className="board-detail-page__admin-badge">
                                관리자
                              </span>
                            </span>
                            <span className="board-detail-page__comment-date">
                              {formatDateTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="board-detail-page__comment-content">
                            {comment.content}
                          </p>
                          {isAdmin && (
                            <div className="board-detail-page__comment-actions">
                              <button
                                type="button"
                                onClick={() => startEditComment(comment)}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {isAdmin ? (
                <form
                  className="board-detail-page__comment-form"
                  onSubmit={handleCommentSubmit}
                >
                  <textarea
                    placeholder="관리자 답변을 입력하세요"
                    value={commentInput}
                    onChange={(event) => setCommentInput(event.target.value)}
                    rows={3}
                    disabled={isSubmittingComment}
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentInput.trim()}
                  >
                    {isSubmittingComment ? '등록 중...' : '댓글 등록'}
                  </button>
                </form>
              ) : (
                <p className="board-detail-page__comment-notice">
                  댓글은 관리자만 작성할 수 있습니다.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default BoardDetailPage;