export function createSlug(input: string): string {
  if (!input) return "";

  const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "if", "then", "else", "when", 
    "at", "by", "for", "from", "in", "out", "on", "to", "with", "of", 
    "how", "what", "why", "who", "create", "make", "write", "check", "find"
  ]);

  const rawWords = input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .split(/[\s-]+/)
    .filter(w => w.length > 0);

  const smartWords = rawWords.filter(w => !stopWords.has(w));

  const finalWords = smartWords.length >= 2 ? smartWords : rawWords;

  return finalWords.slice(0, 2).join('-');
}