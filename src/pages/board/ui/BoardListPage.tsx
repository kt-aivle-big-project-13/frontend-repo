import {
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';

import { useAuthStore } from '../../../entities/user/model/authStore';
import MainLayout from '../../../widgets/layout/ui/MainLayout';
import {
  fetchPosts,
  pinPost,
  type BoardSort,
  type PostSummary,
} from '../../../features/board/api/boardApi';

import './BoardListPage.css';

const PAGE_SIZE = 10;

function formatDate(value: string) {
  return value.slice(0, 10).replaceAll('-', '.');
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

function BoardPagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="board-list-page__pagination" aria-label="페이지 이동">
      <button
        type="button"
        className="board-list-page__page-nav"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        이전
      </button>

      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          className={
            pageNumber === page
              ? 'board-list-page__page board-list-page__page--active'
              : 'board-list-page__page'
          }
          onClick={() => onChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}

      <button
        type="button"
        className="board-list-page__page-nav"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        다음
      </button>
    </nav>
  );
}

function BoardListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const sort = (searchParams.get('sort') as BoardSort) || 'latest';
  const keywordParam = searchParams.get('keyword') ?? '';

  // keywordParam(URL)이 바뀌면 검색창도 맞춰준다. 렌더 중 상태를 조정하는
  // React 공식 패턴으로, effect를 쓰지 않아도 된다.
  const [prevKeywordParam, setPrevKeywordParam] = useState(keywordParam);
  const [keywordInput, setKeywordInput] = useState(keywordParam);
  if (keywordParam !== prevKeywordParam) {
    setPrevKeywordParam(keywordParam);
    setKeywordInput(keywordParam);
  }

  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const loadPosts = useCallback(() => {
    if (!user) return;

    fetchPosts({
      page,
      size: PAGE_SIZE,
      keyword: keywordParam || undefined,
      sort,
    })
      .then((response) => {
        setPosts(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      })
      .catch(() => {
        message.error('게시글 목록을 불러오지 못했습니다.');
      });
  }, [user, page, keywordParam, sort]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const updateParams = (next: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(next).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ keyword: keywordInput.trim(), page: '1' });
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateParams({ sort: event.target.value, page: '1' });
  };

  const handlePageChange = (nextPage: number) => {
    updateParams({ page: String(nextPage) });
  };

  const handleTogglePin = async (
    post: PostSummary,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await pinPost(post.id, !post.pinned);
      message.success(
        post.pinned ? '공지 고정을 해제했습니다.' : '공지로 고정했습니다.',
      );
      loadPosts();
    } catch {
      message.error('공지 설정에 실패했습니다.');
    }
  };

  return (
    <MainLayout>
      <div className="board-list-page">
        {!user ? (
          <p className="board-list-page__denied" role="alert">
            로그인이 필요합니다.
          </p>
        ) : (
          <>
            <header className="board-list-page__header">
              <div>
                <h1 className="board-list-page__title">게시판</h1>
                <p className="board-list-page__subtitle">
                  공지사항과 게시글을 확인하세요
                </p>
              </div>

              <button
                type="button"
                className="board-list-page__write-button"
                onClick={() => navigate('/board/write')}
              >
                글쓰기
              </button>
            </header>

            <div className="board-list-page__toolbar">
              <select
                className="board-list-page__sort"
                value={sort}
                onChange={handleSortChange}
                aria-label="정렬"
              >
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>

              <form
                className="board-list-page__search"
                onSubmit={handleSearchSubmit}
              >
                <input
                  type="text"
                  placeholder="제목 또는 내용 검색"
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  aria-label="게시글 검색"
                />
                <button type="submit">검색</button>
              </form>
            </div>

            <div className="board-list-page__table">
              <div className="board-list-page__row board-list-page__row--head">
                <span className="board-list-page__col board-list-page__col--title">
                  제목
                </span>
                <span className="board-list-page__col board-list-page__col--author">
                  작성자
                </span>
                <span className="board-list-page__col board-list-page__col--date">
                  작성일
                </span>
                {isAdmin && (
                  <span className="board-list-page__col board-list-page__col--pin">
                    공지 설정
                  </span>
                )}
              </div>

              {posts === null ? (
                <p className="board-list-page__empty">불러오는 중...</p>
              ) : posts.length === 0 ? (
                <p className="board-list-page__empty">
                  {keywordParam
                    ? '검색 결과가 없습니다.'
                    : '등록된 게시글이 없습니다.'}
                </p>
              ) : (
                posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/board/${post.id}`}
                    className={
                      post.pinned
                        ? 'board-list-page__row board-list-page__row--pinned'
                        : 'board-list-page__row'
                    }
                  >
                    <span className="board-list-page__col board-list-page__col--title">
                      {post.pinned && (
                        <span className="board-list-page__badge">공지</span>
                      )}
                      <span className="board-list-page__row-title">
                        {post.title}
                      </span>
                      {post.commentCount > 0 && (
                        <span className="board-list-page__comment-count">
                          [{post.commentCount}]
                        </span>
                      )}
                    </span>
                    <span className="board-list-page__col board-list-page__col--author">
                      {post.authorName}
                    </span>
                    <span className="board-list-page__col board-list-page__col--date">
                      {formatDate(post.createdAt)}
                    </span>
                    {isAdmin && (
                      <span className="board-list-page__col board-list-page__col--pin">
                        <button
                          type="button"
                          className={
                            post.pinned
                              ? 'board-list-page__pin-button board-list-page__pin-button--active'
                              : 'board-list-page__pin-button'
                          }
                          onClick={(event) => handleTogglePin(post, event)}
                        >
                          {post.pinned ? '고정 해제' : '공지 지정'}
                        </button>
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>

            <div className="board-list-page__footer">
              <span className="board-list-page__total">
                전체 {totalElements}건
              </span>
              <BoardPagination
                page={page}
                totalPages={totalPages}
                onChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default BoardListPage;