export function agentProfilePath(name: string): string {
  return `/agents/${encodeURIComponent(name)}`;
}
