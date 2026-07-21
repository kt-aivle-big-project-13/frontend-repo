const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:8080';

const REQUEST_TIMEOUT_MS = 10_000;

export interface FindPasswordRequest {
  name: string;
  email: string;
}

export interface FindPasswordResponse {
  message: string;
  expiresIn?: number;
}

export async function findPassword({
  name,
  email,
}: FindPasswordRequest): Promise<FindPasswordResponse> {
  const controller = new AbortController();

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${API_BASE_URL}/auth/password/find`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
        }),
        signal: controller.signal,
      },
    );

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        responseBody?.message ??
        '비밀번호 재설정 링크 발송에 실패했습니다.';

      throw new Error(errorMessage);
    }

    return responseBody as FindPasswordResponse;
  } catch (error: unknown) {
    if (
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      throw new Error(
        '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}