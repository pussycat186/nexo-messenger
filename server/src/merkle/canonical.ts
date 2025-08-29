export function canonicalJSON(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}
