import { useEffect, useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { message } from 'antd';
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  dispatchObjectionDocument,
  extractErrorMessage,
  fetchDispatchHistory,
  fetchObjectionDetail,
  fetchObjectionDocument,
  regenerateObjectionLetter,
} from '../../../features/objection/api/objectionApi';

import type {
  ObjectionDispatchHistory,
  ObjectionDocument,
  ObjectionReviewResult,
} from '../../../features/objection/model/objectionTypes';

import ObjectionDocumentForm from '../../../features/objection/ui/ObjectionDocumentForm';

import MainLayout from '../../../widgets/layout/ui/MainLayout';

import './ObjectionDocumentPage.css';

// 목록 페이지에서 전달받는 처리 결과와 완료 상태
interface DocumentLocationState {
  reviewResult?: ObjectionReviewResult;
  isCompleted?: boolean;
}

// 날짜와 시간을 화면 표시 형식으로 변환
function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(value))
    .replaceAll(' ', '');
}

// 처리 결과 코드를 한글 문구로 변환
function getReviewResultLabel(
  value: ObjectionReviewResult,
): string {
  return value === 'REJECTED' ? '거절 유지' : '재심사';
}

function ObjectionDocumentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { objectionId: objectionIdParam } = useParams();
  const objectionId = Number(objectionIdParam);

  const locationState =
    location.state as DocumentLocationState | null;

  // 답변대기 상태에서 사용자가 선택한 처리 결과
  const requestedReviewResult =
    locationState?.reviewResult ?? 'REJECTED';

  // 생성된 대응문서
  const [document, setDocument] =
    useState<ObjectionDocument | null>(null);

  // 고객 안내문 내용
  const [letterBody, setLetterBody] = useState('');

  // 발송 이력 목록
  const [dispatchHistory, setDispatchHistory] =
    useState<ObjectionDispatchHistory[]>([]);

  // 실제 답변완료 여부
  const [isCompleted, setIsCompleted] = useState(
    locationState?.isCompleted ?? false,
  );

  // 고객 안내문 직접입력 여부
  const [isDirectInput, setIsDirectInput] = useState(false);

  // 발송 동의 여부
  const [agreed, setAgreed] = useState(false);

  // 고객 안내문 재생성 상태
  const [isRegenerating, setIsRegenerating] = useState(false);

  // 고객 안내문 발송 상태
  const [isDispatching, setIsDispatching] = useState(false);

  // 페이지 로딩 상태
  const [isLoading, setIsLoading] = useState(true);

  // 대응문서와 발송 이력 조회
  useEffect(() => {
    if (!Number.isInteger(objectionId) || objectionId <= 0) {
      message.error('잘못된 이의제기 번호입니다.');

      navigate('/objections', {
        replace: true,
      });

      return;
    }

    const loadDocument = async () => {
      try {
        setIsLoading(true);

        // 이의제기 상태와 완료 정보를 먼저 조회
        const objectionResult =
          await fetchObjectionDetail(objectionId);

        const completed =
          objectionResult.status === 'COMPLETED';

        // 완료 건은 저장된 최종 처리 결과 사용
        const resolvedReviewResult =
          completed
            ? objectionResult.completionInfo?.reviewResult ??
              'REJECTED'
            : requestedReviewResult;

        // 대응문서와 해당 이의제기의 발송 이력 조회
        const [documentResult, historyResult] =
          await Promise.all([
            fetchObjectionDocument(
              objectionId,
              resolvedReviewResult,
            ),
            fetchDispatchHistory(objectionId),
          ]);

        setDocument(documentResult);
        setLetterBody(documentResult.letterBody);
        setDispatchHistory(historyResult);
        setIsCompleted(completed);
      } catch (error: unknown) {
        message.error(
          extractErrorMessage(error, '대응문서를 불러오지 못했습니다.'),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadDocument();
  }, [
    navigate,
    objectionId,
    requestedReviewResult,
  ]);

  // 고객 안내문 재생성
  const handleRegenerate = async () => {
    if (!document || isCompleted) {
      return;
    }

    try {
      setIsRegenerating(true);

      const regeneratedLetter =
        await regenerateObjectionLetter(
          document.objectionId,
          document.reviewResult,
        );

      setLetterBody(regeneratedLetter);
      setAgreed(false);

      message.success('고객 안내문을 재생성했습니다.');
    } catch (error: unknown) {
      message.error(
        extractErrorMessage(error, '고객 안내문 재생성에 실패했습니다.'),
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  // 고객 안내문 발송 (이메일은 폼의 확인 모달에서 입력받아 인자로 전달받는다)
  const handleDispatch = async (recipientEmail: string) => {
    if (!document || isCompleted) {
      return;
    }

    try {
      setIsDispatching(true);

      const dispatchResult =
        await dispatchObjectionDocument({
          objectionId: document.objectionId,
          reviewResult: document.reviewResult,
          letterTitle: document.letterTitle,
          letterBody,
          recipientEmail,
        });

      // 새 발송 이력을 가장 위에 추가
      setDispatchHistory((previous) => [
        dispatchResult,
        ...previous,
      ]);

      setAgreed(false);
      setIsCompleted(true);

      message.success('고객 안내문 발송이 완료되었습니다.');
    } catch (error: unknown) {
      message.error(
        extractErrorMessage(error, '고객 안내문 발송에 실패했습니다.'),
      );
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <MainLayout>
      <div className="objection-document-page">
        <div className="objection-document-page__inner">
          {/* 페이지 상단 제목 */}
          <header className="objection-document-page__page-header">
            <button
              type="button"
              aria-label="이의제기 목록으로 돌아가기"
              onClick={() => navigate('/objections')}
            >
              <ArrowLeftOutlined />
            </button>

            <div>
              <h1>
                {isCompleted
                  ? '고객 이의제기 대응문서 조회'
                  : '고객 이의제기 대응문서 생성'}
              </h1>

              <p>
                신용정보법 제36조의2
                (자동화평가 설명요구·이의제기권) 대응 ·
                34조4호 사후 감독
              </p>
            </div>
          </header>

          {isLoading ? (
            <div className="objection-document-page__loading">
              대응문서를 불러오는 중입니다.
            </div>
          ) : document ? (
            <>
              {/* 판단 근거 및 고객 안내문 검토 폼 */}
              <ObjectionDocumentForm
                document={document}
                letterBody={letterBody}
                isCompleted={isCompleted}
                isDirectInput={isDirectInput}
                agreed={agreed}
                isRegenerating={isRegenerating}
                isDispatching={isDispatching}
                onLetterBodyChange={setLetterBody}
                onDirectInputChange={setIsDirectInput}
                onAgreementChange={setAgreed}
                onRegenerate={() =>
                  void handleRegenerate()
                }
                onDispatch={(recipientEmail) =>
                  void handleDispatch(recipientEmail)
                }
              />

              {/* 고객 안내문 발송 이력 */}
              <section className="objection-document-history">
                <h2>발송 이력</h2>

                <div className="objection-document-history__head">
                  <span>심사 대상</span>
                  <span>발송 일시</span>
                  <span>고객 이름</span>
                  <span>심사 결과</span>
                </div>

                {dispatchHistory.length === 0 ? (
                  <div className="objection-document-history__empty">
                    발송 이력이 없습니다.
                  </div>
                ) : (
                  dispatchHistory.map((item) => (
                    <div
                      className="objection-document-history__row"
                      key={item.dispatchId}
                    >
                      <strong>
                        {item.customerName}* (#
                        {item.objectionNo})
                      </strong>

                      <time>
                        {formatDateTime(
                          item.dispatchedAt,
                        )}
                      </time>

                      <span>{item.customerName}</span>

                      <div>
                        <span className="objection-document-history__result">
                          {getReviewResultLabel(
                            item.reviewResult,
                          )}
                        </span>

                        <span className="objection-document-history__status">
                          발송완료
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </section>
            </>
          ) : (
            <div className="objection-document-page__loading">
              대응문서를 찾을 수 없습니다.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default ObjectionDocumentPage;