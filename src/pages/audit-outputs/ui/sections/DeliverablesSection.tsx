import './DeliverablesSection.css';

interface Deliverable {
  id: string;
  label: string;
  fileType: 'PDF' | 'Word';
}

// TODO: 실제 산출물 생성 API 연동 필요 — 현재는 목업 목록
const DELIVERABLES: Deliverable[] = [
  { id: 'shap-report', label: '설명가능성 리포트 (SHAP)', fileType: 'PDF' },
  { id: 'fairness-report', label: '편향 진단 보고서 (Fairlearn)', fileType: 'PDF' },
  { id: 'compliance-verdict', label: '규제준수 판정서', fileType: 'PDF' },
  { id: 'improvement-guide', label: '개선 권고 가이드', fileType: 'Word' },
];

function DeliverablesSection() {
  return (
    <section className="deliverables-section">
      <h2 className="deliverables-section__title">자동 생성 보고서 4종</h2>

      <div className="deliverables-section__grid">
        {DELIVERABLES.map((deliverable) => (
          <div key={deliverable.id} className="deliverables-section__card">
            <span
              className={`deliverables-section__file deliverables-section__file--${deliverable.fileType.toLowerCase()}`}
            >
              {deliverable.fileType}
            </span>

            <div className="deliverables-section__card-body">
              <p className="deliverables-section__card-title">
                {deliverable.label}
              </p>
              <div className="deliverables-section__card-actions">
                <button type="button" className="deliverables-section__link">
                  미리보기
                </button>
                <span aria-hidden="true">·</span>
                <button type="button" className="deliverables-section__link">
                  다운로드
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default DeliverablesSection;
