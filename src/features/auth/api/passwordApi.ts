const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:8080';

export interface FindPasswordRequest {
  name: string;
  email: string;
}

export interface FindPasswordResponse {
  message: string;
  expiresIn: number;
}

interface ApiErrorResponse {
  message?: string;
}

export async function findPassword({
  name,
  email,
}: FindPasswordRequest): Promise<FindPasswordResponse> {
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
    },
  );

  const responseBody = (await response
    .json()
    .catch(() => ({}))) as FindPasswordResponse | ApiErrorResponse;

  if (!response.ok) {
    const message =
      'message' in responseBody
        ? responseBody.message
        : undefined;

    throw new Error(
      message ??
        '비밀번호 재설정 링크 발송에 실패했습니다.',
    );
  }

  return responseBody as FindPasswordResponse;
}