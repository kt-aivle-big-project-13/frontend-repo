import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { message } from 'antd';

import { useAuthStore } from '../../../entities/user/model/authStore';
import MainLayout from '../../../widgets/layout/ui/MainLayout';
import {
  createPost,
  fetchPost,
  updatePost,
  type Attachment,
} from '../../../features/board/api/boardApi';

import './BoardFormPage.css';

const MAX_ATTACHMENTS = 5;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function BoardFormPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';
  const isEditMode = Boolean(postId);
  const numericPostId = Number(postId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [deleteAttachmentIds, setDeleteAttachmentIds] = useState<number[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditMode || !isAdmin) {
      return;
    }

    fetchPost(numericPostId)
      .then((post) => {
        setTitle(post.title);
        setContent(post.content);
        setExistingAttachments(post.attachments);
      })
      .catch(() => {
        message.error('공지사항을 불러오지 못했습니다.');
        navigate('/board');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isEditMode, numericPostId, isAdmin, navigate]);

  const remainingSlots =
    MAX_ATTACHMENTS - (existingAttachments.length - deleteAttachmentIds.length) - newFiles.length;

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) return;

    if (selected.length > remainingSlots) {
      message.error(`첨부파일은 최대 ${MAX_ATTACHMENTS}개까지 등록할 수 있습니다.`);
      event.target.value = '';
      return;
    }

    setNewFiles((prev) => [...prev, ...selected]);
    event.target.value = '';
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const toggleDeleteExisting = (attachmentId: number) => {
    setDeleteAttachmentIds((prev) =>
      prev.includes(attachmentId)
        ? prev.filter((id) => id !== attachmentId)
        : [...prev, attachmentId],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (isEditMode) {
        const updated = await updatePost(numericPostId, {
          title: title.trim(),
          content: content.trim(),
          files: newFiles,
          deleteAttachmentIds,
        });
        message.success('공지사항이 수정되었습니다.');
        navigate(`/board/${updated.id}`);
      } else {
        const created = await createPost({
          title: title.trim(),
          content: content.trim(),
          files: newFiles,
        });
        message.success('공지사항이 등록되었습니다.');
        navigate(`/board/${created.id}`);
      }
    } catch {
      setError('공지사항 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="board-form-page">
        {!user ? (
          <p className="board-form-page__denied" role="alert">
            로그인이 필요합니다.
          </p>
        ) : !isAdmin ? (
          <p className="board-form-page__denied" role="alert">
            공지사항은 관리자만 작성하거나 수정할 수 있습니다.
          </p>
        ) : isLoading ? (
          <p className="board-form-page__loading">불러오는 중...</p>
        ) : (
          <>
            <h1 className="board-form-page__title">
              {isEditMode ? '공지사항 수정' : '공지사항 작성'}
            </h1>

            <form className="board-form-page__form" onSubmit={handleSubmit}>
              <div className="board-form-page__field">
                <label htmlFor="board-form-title">제목</label>
                <input
                  id="board-form-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="제목을 입력하세요"
                  maxLength={200}
                  disabled={isSubmitting}
                />
              </div>

              <div className="board-form-page__field">
                <label htmlFor="board-form-content">내용</label>
                <textarea
                  id="board-form-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="내용을 입력하세요"
                  rows={14}
                  disabled={isSubmitting}
                />
              </div>

              <div className="board-form-page__field">
                <label htmlFor="board-form-files">첨부파일 (최대 {MAX_ATTACHMENTS}개)</label>

                {existingAttachments.length > 0 && (
                  <ul className="board-form-page__file-list">
                    {existingAttachments.map((attachment) => {
                      const markedForDelete = deleteAttachmentIds.includes(attachment.id);

                      return (
                        <li
                          key={attachment.id}
                          className={markedForDelete ? 'board-form-page__file--removed' : undefined}
                        >
                          <span>{attachment.originalName}</span>
                          <span className="board-form-page__file-size">
                            {formatFileSize(attachment.size)}
                          </span>
                          <button type="button" onClick={() => toggleDeleteExisting(attachment.id)}>
                            {markedForDelete ? '삭제 취소' : '삭제'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {newFiles.length > 0 && (
                  <ul className="board-form-page__file-list">
                    {newFiles.map((file, index) => (
                      <li key={`${file.name}-${index}`}>
                        <span>{file.name}</span>
                        <span className="board-form-page__file-size">
                          {formatFileSize(file.size)}
                        </span>
                        <button type="button" onClick={() => removeNewFile(index)}>
                          삭제
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <input
                  id="board-form-files"
                  type="file"
                  multiple
                  onChange={handleFilesChange}
                  disabled={isSubmitting || remainingSlots <= 0}
                />
              </div>

              {error && (
                <p className="board-form-page__error" role="alert">
                  {error}
                </p>
              )}

              <div className="board-form-page__actions">
                <button
                  type="button"
                  className="board-form-page__cancel"
                  onClick={() => navigate(isEditMode ? `/board/${numericPostId}` : '/board')}
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button type="submit" className="board-form-page__submit" disabled={isSubmitting}>
                  {isSubmitting ? '저장 중...' : isEditMode ? '수정하기' : '등록하기'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default BoardFormPage;
