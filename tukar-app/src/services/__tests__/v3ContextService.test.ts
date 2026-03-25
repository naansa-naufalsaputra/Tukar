import { V3ContextService } from '../v3ContextService';
import { Transaction } from '@/types';

describe('V3ContextService - Local Embedding Simulator', () => {
    const mockTransactions: Transaction[] = [
        { id: '1', amount: 50000, type: 'expense', title: 'Makan siang Nasi Padang', category: 'Food', date: '2026-03-01' },
        { id: '2', amount: 150000, type: 'expense', title: 'Beli bensin Pertamax', category: 'Transport', date: '2026-03-02' },
        { id: '3', amount: 25000, type: 'expense', title: 'Kopi Kenangan Senayan', category: 'Food', date: '2026-03-03' },
        { id: '4', amount: 5000000, type: 'income', title: 'Gaji Bulanan', category: 'Salary', date: '2026-03-01' },
        { id: '5', amount: 120000, type: 'expense', title: 'Belanja sayur di pasar', category: 'Groceries', date: '2026-03-04' },
    ];

    it('should tokenize text correctly, ignoring stop words', () => {
        const tokens = V3ContextService.tokenize('Beli makan siang untuk di kantor');
        expect(tokens).toContain('makan');
        expect(tokens).toContain('siang');
        expect(tokens).toContain('kantor');
        // Stop words 'beli', 'untuk', 'di' should be removed based on length/list
        expect(tokens).not.toContain('di');
    });

    it('should find relevant transactions for a specific food query', () => {
        const query = "berapa banyak saya habiskan untuk makan atau kopi?";
        const results = V3ContextService.getRelevantTransactions(query, mockTransactions, 2);
        
        expect(results.length).toBeLessThanOrEqual(2);
        const titles = results.map(r => r.title);
        // It should pick up the Nasi Padang and Kopi Kenangan because of 'makan' and 'kopi'
        expect(titles.some(t => t?.includes('Padang') || t?.includes('Kopi'))).toBeTruthy();
    });

    it('should return recent transactions if query has no matching keywords', () => {
        const query = "haloo";
        const results = V3ContextService.getRelevantTransactions(query, mockTransactions, 2);
        // Will just return the first 2 items as fallback
        expect(results.length).toBe(2);
        expect(results[0].id).toBe('1');
    });
});
