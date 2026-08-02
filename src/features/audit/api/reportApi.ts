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

export async function downloadDeliverable(reportId: number, filename: string): Promise<void> {
  const response = await apiClient.get(`/deliverables/${reportId}/download`, {
    responseType: 'blob',
  });

  saveBlob(response.data as Blob, filename);
}

// 설명가능성(SHAP)·편향진단(Fairlearn) 리포트 생성 응답은 HTML 리포트 id 하나만 돌려준다
// (호출 한 번으로 HTML·PDF·WORD가 서버에 다 같이 저장됨). 원하는 포맷의 reportId는 별도
// 조회(getLatest?format=)로 받아와야 한다.
interface ReportMetadataResponse {
  reportId: number;
  auditId: number;
  reportType: string;
  format: ReportFormat;
  status: ReportStatus;
  version: number;
  generatedAt: string;
}

async function generateAndDownloadReport(options: {
  format: ReportFormat;
  generate: () => Promise<void>;
  getLatest: (format: ReportFormat) => Promise<ReportMetadataResponse>;
  download: (reportId: number) => Promise<void>;
}): Promise<void> {
  await options.generate();
  const metadata = await options.getLatest(options.format);
  await options.download(metadata.reportId);
}

export async function generateAndDownloadExplainabilityReport(
  auditId: number,
  format: ReportFormat,
): Promise<void> {
  await generateAndDownloadReport({
    format,
    generate: async () => {
      await apiClient.post(`/audits/${auditId}/reports/explainability`);
    },
    getLatest: async (fmt) => {
      const { data } = await apiClient.get<ReportMetadataResponse>(
        `/audits/${auditId}/reports/explainability`,
        { params: { format: fmt } },
      );
      return data;
    },
    download: async (reportId) => {
      const response = await apiClient.get(
        `/audits/${auditId}/reports/explainability/${reportId}/download`,
        { responseType: 'blob' },
      );
      saveBlob(response.data as Blob, `설명가능성_리포트_${auditId}.${FORMAT_EXTENSION[format]}`);
    },
  });
}

export async function generateAndDownloadBiasReport(
  auditId: number,
  format: ReportFormat,
): Promise<void> {
  await generateAndDownloadReport({
    format,
    generate: async () => {
      await apiClient.post(`/audits/${auditId}/reports/bias`);
    },
    getLatest: async (fmt) => {
      const { data } = await apiClient.get<ReportMetadataResponse>(
        `/audits/${auditId}/reports/bias`,
        { params: { format: fmt } },
      );
      return data;
    },
    download: async (reportId) => {
      const response = await apiClient.get(`/audits/${auditId}/reports/bias/${reportId}/download`, {
        responseType: 'blob',
      });
      saveBlob(response.data as Blob, `편향진단_보고서_${auditId}.${FORMAT_EXTENSION[format]}`);
    },
  });
}

export async function generateAndDownloadComplianceReport(
  auditId: number,
  format: ReportFormat,
): Promise<void> {
  await generateAndDownloadReport({
    format,
    generate: async () => {
      await apiClient.post(`/audits/${auditId}/reports/compliance`);
    },
    getLatest: async (fmt) => {
      const { data } = await apiClient.get<ReportMetadataResponse>(
        `/audits/${auditId}/reports/compliance`,
        { params: { format: fmt } },
      );
      return data;
    },
    download: async (reportId) => {
      const response = await apiClient.get(
        `/audits/${auditId}/reports/compliance/${reportId}/download`,
        { responseType: 'blob' },
      );
      saveBlob(response.data as Blob, `규제준수_판정서_${auditId}.${FORMAT_EXTENSION[format]}`);
    },
  });
}

export async function generateAndDownloadHighImpactReport(
  auditId: number,
  format: ReportFormat,
): Promise<void> {
  await generateAndDownloadReport({
    format,
    generate: async () => {
      await apiClient.post(`/audits/${auditId}/reports/high-impact-assessment`);
    },
    getLatest: async (fmt) => {
      const { data } = await apiClient.get<ReportMetadataResponse>(
        `/audits/${auditId}/reports/high-impact-assessment`,
        { params: { format: fmt } },
      );
      return data;
    },
    download: async (reportId) => {
      const response = await apiClient.get(
        `/audits/${auditId}/reports/high-impact-assessment/${reportId}/download`,
        { responseType: 'blob' },
      );

      saveBlob(
        response.data as Blob,
        `고영향_AI_사전진단_보고서_${auditId}.${FORMAT_EXTENSION[format]}`,
      );
    },
  });
}