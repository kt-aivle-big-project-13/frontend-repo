import { useCallback, useEffect, useRef, useState } from 'react';

import type { AssessmentResponse } from '../../../features/pre-diagnosis/api/impactAssessmentApi';
import {
  startImpactAssessment,
  submitImpactAssessmentStage1,
  submitImpactAssessmentStage2,
} from '../../../features/pre-diagnosis/api/impactAssessmentApi';
import {
  areQualitativeAnswersComplete,
  areQuantitativeAnswersComplete,
  type AssessmentResultSource,
  type AssessmentStep,
  INITIAL_QUALITATIVE_ANSWERS,
  INITIAL_QUANTITATIVE_ANSWERS,
  type QualitativeAnswers,
  type QuantitativeAnswers,
  type YesNo,
  toStage1Answers,
  toStage2Answers,
} from '../../../features/pre-diagnosis/model/assessmentModel';
import { extractApiErrorMessage } from '../../../shared/api/client';
import MainLayout from '../../../widgets/layout/ui/MainLayout';
import StepIndicator from '../../audit/ui/StepIndicator';

import QualitativeSection from './sections/QualitativeSection';
import QuantitativeSection from './sections/QuantitativeSection';
import ResultSection from './sections/ResultSection';
import './PreDiagnosisPage.css';

function PreDiagnosisPage() {
  const hasStartedAssessmentRef = useRef(false);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('stage1');
  const [qualitativeAnswers, setQualitativeAnswers] =
    useState<QualitativeAnswers>(INITIAL_QUALITATIVE_ANSWERS);
  const [quantitativeAnswers, setQuantitativeAnswers] =
    useState<QuantitativeAnswers>(INITIAL_QUANTITATIVE_ANSWERS);
  const [assessmentResult, setAssessmentResult] =
    useState<AssessmentResponse | null>(null);
  const [resultSource, setResultSource] =
    useState<AssessmentResultSource | null>(null);
  const [isStartingAssessment, setIsStartingAssessment] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const startAssessment = useCallback(async (): Promise<number | null> => {
    try {
      setIsStartingAssessment(true);
      setErrorMessage('');

      const response = await startImpactAssessment();

      setAssessmentId(response.assessmentId);
      setAssessmentResult(response);

      return response.assessmentId;
    } catch (error: unknown) {
      setErrorMessage(
        extractApiErrorMessage(
          error,
          '사전진단을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        ),
      );
      return null;
    } finally {
      setIsStartingAssessment(false);
    }
  }, []);

  useEffect(() => {
    if (hasStartedAssessmentRef.current) {
      return;
    }

    hasStartedAssessmentRef.current = true;
    void startAssessment();
  }, [startAssessment]);

  const handleSelectQualitativeAnswer = (
    questionCode: keyof QualitativeAnswers,
    answer: YesNo,
  ) => {
    setQualitativeAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionCode]: answer,
    }));

    if (assessmentId) {
      setErrorMessage('');
    }
  };

  const handleSelectQuantitativeAnswer = (
    questionCode: keyof QuantitativeAnswers,
    answer: YesNo,
  ) => {
    setQuantitativeAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionCode]: answer,
    }));

    if (assessmentId) {
      setErrorMessage('');
    }
  };

  const handleSubmitStage1 = async () => {
    const nextAssessmentId = assessmentId ?? (await startAssessment());

    if (!nextAssessmentId) {
      return;
    }

    if (!areQualitativeAnswersComplete(qualitativeAnswers)) {
      setErrorMessage('모든 정성 게이트 문항에 응답해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const response = await submitImpactAssessmentStage1(
        nextAssessmentId,
        toStage1Answers(qualitativeAnswers),
      );

      setAssessmentResult(response);

      if (response.result === 'HIGH_IMPACT') {
        setResultSource('qualitative');
        setCurrentStep('result');
        return;
      }

      if (response.result === 'NEEDS_QUANTITATIVE') {
        setCurrentStep('stage2');
        return;
      }

      setErrorMessage('예상하지 못한 진단 결과가 반환되었습니다.');
    } catch (error: unknown) {
      setErrorMessage(extractApiErrorMessage(error, '정성 게이트 결과를 제출하지 못했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitStage2 = async () => {
    const nextAssessmentId = assessmentId ?? (await startAssessment());

    if (!nextAssessmentId) {
      return;
    }

    if (!areQuantitativeAnswersComplete(quantitativeAnswers)) {
      setErrorMessage('모든 정량 배점 문항에 응답해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const response = await submitImpactAssessmentStage2(
        nextAssessmentId,
        toStage2Answers(quantitativeAnswers),
      );

      setAssessmentResult(response);
      setResultSource('quantitative');
      setCurrentStep('result');
    } catch (error: unknown) {
      setErrorMessage(extractApiErrorMessage(error, '정량 배점 결과를 제출하지 못했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <section className="pre-diagnosis-page">
        <div className="pre-diagnosis-page__inner">
          <h1 className="pre-diagnosis-page__title">고영향 AI 사전진단</h1>
          <StepIndicator activeSteps={[1]} />
          <p className="pre-diagnosis-page__description">
            정성 게이트와 정량 배점 문항을 단계별로 확인해 고영향 AI 여부를
            판정합니다.
          </p>

          {currentStep === 'stage1' && (
            <QualitativeSection
              currentStep={currentStep}
              answers={qualitativeAnswers}
              errorMessage={errorMessage}
              isStartingAssessment={isStartingAssessment}
              isSubmitting={isSubmitting}
              onChangeAnswer={handleSelectQualitativeAnswer}
              onSubmit={handleSubmitStage1}
            />
          )}

          {currentStep === 'stage2' && (
            <QuantitativeSection
              currentStep={currentStep}
              answers={quantitativeAnswers}
              errorMessage={errorMessage}
              isSubmitting={isSubmitting}
              onChangeAnswer={handleSelectQuantitativeAnswer}
              onSubmit={handleSubmitStage2}
            />
          )}

          {currentStep === 'result' && assessmentResult && (
            <ResultSection
              currentStep={currentStep}
              result={assessmentResult}
              resultSource={resultSource}
            />
          )}
        </div>
      </section>
    </MainLayout>
  );
}

export default PreDiagnosisPage;