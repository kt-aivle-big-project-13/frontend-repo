import { apiClient } from '../../../shared/api/client';

export type ReportFormat = 'PDF' | 'WORD' | 'HTML';
export type ReportStatus = 'GENERATING' | 'COMPLETED' | 'FAILED';

// 인증 헤더가 필요해 <a href>로 바로 내려받을 수 없으므로, blob으로 받아 임시 링크를 눌러 저장한다.
function saveBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

const FORMAT_EXTENSION: Record<ReportFormat, string> = {
  PDF: 'pdf',
  WORD: 'docx',
  HTML: 'html',
};

interface GeneratedReportItem {
  reportId: number;
  reportType: string;
  format: ReportFormat;
  status: ReportStatus;
}

interface ReportGenerationResponse {
  auditId: number;
  reports: GeneratedReportItem[];
}

// 최종 종합 보고서(4종 통합)
export async function generateFinalReport(
  auditId: number,
  formats: ReportFormat[],
): Promise<ReportGenerationResponse> {
  const { data } = await apiClient.post<ReportGenerationResponse>(
    `/audits/${auditId}/deliverables`,
    { formats },
  );

  return data;
}

export async function downloadDeliverable(
  reportId: number,
  filename: string,
): Promise<void> {
  const response = await apiClient.get(`/deliverables/${reportId}/download`, {
    responseType: 'blob',
  });

  saveBlob(response.data as Blob, filename);
}

// 설명가능성(SHAP)·편향진단(Fairlearn) 리포트는 생성 요청이 동기적으로 끝나서(폴링 불필요),
// 생성 응답에 이미 포맷별 reportId가 담겨 온다 — 그중 원하는 포맷 하나를 골라 바로 다운로드한다.
async function generateAndDownloadReport(options: {
  auditId: number;
  format: ReportFormat;
  namePrefix: string;
  generate: () => Promise<{ reports: GeneratedReportItem[] }>;
  download: (reportId: number) => Promise<void>;
}): Promise<void> {
  const { reports } = await options.generate();
  const target = reports.find((report) => report.format === options.format);

  if (!target) {
    throw new Error('요청한 형식의 보고서를 찾을 수 없습니다.');
  }

  await options.download(target.reportId);
}

export async function generateAndDownloadExplainabilityReport(
  auditId: number,
  format: ReportFormat,
): Promise<void> {
  await generateAndDownloadReport({
    auditId,
    format,
    namePrefix: '설명가능성_리포트',
    generate: async () => {
      const { data } = await apiClient.post<{ reports: GeneratedReportItem[] }>(
        `/audits/${auditId}/reports/explainability`,
      );
      return data;
    },
    download: async (reportId) => {
      const response = await apiClient.get(
        `/audits/${auditId}/reports/explainability/${reportId}/download`,
        { responseType: 'blob' },
      );
      saveBlob(
        response.data as Blob,
        `설명가능성_리포트_${auditId}.${FORMAT_EXTENSION[format]}`,
      );
    },
  });
}

export async function generateAndDownloadBiasReport(
  auditId: number,
  format: ReportFormat,
): Promise<void> {
  await generateAndDownloadReport({
    auditId,
    format,
    namePrefix: '편향진단_보고서',
    generate: async () => {
      const { data } = await apiClient.post<{ reports: GeneratedReportItem[] }>(
        `/audits/${auditId}/reports/bias`,
      );
      return data;
    },
    download: async (reportId) => {
      const response = await apiClient.get(
        `/audits/${auditId}/reports/bias/${reportId}/download`,
        { responseType: 'blob' },
      );
      saveBlob(
        response.data as Blob,
        `편향진단_보고서_${auditId}.${FORMAT_EXTENSION[format]}`,
      );
    },
  });
}
