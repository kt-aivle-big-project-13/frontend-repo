import { useNavigate } from 'react-router-dom';

import type { AssessmentResponse } from '../../../../features/pre-diagnosis/api/impactAssessmentApi';
import type {
  AssessmentResultSource,
  AssessmentStep,
} from '../../../../features/pre-diagnosis/model/assessmentModel';

import PreDiagnosisTabs from './PreDiagnosisTabs';

interface ResultSectionProps {
  currentStep: AssessmentStep;
  result: AssessmentResponse;
  resultSource: AssessmentResultSource | null;
}

function ResultSection({
  currentStep,
  result,
  resultSource,
}: ResultSectionProps) {
  const navigate = useNavigate();
  const isHighImpact = result.result === 'HIGH_IMPACT';
  const isQuantitativeResult = resultSource === 'quantitative';

  const handleSavePdf = () => {
    window.alert('PDF 저장 기능은 준비 중입니다.');
  };

  const handleProceedAudit = () => {
    navigate('/audit');
  };

  return (
    <div className="pre-diagnosis-page__step-card">
      <div className="pre-diagnosis-page__step-header">
        <span className="pre-diagnosis-page__step-badge">Step 3</span>
        <div>
          <h2 className="pre-diagnosis-page__step-title">판정 결과</h2>
          <p className="pre-diagnosis-page__step-description">
            정성 게이트와 정량 배점 결과를 기준으로 고영향 AI 해당 여부를
            확인합니다.
          </p>
          <PreDiagnosisTabs currentStep={currentStep} />
        </div>
      </div>

      <div className="pre-diagnosis-page__result-panel">
        <div
          className={
            isHighImpact
              ? 'pre-diagnosis-page__result-summary pre-diagnosis-page__result-summary--high'
              : 'pre-diagnosis-page__result-summary pre-diagnosis-page__result-summary--not-applicable'
          }
        >
          <span className="pre-diagnosis-page__result-label">판정 결과</span>
          <strong className="pre-diagnosis-page__result-value">
            {isHighImpact ? '고영향 AI' : '고영향 AI 미해당'}
          </strong>
        </div>

        {isQuantitativeResult && (
          <div className="pre-diagnosis-page__score-grid">
            <div className="pre-diagnosis-page__score-card">
              <span>A그룹 점수</span>
              <strong>{result.groupAScore}점</strong>
            </div>
            <div className="pre-diagnosis-page__score-card">
              <span>B그룹 점수</span>
              <strong>{result.groupBScore}점</strong>
            </div>
            <div className="pre-diagnosis-page__score-card pre-diagnosis-page__score-card--total">
              <span>합산 점수</span>
              <strong>{result.totalScore}점</strong>
            </div>
          </div>
        )}

        <div className="pre-diagnosis-page__reason-box">
          <h3>판정 근거</h3>
          <p>
            {resultSource === 'qualitative'
              ? '정성 게이트 검토 결과, 고영향 AI 판단 기준에 해당하는 항목이 확인되었습니다.'
              : isHighImpact
                ? '정량 배점 기준에 따라 검토한 결과, 고영향 AI 분류 요건을 충족합니다.'
                : '정량 배점 기준에 따라 검토한 결과, 고영향 AI 분류 요건에 해당하지 않습니다.'}
          </p>
        </div>

        <div className="pre-diagnosis-page__result-actions">
          <button
            type="button"
            className="pre-diagnosis-page__secondary-button"
            onClick={handleSavePdf}
          >
            자가검토 결과서 PDF 저장
          </button>
          <button
            type="button"
            className="pre-diagnosis-page__submit"
            disabled={!isHighImpact}
            onClick={handleProceedAudit}
          >
            감사로 진행
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultSection;
