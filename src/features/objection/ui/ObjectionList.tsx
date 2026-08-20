import {
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import { maskName } from '../../../shared/lib/maskName';
import type {
  ObjectionStatus,
  ObjectionSummary,
} from '../model/objectionTypes';

// 이의제기 목록에서 전달받는 값과 이벤트
interface ObjectionListProps {
  objections: ObjectionSummary[];
  totalCount: number;
  selectedObjectionId: number | null;
  compact: boolean;
  searchKeyword: string;
  sortDescending: boolean;
  statusFilter: 'ALL' | ObjectionStatus;
  currentPage: number;
  totalPages: number;
  onSearchKeywordChange: (value: string) => void;
  onSortChange: (sortDescending: boolean) => void;
  onStatusFilterChange: (statusFilter: 'ALL' | ObjectionStatus) => void;
  onSelect: (objectionId: number) => void;
  onPageChange: (page: number) => void;
}

// 작성일 표시 형식 변환
function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(value))
    .replaceAll(' ', '');
}

// 이의제기 상태를 한글 문구로 변환
function getStatusLabel(status: ObjectionStatus): string {
  return status === 'WAITING' ? '답변대기' : '답변완료';
}

function ObjectionList({
  objections,
  totalCount,
  selectedObjectionId,
  compact,
  searchKeyword,
  sortDescending,
  statusFilter,
  currentPage,
  totalPages,
  onSearchKeywordChange,
  onSortChange,
  onStatusFilterChange,
  onSelect,
  onPageChange,
}: ObjectionListProps) {
  return (
    <section
      className={`objection-list ${
        compact ? 'objection-list--compact' : ''
      }`}
    >
      {/* 검색창 및 정렬 영역 */}
      <div className="objection-list__toolbar">
        {/* 이의제기 검색창 */}
        <label className="objection-list__search">
          <SearchOutlined
            className="objection-list__search-icon"
            aria-hidden="true"
          />

          <input
            type="search"
            value={searchKeyword}
            placeholder="제목, 이름으로 검색"
            aria-label="이의제기 검색"
            onChange={(event) =>
              onSearchKeywordChange(event.target.value)
            }
          />
        </label>

        {/* 건수 및 정렬 버튼 영역 */}
        <div className="objection-list__toolbar-bottom">
          {/* 상세 패널이 열렸을 때만 목록 카드 안에 건수 표시 */}
          {compact && (
            <strong className="objection-list__total-count">
              {totalCount}건
            </strong>
          )}

          {/* 답변대기 및 답변완료 상태 필터 */}
          <div className="objection-list__sort-wrapper">
            <select
              className="objection-list__sort-select objection-list__sort-select--filter"
              aria-label="이의제기 답변 상태 필터"
              value={statusFilter}
              onChange={(event) =>
                onStatusFilterChange(
                  event.target.value as 'ALL' | ObjectionStatus,
                )
              }
            >
              <option value="ALL">전체</option>
              <option value="WAITING">답변대기</option>
              <option value="COMPLETED">답변완료</option>
            </select>

            <DownOutlined
              className="objection-list__sort-arrow objection-list__sort-arrow--filter"
              aria-hidden="true"
            />
          </div>

          {/* 최신순 및 오래된순 정렬 */}
          <div className="objection-list__sort-wrapper">
            <select
              className="objection-list__sort-select"
              aria-label="이의제기 정렬 방식"
              value={sortDescending ? 'latest' : 'oldest'}
              onChange={(event) =>
                onSortChange(event.target.value === 'latest')
              }
            >
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
            </select>

            <DownOutlined
              className="objection-list__sort-arrow"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* 이의제기 목록 */}
      <div className="objection-list__items">
        {objections.length === 0 ? (
          <div className="objection-list__empty">
            검색 결과가 없습니다.
          </div>
        ) : (
          objections.map((item) => {
            const isSelected =
              selectedObjectionId === item.objectionId;

            return (
              <button
                type="button"
                key={item.objectionId}
                className={`objection-list__item ${
                  isSelected
                    ? 'objection-list__item--selected'
                    : ''
                }`}
                onClick={() => onSelect(item.objectionId)}
              >
                {/* 고객명 */}
                <div className="objection-list__customer">
                  {maskName(item.customerName)}
                </div>

                {/* 이의제기 제목 */}
                <div className="objection-list__main">
                  <strong className="objection-list__title">
                    {item.title ? (
                      compact ? (
                        item.title
                      ) : (
                        <>
                          <span className="objection-list__title-label">
                            [제목]
                          </span>

                          <span className="objection-list__title-content">
                            {item.title}
                          </span>
                        </>
                      )
                    ) : (
                      '아직 작성된 내용이 없습니다'
                    )}
                  </strong>

                  {/* 상세 패널이 열린 상태의 상태 및 날짜 */}
                  {compact && (
                    <div className="objection-list__compact-meta">
                      <span
                        className={`objection-list__status objection-list__status--${item.status.toLowerCase()}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>

                      <time>{formatDate(item.createdAt)}</time>
                    </div>
                  )}
                </div>

                {/* 일반 목록의 상태, 날짜 및 화살표 */}
                {!compact && item.title && (
                  <>
                    <span
                      className={`objection-list__status objection-list__status--${item.status.toLowerCase()}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>

                    <time className="objection-list__date">
                      {formatDate(item.createdAt)}
                    </time>

                    <RightOutlined
                      className="objection-list__arrow"
                      aria-hidden="true"
                    />
                  </>
                )}

                {/* 제목이 없는 항목의 작성일 */}
                {!compact && !item.title && (
                  <time className="objection-list__date objection-list__date--empty">
                    {formatDate(item.createdAt)}
                  </time>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* 목록 페이지네이션 */}
      <div className="objection-list__pagination">
        {/* 이전 페이지 버튼 */}
        <button
          type="button"
          aria-label="이전 페이지"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <LeftOutlined />
        </button>

        {/* 페이지 번호 버튼 */}
        {Array.from(
          { length: totalPages },
          (_, index) => index + 1,
        ).map((page) => (
          <button
            type="button"
            key={page}
            className={
              currentPage === page
                ? 'objection-list__page--active'
                : ''
            }
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        {/* 다음 페이지 버튼 */}
        <button
          type="button"
          aria-label="다음 페이지"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <RightOutlined />
        </button>
      </div>
    </section>
  );
}

export default ObjectionList;