import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Popover, message } from 'antd';
import { useNavigate } from 'react-router-dom';

import {
  extractErrorMessage,
  fetchObjectionDetail,
  fetchObjections,
  importObjectionsCsv,
} from '../../../features/objection/api/objectionApi';

import type {
  ObjectionDetail,
  ObjectionReviewResult,
  ObjectionSummary,
} from '../../../features/objection/model/objectionTypes';

import ObjectionDetailPanel from '../../../features/objection/ui/ObjectionDetailPanel';
import ObjectionList from '../../../features/objection/ui/ObjectionList';

import MainLayout from '../../../widgets/layout/ui/MainLayout';

import './ObjectionsPage.css';

// 한 페이지에 표시할 최대 이의제기 건수
const ITEMS_PER_PAGE = 10;

// 상세 패널 닫기 애니메이션 시간
const DETAIL_ANIMATION_DURATION = 300;

// CSV 최대 업로드 크기: 200MB
const MAX_CSV_FILE_SIZE = 200 * 1024 * 1024;

// 도움말 내용
function CsvUploadGuide() {
  return (
    <div className="objections-page__upload-guide">
      <strong>CSV 업로드 안내</strong>

      <ul>
        <li>
          파일은 <code>.csv</code> 확장자, UTF-8 인코딩, 200MB 이하로
          준비해주세요. UTF-8 BOM은 자동으로 제거됩니다.
        </li>

        <li>
          헤더는 다음 8개 컬럼으로 구성해주세요.
          <span className="objections-page__upload-guide-detail">
            고객_이름, 이의제기_번호, 거절_금융기준, 제목, 내용,
            주요_판단_근거_변수, 담당자_판단_근거, 작성일시
          </span>
        </li>

        <li>
          고객_이름, 거절_금융기준, 제목, 내용, 작성일시는 반드시
          입력해야 합니다.
        </li>

        <li>
          길이 제한은 이의제기_번호 20자, 고객_이름 50자,
          거절_금융기준 100자, 제목 200자입니다.
        </li>

        <li>
          작성일시는 <code>yyyy-MM-dd H:mm</code> 형식으로 입력해주세요.
          <span className="objections-page__upload-guide-detail">
            예: 2026-07-31 9:54
          </span>
        </li>

        <li>
          이의제기_번호는 파일 안에서 중복될 수 없으며, 기존에 등록된
          번호도 사용할 수 없습니다.
        </li>

        <li>
          한 행이라도 검증에 실패하면 파일 전체가 저장되지 않습니다.
        </li>
      </ul>
    </div>
  );
}

function ObjectionsPage() {
  const navigate = useNavigate();

  // 상세 패널 닫기 타이머
  const closeTimerRef = useRef<number | null>(null);

  // 전체 이의제기 목록 (요약)
  const [objections, setObjections] = useState<ObjectionSummary[]>([]);

  // 현재 선택된 이의제기 ID
  const [selectedObjectionId, setSelectedObjectionId] =
    useState<number | null>(null);

  // 선택된 이의제기의 상세 정보 (선택 시 별도 조회)
  const [selectedObjection, setSelectedObjection] =
    useState<ObjectionDetail | null>(null);

  // 상세 정보 로딩 상태
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // 담당자가 선택한 처리 결과
  const [reviewResult, setReviewResult] =
    useState<ObjectionReviewResult>('REJECTED');

  // 상세 패널 닫기 애니메이션 상태
  const [isDetailClosing, setIsDetailClosing] = useState(false);

  // 검색어
  const [searchKeyword, setSearchKeyword] = useState('');

  // true: 최신순, false: 오래된순
  const [sortDescending, setSortDescending] = useState(true);

  // 현재 페이지 번호
  const [currentPage, setCurrentPage] = useState(1);

  // 목록 로딩 상태
  const [isLoading, setIsLoading] = useState(true);

  // CSV 업로드 상태
  const [isUploading, setIsUploading] = useState(false);

  // 이의제기 목록 조회
  const loadObjections = () => {
    setIsLoading(true);

    fetchObjections()
      .then(setObjections)
      .catch((error: unknown) => {
        message.error(
          extractErrorMessage(error, '이의제기 목록을 불러오지 못했습니다.'),
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadObjections();
  }, []);

  // 컴포넌트 종료 시 타이머 제거
  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // 검색 및 정렬된 이의제기 목록
  const filteredObjections = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    const filtered = normalizedKeyword
      ? objections.filter(
          (item) =>
            item.customerName.toLowerCase().includes(normalizedKeyword) ||
            item.title.toLowerCase().includes(normalizedKeyword),
        )
      : objections;

    return [...filtered].sort((first, second) => {
      const firstTime = new Date(first.createdAt).getTime();
      const secondTime = new Date(second.createdAt).getTime();

      return sortDescending
        ? secondTime - firstTime
        : firstTime - secondTime;
    });
  }, [objections, searchKeyword, sortDescending]);

  // 전체 페이지 수
  const totalPages = Math.max(
    1,
    Math.ceil(filteredObjections.length / ITEMS_PER_PAGE),
  );

  // 현재 페이지에 표시할 목록
  const visibleObjections = filteredObjections.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // 상세 패널 표시 여부
  const isDetailVisible = selectedObjectionId !== null;

  // 검색어 변경
  const handleSearchKeywordChange = (value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  // 정렬 방식 변경
  const handleSortChange = (nextSortDescending: boolean) => {
    setSortDescending(nextSortDescending);
    setCurrentPage(1);
  };

  // 이의제기 선택 시 상세 정보를 별도로 조회
  const handleSelect = (objectionId: number) => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setIsDetailClosing(false);
    setSelectedObjectionId(objectionId);
    setSelectedObjection(null);
    setReviewResult('REJECTED');
    setIsDetailLoading(true);

    fetchObjectionDetail(objectionId)
      .then(setSelectedObjection)
      .catch((error: unknown) => {
        message.error(
          extractErrorMessage(error, '이의제기 상세 정보를 불러오지 못했습니다.'),
        );
        setSelectedObjectionId(null);
      })
      .finally(() => {
        setIsDetailLoading(false);
      });
  };

  // 상세 패널 닫기
  const handleCloseDetail = () => {
    if (!selectedObjectionId || isDetailClosing) {
      return;
    }

    setIsDetailClosing(true);

    closeTimerRef.current = window.setTimeout(() => {
      setSelectedObjectionId(null);
      setSelectedObjection(null);
      setReviewResult('REJECTED');
      setIsDetailClosing(false);
      closeTimerRef.current = null;
    }, DETAIL_ANIMATION_DURATION);
  };

  // 대응문서 생성 또는 조회 페이지로 이동
  const handleCreateDocument = () => {
    if (!selectedObjection) {
      return;
    }

    const selectedReviewResult =
      selectedObjection.status === 'COMPLETED'
        ? selectedObjection.completionInfo?.reviewResult ?? 'REJECTED'
        : reviewResult;

    navigate(`/objections/${selectedObjection.objectionId}/document`, {
      state: {
        reviewResult: selectedReviewResult,
        isCompleted: selectedObjection.status === 'COMPLETED',
      },
    });
  };

  // 신용감사 결과 CSV 업로드
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // 같은 파일을 다시 선택해도 change 이벤트가 발생하도록 초기화
    event.target.value = '';

    if (!file) {
      return;
    }

    // csv 확장자 검사
    if (!file.name.toLowerCase().endsWith('.csv')) {
      message.error('.csv 형식의 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 검사
    if (file.size > MAX_CSV_FILE_SIZE) {
      message.error('파일 크기는 200MB 이하여야 합니다.');
      return;
    }
    
    try {
      setIsUploading(true);

      const result = await importObjectionsCsv(file);

      message.success(`이의제기 ${result.importedCount}건이 등록되었습니다.`);
      loadObjections();
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error, 'CSV 업로드에 실패했습니다.');

      if (errorMessage.includes('CSV 헤더가 올바르지 않습니다')) {
        message.error(
          'CSV 헤더가 올바르지 않습니다. 도움말에서 지정된 8개 헤더 항목을 확인해주세요.',
        );
        return;
      }

      message.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <MainLayout>
      <div className="objections-page">
        <div className="objections-page__inner">
          {/* 페이지 상단 제목 */}
          <header className="objections-page__page-header">
            <span>이의제기</span>

            <div className="objections-page__title-row">
              <div>
                <h1>고객 이의제기 목록</h1>

                <p>
                  접수된 이의제기를 확인하고 대응문서를 생성하세요
                </p>
              </div>

              <div className="objections-page__title-actions">
                <div className="objections-page__upload-actions">
                  {/* 신용감사 결과 CSV 업로드 */}
                  <label className="objections-page__upload-button">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(event) => void handleFileChange(event)}
                      disabled={isUploading}
                      hidden
                    />
                    {isUploading ? '업로드 중...' : '신용감사 결과 업로드'}
                  </label>

                  <Popover
                    content={<CsvUploadGuide />}
                    trigger="click"
                    placement="bottomRight"
                  >
                    <button
                      type="button"
                      className="objections-page__upload-help-button"
                      aria-label="신용감사 결과 CSV 업로드 도움말"
                    >
                      ?
                    </button>
                  </Popover>
                  
                </div>
                {/* 상세 패널이 닫혀 있을 때만 상단에 전체 건수 표시 */}
                {!isDetailVisible && <strong>{objections.length}건</strong>}
              </div>
            </div>
          </header>

          {isLoading ? (
            // 목록 로딩 화면
            <div className="objections-page__loading">
              이의제기 목록을 불러오는 중입니다.
            </div>
          ) : (
            // 목록과 상세 패널 영역
            <div
              className={[
                'objections-page__workspace',
                isDetailVisible
                  ? 'objections-page__workspace--detail-open'
                  : '',
                isDetailClosing
                  ? 'objections-page__workspace--detail-closing'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* 이의제기 목록 */}
              <ObjectionList
                objections={visibleObjections}
                totalCount={objections.length}
                selectedObjectionId={selectedObjectionId}
                compact={isDetailVisible}
                searchKeyword={searchKeyword}
                sortDescending={sortDescending}
                currentPage={currentPage}
                totalPages={totalPages}
                onSearchKeywordChange={handleSearchKeywordChange}
                onSortChange={handleSortChange}
                onSelect={handleSelect}
                onPageChange={setCurrentPage}
              />

              {/* 선택된 이의제기 상세 패널 */}
              {selectedObjectionId && (
                <div
                  className={[
                    'objections-page__detail-wrapper',
                    isDetailClosing
                      ? 'objections-page__detail-wrapper--closing'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isDetailLoading || !selectedObjection ? (
                    <div className="objections-page__loading">
                      이의제기 상세 정보를 불러오는 중입니다.
                    </div>
                  ) : (
                    <ObjectionDetailPanel
                      objection={selectedObjection}
                      reviewResult={reviewResult}
                      onReviewResultChange={setReviewResult}
                      onClose={handleCloseDetail}
                      onCreateDocument={handleCreateDocument}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default ObjectionsPage;