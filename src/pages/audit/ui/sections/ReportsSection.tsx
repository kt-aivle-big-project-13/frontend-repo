import { Popover, message } from 'antd';
import { useState, type CSSProperties } from 'react';

import {
  generateAndDownloadBiasReport,
  generateAndDownloadComplianceReport,
  generateAndDownloadExplainabilityReport,
  generateAndDownloadFinalReport,
  generateAndDownloadHighImpactReport,
  generateAndDownloadImprovementGuide,
  type ReportFormat,
} from '../../../../features/audit/api/reportApi';
import './ReportsSection.css';

interface ReportsSectionProps {
  auditId: number;
  // 사전진단을 건너뛰고 시작한 감사에는 연결된 사전진단이 없어 해당 보고서를 만들 수 없다.
  hasPreDiagnosis: boolean;
}

type ReportKind = 'high-impact' | 'shap' | 'bias' | 'compliance' | 'improvement';

interface ReportItem {
  id: string;
  label: string;
  kind: ReportKind;
  // 백엔드가 실제로 만들어주는 형식만 나열
  // AI 서버가 만들지 않는 형식은 선택지에 보이지 않게 한다.
  formats: ReportFormat[];
}

const REPORTS: ReportItem[] = [
  {
    id: 'high-impact-ai',
    label: '고영향 AI 사전진단',
    kind: 'high-impact',
    formats: ['PDF', 'WORD'],
  },
  {
    id: 'shap-report',
    label: '설명가능성 리포트 (SHAP)',
    kind: 'shap',
    formats: ['PDF', 'WORD'],
  },
  {
    id: 'fairness-report',
    label: '편향 진단 보고서 (Fairlearn)',
    kind: 'bias',
    formats: ['PDF', 'WORD'],
  },
  {
    id: 'compliance-verdict',
    label: '규제준수 판정서',
    kind: 'compliance',
    formats: ['PDF', 'WORD'],
  },
  {
    id: 'improvement-guide',
    label: '개선 권고 가이드',
    kind: 'improvement',
    formats: ['PDF', 'WORD'],
  },
];

// 최종 보고서는 카드 목록과 달리 백엔드가 PDF·WORD만 만들어준다.
const FINAL_REPORT_FORMATS: ReportFormat[] = ['PDF', 'WORD'];
const FINAL_REPORT_KEY = 'final-report';

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M6 2.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V4A1.5 1.5 0 0 1 6 2.5Z"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 2.5V7h4"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8 12h8M8 15.5h8M8 18.5h5"
        stroke="#ffffff"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FileTile({ format }: { format: ReportFormat }) {
  if (format === 'WORD') {
    return (
      <span className="reports-section__file-tile reports-section__file-tile--word">
        Word
      </span>
    );
  }

  return (
    <span className="reports-section__file-tile reports-section__file-tile--pdf">
      PDF
    </span>
  );
}

function ReportsSection({ auditId, hasPreDiagnosis }: ReportsSectionProps) {
  // 사전진단을 건너뛴 감사에서 카드를 눌러도 서버가 연결된 사전진단을 찾지 못해 실패하므로,
  // 실패를 보여주는 대신 카드 자체를 내보내지 않는다.
  const visibleReports = hasPreDiagnosis
    ? REPORTS
    : REPORTS.filter((report) => report.kind !== 'high-impact');

  // 카드/버튼별로 독립적으로 로딩 표시하기 위해 "리포트id:포맷"을 키로 관리한다.
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const handleReportDownload = async (
    report: ReportItem,
    format: ReportFormat,
  ) => {
    const key = `${report.id}:${format}`;
    setPendingKey(key);

    // 이미 만들어 둔 산출물이면 생성 없이 바로 내려받으므로
    // 안내 문구에서 "생성"으로 단정하지 않는다.
    const hide = message.loading(
      `${report.label} (${format}) 준비 중…`,
      0,
    );

    try {
      if (report.kind === 'high-impact') {
        await generateAndDownloadHighImpactReport(auditId, format);
      } else if (report.kind === 'shap') {
        await generateAndDownloadExplainabilityReport(auditId, format);
      } else if (report.kind === 'bias') {
        await generateAndDownloadBiasReport(auditId, format);
      } else if (report.kind === 'compliance') {
        await generateAndDownloadComplianceReport(auditId, format);
      } else {
        await generateAndDownloadImprovementGuide(auditId, format);
      }

      message.success(
        `${report.label} (${format}) 다운로드가 완료됐습니다.`,
      );
    } catch {
      message.error(
        `${report.label} 생성 또는 다운로드에 실패했습니다.`,
      );
    } finally {
      hide();
      setPendingKey(null);
    }
  };

  const handleFinalDownload = async (format: ReportFormat) => {
    setPendingKey(FINAL_REPORT_KEY);
    // 5종과 마찬가지로 이미 만들어 둔 산출물이면 생성 없이 바로 내려받으므로 "생성"으로 단정하지 않는다.
    const hide = message.loading(`최종 보고서 (${format}) 준비 중…`, 0);

    try {
      await generateAndDownloadFinalReport(auditId, format);
      message.success(`최종 보고서 (${format}) 다운로드가 완료됐습니다.`);
    } catch {
      message.error('최종 보고서 생성 또는 다운로드에 실패했습니다.');
    } finally {
      hide();
      setPendingKey(null);
    }
  };

  // 진행 중에는 열려 있는 메뉴의 두 형식 모두 막는다. 조회에서 아직 산출물을 찾지 못한
  // 사이에 다시 누르면 생성 요청이 겹쳐 S3 객체와 DB 행이 중복으로 쌓인다.
  const finalDownloadMenu = (
    <div className="reports-section__download-menu">
      {FINAL_REPORT_FORMATS.map((format) => (
        <button
          key={format}
          type="button"
          className="reports-section__download-item"
          disabled={pendingKey === FINAL_REPORT_KEY}
          onClick={() => handleFinalDownload(format)}
        >
          <FileTile format={format} />
          <span className="reports-section__download-label">다운로드</span>
        </button>
      ))}
    </div>
  );

  return (
    <section className="reports-section">
      <h2 className="reports-section__title">
        자동 생성 보고서 {visibleReports.length}종
      </h2>

      <div
        className="reports-section__grid"
        style={
          {
            '--report-count': visibleReports.length,
          } as CSSProperties
        }
      >
        {visibleReports.map((report) => {
          const downloadMenu = (
            <div className="reports-section__download-menu">
              {report.formats.map((format) => (
                <button
                  key={format}
                  type="button"
                  className="reports-section__download-item"
                  disabled={pendingKey === `${report.id}:${format}`}
                  onClick={() =>
                    handleReportDownload(report, format)
                  }
                >
                  <FileTile format={format} />

                  <span className="reports-section__download-label">
                    다운로드
                  </span>
                </button>
              ))}
            </div>
          );

          return (
            <Popover
              key={report.id}
              content={downloadMenu}
              trigger="click"
              placement="bottom"
            >
              <button
                type="button"
                className="reports-section__card"
              >
                <span
                  className="reports-section__card-icon"
                  aria-hidden="true"
                >
                  <DocumentIcon />
                </span>

                <span className="reports-section__card-label">
                  {report.label}
                </span>

                <span className="reports-section__card-note">
                  {report.formats.join(' · ')} 중 선택
                </span>
              </button>
            </Popover>
          );
        })}
      </div>

      <div className="reports-section__action-bar">
        <Popover
          content={finalDownloadMenu}
          trigger="click"
          placement="bottomRight"
        >
          <button
            type="button"
            className="reports-section__final-button"
            disabled={pendingKey === FINAL_REPORT_KEY}
          >
            <span>최종 보고서 다운로드</span>

            <img
              src="/download-icon-2.png"
              alt=""
              className="reports-section__final-button-icon"
              aria-hidden="true"
            />
          </button>
        </Popover>
      </div>
    </section>
  );
}

export default ReportsSection;
