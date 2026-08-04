export function formatModelVersion(version: string) {
  const normalizedVersion = version.trim();

  if (!normalizedVersion) {
    return '';
  }

  return normalizedVersion.toLowerCase().startsWith('v')
    ? normalizedVersion
    : `v${normalizedVersion}`;
}
