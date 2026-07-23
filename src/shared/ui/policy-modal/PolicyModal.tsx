import PrivacyContent from './policy-content/PrivacyContent';
import TermsContent from './policy-content/TermsContent';
import './PolicyModal.css';

export type PolicyType = 'terms' | 'privacy';

interface PolicyModalProps {
  type: PolicyType;
  onClose: () => void;
}

const POLICY_TITLE: Record<PolicyType, string> = {
  terms: '이용약관',
  privacy: '개인정보처리방침',
};

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M4 4L14 14M14 4L4 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PolicyModal({ type, onClose }: PolicyModalProps) {
  return (
    <div
      className="policy-modal__overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="policy-modal"
        role="dialog"
        aria-modal="true"
        aria-label={POLICY_TITLE[type]}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="policy-modal__header">
          <h2 className="policy-modal__title">{POLICY_TITLE[type]}</h2>
          <button
            type="button"
            className="policy-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="policy-modal__body">
          {type === 'privacy' ? <PrivacyContent /> : <TermsContent />}
        </div>

        <div className="policy-modal__footer">
          <button
            type="button"
            className="policy-modal__confirm"
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default PolicyModal;
