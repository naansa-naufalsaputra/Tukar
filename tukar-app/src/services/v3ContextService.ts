import { Transaction } from '@/types';

// V3 Logic: Lightweight Local Keyword Extraction & Similarity Scoring
export class V3ContextService {
    /**
     * Tokenize a string into an array of lowercase words, removing common stop words.
     */
    static tokenize(text: string): string[] {
        const stopWords = ['di', 'ke', 'dari', 'yang', 'untuk', 'pada', 'dengan', 'dan', 'atau', 'ini', 'itu', 'buat', 'bayar', 'beli'];
        return text
            .toLowerCase()
            .replace(/[^\w\s]/gi, ' ') // Remove punctuation
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word));
    }

    /**
     * Calculate Jaccard Similarity between two sets of tokens.
     */
    static calculateSimilarity(tokensA: string[], tokensB: string[]): number {
        const setA = new Set(tokensA);
        const setB = new Set(tokensB);
        
        if (setA.size === 0 || setB.size === 0) return 0;

        let intersection = 0;
        for (const token of setA) {
            if (setB.has(token)) intersection++;
        }

        const union = setA.size + setB.size - intersection;
        return intersection / union;
    }

    /**
     * Find the top N most relevant transactions based on a user's natural language query.
     * This avoids sending the ENTIRE database to Gemini, saving massive amounts of tokens.
     */
    static getRelevantTransactions(query: string, allTransactions: Transaction[], limit: number = 5): Transaction[] {
        const queryTokens = this.tokenize(query);
        
        // If the query is just a generic question without specific keywords, return recent ones
        if (queryTokens.length === 0) {
            return allTransactions.slice(0, limit);
        }

        const scoredTransactions = allTransactions.map(tx => {
            const txText = `${tx.title || ''} ${tx.notes || ''} ${tx.category || ''}`;
            const txTokens = this.tokenize(txText);
            const score = this.calculateSimilarity(queryTokens, txTokens);
            return { tx, score };
        });

        // Sort by highest similarity score, filter out completely irrelevant ones (score 0), take top N
        const results = scoredTransactions
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.tx)
            .slice(0, limit);

        return results.length > 0 ? results : allTransactions.slice(0, limit);
        return scoredTransactions
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.tx)
            .slice(0, limit);
    }
}
