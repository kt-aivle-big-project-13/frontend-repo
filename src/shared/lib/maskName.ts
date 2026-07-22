export function maskName(name: string): string {
  if (name.length <= 1) {
    return name;
  }

  if (name.length === 2) {
    return `${name[0]}*`;
  }

  return `${name.slice(0, 2)}*`;
}
