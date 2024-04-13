export function isObjectEmpty(obj: any): boolean {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return true;
  }
  return Object.keys(obj).length === 0;
}
