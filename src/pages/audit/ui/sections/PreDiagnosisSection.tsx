import { useMemo, useState } from 'react';

import './PreDiagnosisSection.css';

type GateAnswer = 'yes' | 'no' | null;

const A_GROUP_ITEMS = [
  { id: 'complexity', label: '모델 복잡도 높음 (블랙박스)' },
  { id: 'user-scale', label: '이용자 1만명 이상' },
  { id: 'intervention', label: '결과 개입 곤란' },
];

const B_GROUP_ITEMS = [
  { id: 'proxy-variable', label: '프록시 변수 사용' },
  { id: 'purpose-diversion', label: '용도 전용(轉用)' },
  { id: 'overseas-data', label: '해외 데이터 사용' },
];

const A_GROUP_POINT = 2;
const B_GROUP_POINT = 1;
const HIGH_IMPACT_THRESHOLD = 4;

interface PreDiagnosisSectionProps {
  onProceed: () => void;
}

function PreDiagnosisSection({ onProceed }: PreDiagnosisSectionProps) {
  const [q1, setQ1] = useState<GateAnswer>(null);
  const [q2, setQ2] = useState<GateAnswer>(null);
  const [checkedA, setCheckedA] = useState<Set<string>>(() => new Set());
  const [checkedB, setCheckedB] = useState<Set<string>>(() => new Set());

  const gatePassed = q1 === 'yes' || q2 === 'yes';
  const maxScore = A_GROUP_ITEMS.length * A_GROUP_POINT + B_GROUP_ITEMS.length * B_GROUP_POINT;
  const score = checkedA.size * A_GROUP_POINT + checkedB.size * B_GROUP_POINT;
  const isHighImpact = gatePassed && score >= HIGH_IMPACT_THRESHOLD;

  const verdictReason = useMemo(() => {
    const parts = [`정성 게이트 ${gatePassed ? '통과' : '미통과'}`];

    if (checkedA.size > 0) {
      parts.push(`A그룹 ${checkedA.size}개 충족`);
    }

    if (checkedB.size > 0) {
      parts.push(`B그룹 ${checkedB.size}개 충족`);
    }

    return parts.join(' + ');
  }, [gatePassed, checkedA.size, checkedB.size]);

  const handleToggleGroup = (
    group: 'a' | 'b',
    id: string,
  ) => {
    const setState = group === 'a' ? setCheckedA : setCheckedB;

    setState((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  return (
    <div className="pre-diagnosis-section">
      <p className="pre-diagnosis-section__subtitle">
        1단계 정성 게이트 → 2단계 정량 배점 ({HIGH_IMPACT_THRESHOLD}점 이상 고영향 판정)
      </p>

      <div className="pre-diagnosis-section__tabs">
        <span className="pre-diagnosis-section__tab pre-diagnosis-section__tab--active">
          1 정성 게이트
        </span>
        <span className="pre-diagnosis-section__tab pre-diagnosis-section__tab--done">
          2 정량 배점
        </span>
        <span className="pre-diagnosis-section__tab pre-diagnosis-section__tab--pending">
          3 판정 결과
        </span>
      </div>

      <div className="pre-diagnosis-section__layout">
        <div className="pre-diagnosis-section__main">
          <div className="pre-diagnosis-section__card">
            <h2 className="pre-diagnosis-section__card-title">STEP 1. 정성 게이트</h2>

            <div className="pre-diagnosis-section__question">
              <p className="pre-diagnosis-section__question-text">
                Q1. AI가 신용 의사결정을 주도합니까?
              </p>
              <div className="pre-diagnosis-section__answer-group">
                <button
                  type="button"
                  className={`pre-diagnosis-section__answer${q1 === 'yes' ? ' pre-diagnosis-section__answer--selected' : ''}`}
                  onClick={() => setQ1('yes')}
                >
                  예
                </button>
                <button
                  type="button"
                  className={`pre-diagnosis-section__answer${q1 === 'no' ? ' pre-diagnosis-section__answer--selected' : ''}`}
                  onClick={() => setQ1('no')}
                >
                  아니오
                </button>
              </div>
            </div>

            <div className="pre-diagnosis-section__question">
              <p className="pre-diagnosis-section__question-text">
                Q2. 민감정보 또는 프록시 데이터를 사용합니까?
              </p>
              <div className="pre-diagnosis-section__answer-group">
                <button
                  type="button"
                  className={`pre-diagnosis-section__answer${q2 === 'yes' ? ' pre-diagnosis-section__answer--selected' : ''}`}
                  onClick={() => setQ2('yes')}
                >
                  예
                </button>
                <button
                  type="button"
                  className={`pre-diagnosis-section__answer${q2 === 'no' ? ' pre-diagnosis-section__answer--selected' : ''}`}
                  onClick={() => setQ2('no')}
                >
                  아니오
                </button>
              </div>
            </div>
          </div>

          <div className="pre-diagnosis-section__card">
            <h2 className="pre-diagnosis-section__card-title">STEP 2. 정량 배점</h2>

            <p className="pre-diagnosis-section__group-label">
              A그룹 (각 {A_GROUP_POINT}점)
            </p>
            <ul className="pre-diagnosis-section__checklist">
              {A_GROUP_ITEMS.map((item) => (
                <li key={item.id}>
                  <label className="pre-diagnosis-section__checkbox-row">
                    <input
                      type="checkbox"
                      checked={checkedA.has(item.id)}
                      onChange={() => handleToggleGroup('a', item.id)}
                    />
                    <span>{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>

            <p className="pre-diagnosis-section__group-label">
              B그룹 (각 {B_GROUP_POINT}점)
            </p>
            <ul className="pre-diagnosis-section__checklist">
              {B_GROUP_ITEMS.map((item) => (
                <li key={item.id}>
                  <label className="pre-diagnosis-section__checkbox-row">
                    <input
                      type="checkbox"
                      checked={checkedB.has(item.id)}
                      onChange={() => handleToggleGroup('b', item.id)}
                    />
                    <span>{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="pre-diagnosis-section__sidebar">
          <div className="pre-diagnosis-section__verdict-card">
            <h2 className="pre-diagnosis-section__card-title">판정 결과</h2>

            <p className="pre-diagnosis-section__score-label">합산 점수</p>
            <p className="pre-diagnosis-section__score-value">
              {score}/{maxScore} 점
            </p>

            <span
              className={`pre-diagnosis-section__badge${isHighImpact ? ' pre-diagnosis-section__badge--high' : ' pre-diagnosis-section__badge--normal'}`}
            >
              {isHighImpact ? '고영향 AI' : '일반 AI'}
            </span>

            <p className="pre-diagnosis-section__reason">근거: {verdictReason}</p>

            <button type="button" className="pre-diagnosis-section__pdf-button">
              자가검토 결과서 PDF 저장 (33조)
            </button>
          </div>
        </aside>

        <button
          type="button"
          className="pre-diagnosis-section__proceed-button"
          disabled={!isHighImpact}
          onClick={onProceed}
        >
          감사로 진행 →
        </button>
      </div>
    </div>
  );
}

export default PreDiagnosisSection;
