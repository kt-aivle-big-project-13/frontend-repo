// 이메일 주소를 아이디 앞 2자만 남기고 마스킹한다 (예: du********@naver.com)
export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');

  if (atIndex <= 0) {
    return email;
  }

  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex);
  const visibleLength = Math.min(2, localPart.length);
  const maskedLength = Math.max(localPart.length - visibleLength, 3);

  return `${localPart.slice(0, visibleLength)}${'*'.repeat(maskedLength)}${domainPart}`;
}