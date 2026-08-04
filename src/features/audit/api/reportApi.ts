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

// ---- 사전 생성(pregenerate) ----
// 사용자가 결과 페이지에서 다운로드 버튼을 누르기 전에, 감사 흐름의 특정 시점(감사 시작·
// 체크리스트 제출 완료)에 미리 만들어 둬서 대개는 다운로드 시점에 생성 없이 바로 받을 수
// 있게 한다. 실패해도 조용히 넘어간다 — 다운로드 시점에 generateAndDownload*가 없으면
// 그때 다시 만들기 때문에(재사용 로직), 사전 생성은 "미리 해두면 좋은" 최적화일 뿐이라
// 실패가 감사 진행 자체를 막으면 안 된다.

async function pregenerateReport(options: {
  generate: () => Promise<void>;
  getLatest: (format: ReportFormat) => Promise<ReportMetadataResponse>;
}): Promise<void> {
  // PDF 존재 여부만 대표로 확인한다 — 아래 5종은 생성 엔드포인트 한 번 호출로 PDF·WORD·HTML이
  // 함께 만들어지므로(설명가능성/편향진단 주석 참고) 하나만 확인해도 충분하다.
  const existing = await findLatestReport(options.getLatest, 'PDF');
  if (existing?.status === 'COMPLETED') return;
  await options.generate();
}

export async function pregenerateExplainabilityReport(auditId: number): Promise<void> {
  await pregenerateReport({
    generate: async () => {
      await apiClient.post(`/audits/${auditId}/reports/explainability`);
    },
    getLatest: async (format) => {
      const { data } = await apiClient.get<ReportMetadataResponse>(
        `/audits/${auditId}/reports/explainability`,
        { params: { format } },
      );
      return data;
    },
  });
}

export async function pregenerateBiasReport(auditId: number): Promise<void> {
  await pregenerateReport({
    generate: async () => {
      await apiClient.post(`/audits/${auditId}/reports/bias`);
    },
    getLatest: async (format) => {
      const { data } = await apiClient.get<ReportMetadataResponse>(
        `/audits/${auditId}/reports/bias`,
        { params: { format } },
      );
      return data;
    },
  });
}

export async function pregenerateHighImpactReport(auditId: number): Promise<void> {
  await pregenerateReport({
    generate: async () => {
      await apiClient.post(`/audits/${auditId}/reports/high-impact-assessment`);
    },
    getLatest: async (format) => {
      const { data } = await apiClient.get<ReportMetadataResponse>(
        `/audits/${auditId}/reports/high-impact-assessment`,
        { params: { format } },
      );
      return data;
    },
  });
}

export async function pregenerateComplianceReport(auditId: number): Promise<void> {
  await pregenerateReport({
    generate: async () => {
      await apiClient.post(`/audits/${auditId}/reports/compliance`);
    },
    getLatest: async (format) => {
      const { data } = await apiClient.get<ReportMetadataResponse>(
        `/audits/${auditId}/reports/compliance`,
        { params: { format } },
      );
      return data;
    },
  });
}

export async function pregenerateImprovementGuide(auditId: number): Promise<void> {
  await pregenerateReport({
    generate: async () => {
      await apiClient.post(`/audits/${auditId}/reports/improvement`);
    },
    getLatest: async (format) => {
      const { data } = await apiClient.get<ReportMetadataResponse>(
        `/audits/${auditId}/reports/improvement`,
        { params: { format } },
      );
      return data;
    },
  });
}

// 최종 보고서는 다른 5종과 달리 생성 요청이 형식을 직접 받으므로(다른 5종은 호출 한 번에
// PDF·WORD가 함께 만들어짐), PDF·WORD 각각 존재 여부를 확인해 아직 없는 형식만 모아 한 번에
// 요청한다.
const FINAL_REPORT_PREGEN_FORMATS: ReportFormat[] = ['PDF', 'WORD'];

export async function pregenerateFinalReport(auditId: number): Promise<void> {
  const getLatest = async (format: ReportFormat) => {
    const { data } = await apiClient.get<ReportMetadataResponse>(
      `/audits/${auditId}/deliverables/latest`,
      { params: { format } },
    );
    return data;
  };

  const missingFormats = (
    await Promise.all(
      FINAL_REPORT_PREGEN_FORMATS.map(async (format) => {
        const existing = await findLatestReport(getLatest, format);
        return existing?.status === 'COMPLETED' ? null : format;
      }),
    )
  ).filter((format): format is ReportFormat => format !== null);

  if (missingFormats.length === 0) return;

  await apiClient.post(`/audits/${auditId}/deliverables`, { formats: missingFormats });
}

// 하나가 실패해도 나머지는 계속 진행하고, 실패는 콘솔에만 남긴다 — 사전 생성 실패로
// 감사 시작·체크리스트 제출 같은 사용자 플로우를 막으면 안 된다.
async function runPregenBatch(tasks: Array<() => Promise<void>>): Promise<void> {
  const results = await Promise.allSettled(tasks.map((task) => task()));
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error('보고서 사전 생성 실패', result.reason);
    }
  });
}

// 감사 시작 시점에 만들 수 있는 보고서(체크리스트 불필요): 설명가능성·편향진단은 항상,
// 고영향 AI 사전진단은 사전진단을 건너뛰지 않고 진행한 경우에만 대상에 포함한다.
export async function pregenerateAuditStartReports(
  auditId: number,
  options: { hasPreDiagnosis: boolean },
): Promise<void> {
  const tasks: Array<() => Promise<void>> = [
    () => pregenerateExplainabilityReport(auditId),
    () => pregenerateBiasReport(auditId),
  ];

  if (options.hasPreDiagnosis) {
    tasks.push(() => pregenerateHighImpactReport(auditId));
  }

  await runPregenBatch(tasks);
}

// 체크리스트(자가점검) 제출 완료 + 모델 분석 완료 시점에 만들 수 있는 보고서. 자가점검을
// 건너뛴 경우 규제준수 판정 근거가 없으므로 호출부에서 아예 이 함수를 부르지 않는다
// (개선 권고 가이드·최종 보고서도 규제준수 판정에 기반해 함께 막는다).
export async function pregenerateChecklistReports(auditId: number): Promise<void> {
  await runPregenBatch([
    () => pregenerateComplianceReport(auditId),
    () => pregenerateImprovementGuide(auditId),
    () => pregenerateFinalReport(auditId),
  ]);
}