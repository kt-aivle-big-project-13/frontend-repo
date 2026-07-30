import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Radio,
  message,
} from 'antd';
import axios from 'axios';

import {
  getAudits,
  type AuditSummary,
} from '../../../features/audit/api/auditApi';

import {
  createObjection,
  dispatchObjection,
  generateObjectionExplanation,
  generateObjectionLetter,
  type DispatchChannel,
  type GenerateExplanationResponse,
  type GenerateLetterResponse,
} from '../../../features/objection/api/objectionApi';

import type { ObjectionFormValues } from '../../../features/objection/model/objectionSchema';

import ObjectionForm from '../../../features/objection/ui/ObjectionForm';
import MainLayout from '../../../widgets/layout/ui/MainLayout';

import './ObjectionsPage.css';

interface DispatchHistoryItem {
  objectionId: number;
  customerCaseNo: string;
  dispatchedAt: string;
  channels: DispatchChannel[];
}

interface ErrorResponse {
  message?: string;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function ObjectionsPage() {
  const [audits, setAudits] = useState<AuditSummary[]>(
    [],
  );

  const [isLoadingAudits, setIsLoadingAudits] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [
    isGeneratingLetter,
    setIsGeneratingLetter,
  ] = useState(false);

  const [isDispatching, setIsDispatching] =
    useState(false);

  const [objectionId, setObjectionId] = useState<
    number | null
  >(null);

  const [customerCaseNo, setCustomerCaseNo] =
    useState('');

  const [explanation, setExplanation] =
    useState<GenerateExplanationResponse | null>(null);

  const [letter, setLetter] =
    useState<GenerateLetterResponse | null>(null);

  const [letterBody, setLetterBody] = useState('');

  const [agreed, setAgreed] = useState(false);

  const [
    isDispatchModalOpen,
    setIsDispatchModalOpen,
  ] = useState(false);

  const [recipientContact, setRecipientContact] =
    useState('');

  const [channels, setChannels] = useState<
    DispatchChannel[]
  >(['EMAIL']);

  const [history, setHistory] = useState<
    DispatchHistoryItem[]
  >([]);

  useEffect(() => {
    const loadAudits = async () => {
      try {
        setIsLoadingAudits(true);

        const result = await getAudits();

        setAudits(result);
      } catch (error: unknown) {
        message.error(
          getErrorMessage(
            error,
            '감사 목록을 불러오지 못했습니다.',
          ),
        );
      } finally {
        setIsLoadingAudits(false);
      }
    };

    void loadAudits();
  }, []);

  const handleSubmit = async (
    values: ObjectionFormValues,
  ) => {
    try {
      setIsSubmitting(true);

      setExplanation(null);
      setLetter(null);
      setLetterBody('');
      setAgreed(false);

      /**
       * 1. 이의제기 등록
       */
      const created = await createObjection({
        auditId: values.auditId,
        customerCaseNo:
          values.customerCaseNo.trim(),
        reviewResult: values.reviewResult,
        reviewBasis: values.reviewBasis.trim(),
      });

      setObjectionId(created.objectionId);
      setCustomerCaseNo(created.customerCaseNo);

      /**
       * 2. SHAP 및 If-Then 판단 근거 설명 생성
       */
      const explanationResult =
        await generateObjectionExplanation(
          created.objectionId,
        );

      setExplanation(explanationResult);

      /**
       * 3. 고객 안내문 초안 생성
       */
      const letterResult =
        await generateObjectionLetter(
          created.objectionId,
          {
            tone: 'FORMAL',
          },
        );

      setLetter(letterResult);
      setLetterBody(letterResult.body);

      message.success(
        '이의제기 등록과 초안 생성이 완료되었습니다.',
      );
    } catch (error: unknown) {
      message.error(
        getErrorMessage(
          error,
          '이의제기 등록 또는 초안 생성에 실패했습니다.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateLetter = async () => {
    if (objectionId === null) {
      message.warning(
        '먼저 이의제기 건을 등록해 주세요.',
      );
      return;
    }

    try {
      setIsGeneratingLetter(true);

      const result =
        await generateObjectionLetter(
          objectionId,
          {
            tone: 'FORMAL',
          },
        );

      setLetter(result);
      setLetterBody(result.body);
      setAgreed(false);

      message.success(
        '고객 안내문을 다시 생성했습니다.',
      );
    } catch (error: unknown) {
      message.error(
        getErrorMessage(
          error,
          '고객 안내문 재생성에 실패했습니다.',
        ),
      );
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleOpenDispatchModal = () => {
    if (!letter) {
      message.warning(
        '먼저 고객 안내문을 생성해 주세요.',
      );
      return;
    }

    if (!letterBody.trim()) {
      message.warning(
        '발송할 고객 안내문 내용을 입력해 주세요.',
      );
      return;
    }

    if (!agreed) {
      message.warning(
        '내용 검토 및 발송 동의가 필요합니다.',
      );
      return;
    }

    setIsDispatchModalOpen(true);
  };

  const handleCloseDispatchModal = () => {
    if (isDispatching) {
      return;
    }

    setIsDispatchModalOpen(false);
  };

  const handleDispatch = async () => {
    if (objectionId === null) {
      message.warning(
        '이의제기 정보가 존재하지 않습니다.',
      );
      return;
    }

    if (!recipientContact.trim()) {
      message.warning(
        '고객 연락처 또는 이메일을 입력해 주세요.',
      );
      return;
    }

    if (channels.length === 0) {
      message.warning(
        '발송 채널을 선택해 주세요.',
      );
      return;
    }

    try {
      setIsDispatching(true);

      const result = await dispatchObjection(
        objectionId,
        {
          approved: true,
          channels,
          recipientContact:
            recipientContact.trim(),
        },
      );

      setHistory((previous) => [
        {
          objectionId,
          customerCaseNo,
          dispatchedAt: result.dispatchedAt,
          channels: result.channels,
        },
        ...previous,
      ]);

      setIsDispatchModalOpen(false);
      setRecipientContact('');
      setChannels(['EMAIL']);
      setAgreed(false);

      message.success(
        '고객 안내문 발송이 완료되었습니다.',
      );
    } catch (error: unknown) {
      message.error(
        getErrorMessage(
          error,
          '고객 안내문 발송에 실패했습니다.',
        ),
      );
    } finally {
      setIsDispatching(false);
    }
  };

  const handleChannelChange = (
    channel: DispatchChannel,
  ) => {
    setChannels([channel]);
  };

  return (
    <MainLayout>
      <section className="objections-page">
        <div className="objections-page__inner">
          <header className="objections-page__header">
            <h1>
              고객 이의제기 대응문서 생성
            </h1>

            <p>
              신용정보법 제36조의2에 따라 심사
              결과와 판단 근거를 검토하고 고객
              안내문 초안을 생성합니다.
            </p>
          </header>

          <div className="objections-page__workspace">
            <section className="objections-page__card">
              <div className="objections-page__card-heading">
                <span>① 이의제기 등록</span>

                {objectionId !== null && (
                  <small>
                    이의제기 #{objectionId}
                  </small>
                )}
              </div>

              <ObjectionForm
                audits={audits}
                isLoadingAudits={
                  isLoadingAudits
                }
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
              />
            </section>

            <section className="objections-page__card">
              <div className="objections-page__card-heading">
                <span>
                  ② 설명문 초안 · 담당자 검토
                </span>
              </div>

              <div className="objections-page__output-group">
                <label>
                  판단 근거 설명 (SHAP, If-Then)
                </label>

                <div className="objections-page__output-box">
                  {explanation?.explanation ??
                    '이의제기를 등록하면 SHAP 및 규칙 기반 설명이 표시됩니다.'}
                </div>

                {explanation &&
                  explanation.rules.length > 0 && (
                    <ul className="objections-page__rules">
                      {explanation.rules.map(
                        (rule) => (
                          <li key={rule}>
                            {rule}
                          </li>
                        ),
                      )}
                    </ul>
                  )}
              </div>

              <div className="objections-page__output-group">
                <div className="objections-page__output-label-row">
                  <label>
                    고객 안내문 초안 (LLM)
                  </label>

                  <Button
                    size="small"
                    loading={isGeneratingLetter}
                    disabled={
                      objectionId === null ||
                      isSubmitting
                    }
                    onClick={() =>
                      void handleRegenerateLetter()
                    }
                  >
                    재생성
                  </Button>
                </div>

                {letter?.title && (
                  <Input
                    className="objections-page__letter-title"
                    value={letter.title}
                    readOnly
                  />
                )}

                <Input.TextArea
                  className="objections-page__letter"
                  value={letterBody}
                  placeholder="생성된 고객 안내문 초안이 표시됩니다."
                  onChange={(event) => {
                    setLetterBody(
                      event.target.value,
                    );
                    setAgreed(false);
                  }}
                />
              </div>

              <div className="objections-page__actions">
                <Checkbox
                  checked={agreed}
                  disabled={!letterBody.trim()}
                  onChange={(event) =>
                    setAgreed(
                      event.target.checked,
                    )
                  }
                >
                  내용을 검토했으며 발송에
                  동의합니다.
                </Checkbox>

                <Button
                  type="primary"
                  disabled={
                    !letter ||
                    !agreed ||
                    !letterBody.trim()
                  }
                  onClick={
                    handleOpenDispatchModal
                  }
                >
                  승인 및 발송
                </Button>
              </div>
            </section>
          </div>

          <section className="objections-page__history">
            <h2>발송 이력</h2>

            <div className="objections-page__history-head">
              <span>심사 대상</span>
              <span>발송 일시</span>
              <span>발송 채널</span>
              <span>심사 결과</span>
            </div>

            {history.length === 0 ? (
              <div className="objections-page__empty">
                현재 화면에서 발송한 이력이
                없습니다.
              </div>
            ) : (
              history.map((item) => (
                <div
                  className="objections-page__history-row"
                  key={`${item.objectionId}-${item.dispatchedAt}`}
                >
                  <span>
                    {item.customerCaseNo}
                  </span>

                  <span>
                    {new Date(
                      item.dispatchedAt,
                    ).toLocaleString('ko-KR')}
                  </span>

                  <span>
                    {item.channels.join(', ')}
                  </span>

                  <span className="objections-page__badge">
                    발송완료
                  </span>
                </div>
              ))
            )}
          </section>
        </div>
      </section>

      <Modal
        title="고객 안내문 발송"
        open={isDispatchModalOpen}
        okText="승인 및 발송"
        cancelText="취소"
        confirmLoading={isDispatching}
        onCancel={handleCloseDispatchModal}
        onOk={() => void handleDispatch()}
        maskClosable={!isDispatching}
        closable={!isDispatching}
      >
        <div className="objections-page__modal-field">
          <label htmlFor="recipientContact">
            고객 연락처 또는 이메일
          </label>

          <Input
            id="recipientContact"
            value={recipientContact}
            placeholder="example@email.com 또는 010-0000-0000"
            disabled={isDispatching}
            onChange={(event) =>
              setRecipientContact(
                event.target.value,
              )
            }
          />
        </div>

        <div className="objections-page__modal-field">
          <span>발송 채널</span>

          <Radio.Group
            value={channels[0]}
            disabled={isDispatching}
            onChange={(event) =>
              handleChannelChange(
                event.target
                  .value as DispatchChannel,
              )
            }
          >
            <Radio value="EMAIL">
              이메일
            </Radio>

            <Radio value="SMS">
              SMS
            </Radio>
          </Radio.Group>
        </div>
      </Modal>
    </MainLayout>
  );
}

export default ObjectionsPage;