const VECTOR_SIZE = 96;

function hashToken(token) {
  let hash = 2166136261;

  for (const char of token) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash);
}

export function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.$]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

export function embedText(text) {
  const vector = Array.from({ length: VECTOR_SIZE }, () => 0);
  const tokens = tokenize(text);

  tokens.forEach((token, index) => {
    vector[hashToken(token) % VECTOR_SIZE] += 1.2;
    if (index < tokens.length - 1) {
      vector[hashToken(`${token}_${tokens[index + 1]}`) % VECTOR_SIZE] += 0.8;
    }
  });

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

export function cosineSimilarity(left, right) {
  const size = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < size; index += 1) {
    const a = Number(left[index] || 0);
    const b = Number(right[index] || 0);
    dot += a * b;
    leftMagnitude += a * a;
    rightMagnitude += b * b;
  }

  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator ? dot / denominator : 0;
}
