import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Transaction, Category } from '../types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import i18n from './i18n';

export function generateMonthlyReportHTML(month: Date, transactions: Transaction[], categories: Category[]): string {
    const monthYear = format(month, 'MMMM yyyy', { locale: localeID });
    
    const totals = transactions.reduce((acc, curr) => {
        const type = (curr.transaction_type || curr.type || '').toUpperCase();
        if (type === 'INCOME') acc.income += curr.amount;
        if (type === 'EXPENSE') acc.expense += curr.amount;
        return acc;
    }, { income: 0, expense: 0 });

    const balance = totals.income - totals.expense;

    const rows = transactions.map(t => {
        const date = t.date ? new Date(t.date) : (t.created_at ? new Date(t.created_at) : new Date());
        const dateStr = format(date, 'dd/MM/yyyy');
        const category = categories.find(c => c.id === t.category_id || c.id === t.category)?.name || i18n.t('other');
        const type = (t.transaction_type || t.type || '').toUpperCase();
        const amountStr = (type === 'EXPENSE' ? '-' : '+') + ' Rp ' + t.amount.toLocaleString('id-ID');
        const amountClass = type === 'EXPENSE' ? 'text-red' : 'text-green';

        return `
            <tr>
                <td>${dateStr}</td>
                <td>${category}</td>
                <td>${t.title || t.notes || '-'}</td>
                <td class="${amountClass}">${amountStr}</td>
            </tr>
        `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${i18n.t('financialReport', { month: monthYear })}</title>
            <style>
                body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; padding: 20px; }
                h1 { text-align: center; color: #1e293b; }
                .summary { display: flex; justify-content: space-around; margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 10px; }
                .summary-item { text-align: center; }
                .summary-item h3 { margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; }
                .summary-item p { margin: 5px 0 0; font-size: 20px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #f1f5f9; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; }
                td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
                .text-red { color: #ef4444; }
                .text-green { color: #10b981; }
                .text-blue { color: #3b82f6; }
            </style>
        </head>
        <body>
            <h1>${i18n.t('financialReport', { month: monthYear })}</h1>
            
            <div class="summary">
                <div class="summary-item">
                    <h3>${i18n.t('totalIncome')}</h3>
                    <p class="text-green">Rp ${totals.income.toLocaleString('id-ID')}</p>
                </div>
                <div class="summary-item">
                    <h3>${i18n.t('totalExpense')}</h3>
                    <p class="text-red">Rp ${totals.expense.toLocaleString('id-ID')}</p>
                </div>
                <div class="summary-item">
                    <h3>${i18n.t('finalBalance')}</h3>
                    <p class="text-blue">Rp ${balance.toLocaleString('id-ID')}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>${i18n.t('date')}</th>
                        <th>${i18n.t('category')}</th>
                        <th>${i18n.t('description')}</th>
                        <th>${i18n.t('nominal')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </body>
        </html>
    `;
}

export async function exportMonthlyReport(transactions: Transaction[], month: Date, categories: Category[]) {
    const html = generateMonthlyReportHTML(month, transactions, categories);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
}
