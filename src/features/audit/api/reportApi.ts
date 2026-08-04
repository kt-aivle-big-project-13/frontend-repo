import { isAxiosError } from 'axios';

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

interface ApiErrorResponse {
  code?: string;
}

// 아직 산출물을 만든 적이 없을 때만 내려오는 도메인 오류 코드(REPORT_NOT_FOUND).
// 감사 자체가 없는 경우처럼 다른 이유로도 404가 오므로 상태 코드만으로 판단하면
// 없는 감사에 생성 요청을 보내게 된다.
const REPORT_NOT_FOUND_CODE = 'EM017';

async function findLatestReport(
  getLatest: (format: ReportFormat) => Promise<ReportMetadataResponse>,
  format: ReportFormat,
): Promise<ReportMetadataResponse | null> {
  try {
    return await getLatest(format);
  } catch (error) {
    if (
      isAxiosError<ApiErrorResponse>(error) &&
      error.response?.status === 404 &&
      error.response.data?.code === REPORT_NOT_FOUND_CODE
    ) {
      return null;
    }

    // 그 밖의 오류(다른 404, 권한, 서버 장애)는 그대로 던져 호출부가 실패로 처리하게 둔다.
    throw error;
  }
}

async function generateAndDownloadReport(options: {
  format: ReportFormat;
  generate: () => Promise<void>;
  getLatest: (format: ReportFormat) => Promise<ReportMetadataResponse>;
  download: (reportId: number) => Promise<void>;
}): Promise<void> {
  // 이미 만들어 둔 산출물이 있으면 다시 만들지 않는다. 생성은 AI 서버 호출이라 오래 걸리고,
  // 호출할 때마다 S3 객체와 DB 행이 새로 쌓인다.
  //
  // 백엔드는 생성이 끝난 뒤에야 행을 남기므로(ReportEntity.create 가 COMPLETED 로 고정)
  // 조회된 산출물은 사실상 항상 완료 상태다. 아래 상태 확인은 방어적 장치이고, 완료가
  // 아니면 내려받을 파일이 없으므로 다시 만든다.
  // 훗날 백엔드가 GENERATING 을 남기는 비동기 생성으로 바뀌면, 그때는 재생성이 아니라
  // 완료될 때까지 기다리도록 이 분기를 나눠야 한다.
  const existing = await findLatestReport(options.getLatest, options.format);

  if (existing?.status === 'COMPLETED') {
    await options.download(existing.reportId);
    return;
  }

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

export async function generateAndDownloadImprovementGuide(
  auditId: number,
  format: ReportFormat,
): Promise<void> {
  await generateAndDownloadReport({
    format,
    generate: async () => {
      await apiClient.post(`/audits/${auditId}/reports/improvement`);
    },
    getLatest: async (fmt) => {
      const { data } = await apiClient.get<ReportMetadataResponse>(
        `/audits/${auditId}/reports/improvement`,
        { params: { format: fmt } },
      );
      return data;
    },
    download: async (reportId) => {
      const response = await apiClient.get(
        `/audits/${auditId}/reports/improvement/${reportId}/download`,
        { responseType: 'blob' },
      );
      saveBlob(response.data as Blob, `개선_권고_가이드_${auditId}.${FORMAT_EXTENSION[format]}`);
    },
  });
}

// 최종 종합 보고서(리포트 5종 통합). 자율점검이 끝나면 백엔드가 미리 만들어 두므로
// 대개 생성 없이 조회 → 다운로드로 끝난다.
export async function generateAndDownloadFinalReport(
  auditId: number,
  format: ReportFormat,
): Promise<void> {
  await generateAndDownloadReport({
    format,
    generate: async () => {
      await apiClient.post(`/audits/${auditId}/deliverables`, { formats: [format] });
    },
    getLatest: async (fmt) => {
      const { data } = await apiClient.get<ReportMetadataResponse>(
        `/audits/${auditId}/deliverables/latest`,
        { params: { format: fmt } },
      );
      return data;
    },
    download: async (reportId) => {
      const response = await apiClient.get(`/deliverables/${reportId}/download`, {
        responseType: 'blob',
      });
      saveBlob(response.data as Blob, `최종_보고서_${auditId}.${FORMAT_EXTENSION[format]}`);
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