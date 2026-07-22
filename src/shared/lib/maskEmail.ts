export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');

  if (!domain || localPart.length <= 2) {
    return email;
  }

  const visiblePart = localPart.slice(0, -2);

  return `${visiblePart}**@${domain}`;
}
