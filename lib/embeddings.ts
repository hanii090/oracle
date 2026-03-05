import { GoogleGenAI } from '@google/genai';

/**
 * Embeddings service for semantic search and contradiction detection
 * Uses Gemini's embedding model for text embeddings
 */

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export interface ContradictionResult {
  found: boolean;
  statement1?: string;
  statement2?: string;
  similarity: number;
  explanation?: string;
}

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

/**
 * Generate embedding for a text string
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const ai = getAI();
  if (!ai) return null;

  try {
    const result = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });
    return result.embeddings?.[0]?.values || null;
  } catch (e) {
    console.error('Embedding generation failed:', e);
    return null;
  }
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];
  
  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    if (embedding) {
      results.push({ text, embedding });
    }
  }
  
  return results;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Find the most similar statements to a query
 */
export function findSimilar(
  queryEmbedding: number[],
  candidates: EmbeddingResult[],
  topK: number = 5,
  threshold: number = 0.7
): Array<EmbeddingResult & { similarity: number }> {
  const scored = candidates.map(candidate => ({
    ...candidate,
    similarity: cosineSimilarity(queryEmbedding, candidate.embedding),
  }));
  
  return scored
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Detect potential contradictions between statements
 * Uses embedding similarity + Gemini analysis
 */
export async function detectContradictions(
  statements: string[],
  minSimilarity: number = 0.6,
  maxSimilarity: number = 0.85
): Promise<ContradictionResult[]> {
  if (statements.length < 2) return [];
  
  const ai = getAI();
  if (!ai) return [];

  // Generate embeddings for all statements
  const embeddings = await generateEmbeddings(statements);
  if (embeddings.length < 2) return [];

  const contradictions: ContradictionResult[] = [];

  // Find pairs with moderate similarity (potential contradictions)
  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      const similarity = cosineSimilarity(embeddings[i].embedding, embeddings[j].embedding);
      
      // Contradictions often have moderate similarity - same topic, opposite stance
      if (similarity >= minSimilarity && similarity <= maxSimilarity) {
        // Use Gemini to verify if it's a contradiction
        try {
          const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze these two statements for contradiction:
Statement 1: "${embeddings[i].text}"
Statement 2: "${embeddings[j].text}"

Are these statements contradictory? Consider:
- Do they express opposing views on the same topic?
- Does one statement negate or undermine the other?
- Would holding both beliefs simultaneously be logically inconsistent?

Return JSON only: { "isContradiction": boolean, "explanation": "brief explanation" }`,
            config: { responseMimeType: 'application/json', temperature: 0.3 },
          });

          const parsed = JSON.parse(result.text || '{}');
          if (parsed.isContradiction) {
            contradictions.push({
              found: true,
              statement1: embeddings[i].text,
              statement2: embeddings[j].text,
              similarity,
              explanation: parsed.explanation,
            });
          }
        } catch (e) {
          // Silent fail for individual pair analysis
        }
      }
    }
  }

  return contradictions;
}

/**
 * Store embedding in Firestore (for persistence without pgvector)
 */
export async function storeEmbedding(
  db: FirebaseFirestore.Firestore,
  userId: string,
  text: string,
  embedding: number[],
  metadata: Record<string, unknown> = {}
): Promise<string | null> {
  try {
    const docRef = await db.collection('embeddings').add({
      userId,
      text,
      embedding,
      metadata,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (e) {
    console.error('Failed to store embedding:', e);
    return null;
  }
}

/**
 * Search for similar statements in stored embeddings
 */
export async function searchSimilarStatements(
  db: FirebaseFirestore.Firestore,
  userId: string,
  queryText: string,
  topK: number = 5
): Promise<Array<{ text: string; similarity: number; metadata: Record<string, unknown> }>> {
  const queryEmbedding = await generateEmbedding(queryText);
  if (!queryEmbedding) return [];

  try {
    // Fetch user's embeddings
    const snapshot = await db.collection('embeddings')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const candidates: EmbeddingResult[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        text: data.text,
        embedding: data.embedding,
        metadata: data.metadata,
      };
    });

    const similar = findSimilar(queryEmbedding, candidates, topK, 0.6);
    return similar.map(item => ({
      text: item.text,
      similarity: item.similarity,
      metadata: (item.metadata || {}) as Record<string, unknown>,
    }));
  } catch (e) {
    console.error('Similar statement search failed:', e);
    return [];
  }
}
