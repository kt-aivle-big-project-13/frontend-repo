import { Popover, message } from 'antd';
import { useState } from 'react';

import {
  generateAndDownloadBiasReport,
  generateAndDownloadComplianceReport,
  generateAndDownloadExplainabilityReport,
  generateAndDownloadHighImpactReport,
  generateFinalReport,
  downloadDeliverable,
  type ReportFormat,
} from '../../../../features/audit/api/reportApi';
import './ReportsSection.css';

interface ReportsSectionProps {
  auditId: number;
}

type ReportKind = 'high-impact' | 'shap' | 'bias' | 'compliance' | 'unavailable';

interface ReportItem {
  id: string;
  label: string;
  kind: ReportKind;
  // 백엔드가 실제로 만들어주는 형식만 나열 (AI 서버가 만들지 않는 형식은 선택지에 안 보이게)
  formats: ReportFormat[];
}

const REPORTS: ReportItem[] = [
  {
    id: 'high-impact-ai',
    label: '고영향 AI 사전진단',
    kind: 'high-impact',
    formats: ['PDF', 'WORD'],
  },
  { id: 'shap-report', label: '설명가능성 리포트 (SHAP)', kind: 'shap', formats: ['PDF', 'WORD'] },
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
  // 개선 권고 가이드는 백엔드 연동이 아직 develop에 머지되지 않아(진행 중, #190) 대기 상태로 둔다.
  { id: 'improvement-guide', label: '개선 권고 가이드', kind: 'unavailable', formats: [] },
];

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M6 2.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V4A1.5 1.5 0 0 1 6 2.5Z"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 2.5V7h4" stroke="#ffffff" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 12h8M8 15.5h8M8 18.5h5" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function FileTile({ format }: { format: ReportFormat }) {
  if (format === 'WORD') {
    return (
      <span className="reports-section__file-tile reports-section__file-tile--word">Word</span>
    );
  }

  return <span className="reports-section__file-tile reports-section__file-tile--pdf">PDF</span>;
}

function ReportsSection({ auditId }: ReportsSectionProps) {
  // 카드/버튼별로 독립적으로 로딩 표시하기 위해 "리포트id:포맷"을 키로 관리
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const handleReportDownload = async (report: ReportItem, format: ReportFormat) => {
    const key = `${report.id}:${format}`;
    setPendingKey(key);
    const hide = message.loading(`${report.label} (${format}) 생성 중…`, 0);

    try {
      if (report.kind === 'high-impact') {
        await generateAndDownloadHighImpactReport(auditId, format);
      } else if (report.kind === 'shap') {
        await generateAndDownloadExplainabilityReport(auditId, format);
      } else if (report.kind === 'bias') {
        await generateAndDownloadBiasReport(auditId, format);
      } else {
        await generateAndDownloadComplianceReport(auditId, format);
      }

      message.success(`${report.label} (${format}) 다운로드가 완료됐습니다.`);
    } catch {
      message.error(`${report.label} 생성 또는 다운로드에 실패했습니다.`);
    } finally {
      hide();
      setPendingKey(null);
    }
  };

  const handleFinalDownload = async (format: ReportFormat) => {
    setPendingKey('final-report');
    const hide = message.loading('최종 보고서 생성 중…', 0);

    try {
      const { reports } = await generateFinalReport(auditId, [format]);
      const target = reports[0];

      if (!target) {
        throw new Error('생성된 보고서가 없습니다.');
      }

      await downloadDeliverable(
        target.reportId,
        `최종_보고서_${auditId}.${format === 'PDF' ? 'pdf' : 'docx'}`,
      );
      message.success('최종 보고서 다운로드가 완료됐습니다.');
    } catch {
      message.error('최종 보고서 생성에 실패했습니다.');
    } finally {
      hide();
      setPendingKey(null);
    }
  };

  const finalDownloadMenu = (
    <div className="reports-section__download-menu">
      <button
        type="button"
        className="reports-section__download-item"
        onClick={() => handleFinalDownload('PDF')}
      >
        <FileTile format="PDF" />
        <span className="reports-section__download-label">다운로드</span>
      </button>
      <button
        type="button"
        className="reports-section__download-item"
        onClick={() => handleFinalDownload('WORD')}
      >
        <FileTile format="WORD" />
        <span className="reports-section__download-label">다운로드</span>
      </button>
    </div>
  );

  return (
    <section className="reports-section">
      <h2 className="reports-section__title">자동 생성 보고서 5종</h2>

      <div className="reports-section__grid">
        {REPORTS.map((report) => {
          if (report.kind === 'unavailable') {
            return (
              <button
                key={report.id}
                type="button"
                className="reports-section__card"
                onClick={() =>
                  // TODO: 개선 권고 가이드는 백엔드 연동 완료 후 연결
                  message.info('이 보고서 종류는 개별 다운로드 기능을 추후에 개발할 예정입니다.')
                }
              >
                <span className="reports-section__card-icon" aria-hidden="true">
                  <DocumentIcon />
                </span>
                <span className="reports-section__card-label">{report.label}</span>
                <span className="reports-section__card-note">개발 예정</span>
              </button>
            );
          }

          const downloadMenu = (
            <div className="reports-section__download-menu">
              {report.formats.map((format) => (
                <button
                  key={format}
                  type="button"
                  className="reports-section__download-item"
                  disabled={pendingKey === `${report.id}:${format}`}
                  onClick={() => handleReportDownload(report, format)}
                >
                  <FileTile format={format} />
                  <span className="reports-section__download-label">다운로드</span>
                </button>
              ))}
            </div>
          );

          return (
            <Popover key={report.id} content={downloadMenu} trigger="click" placement="bottom">
              <button type="button" className="reports-section__card">
                <span className="reports-section__card-icon" aria-hidden="true">
                  <DocumentIcon />
                </span>
                <span className="reports-section__card-label">{report.label}</span>
                <span className="reports-section__card-note">
                  {report.formats.join(' · ')} 중 선택
                </span>
              </button>
            </Popover>
          );
        })}
      </div>

      <div className="reports-section__action-bar">
        <Popover content={finalDownloadMenu} trigger="click" placement="bottomRight">
          <button
            type="button"
            className="reports-section__final-button"
            disabled={pendingKey === 'final-report'}
          >
            최종 보고서 다운로드 ↓
          </button>
        </Popover>
      </div>
    </section>
  );
}

export default ReportsSection;