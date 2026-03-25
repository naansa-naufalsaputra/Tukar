import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Logger } from '../lib/logger';
import { ReportSummary } from './reportService';

export const ReportExportService = {
    async exportReportAsPdf(
        reportSummary: ReportSummary,
        month: string,
        year: string
    ): Promise<boolean> {
        try {
            // Check if printing and sharing are available
            if (!(await Sharing.isAvailableAsync())) {
                Logger.warn('Sharing is not available on this platform/device.');
                return false;
            }

            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const monthName = monthNames[parseInt(month, 10) - 1] || month;

            // Generate category breakdown rows
            const rows = (reportSummary.categoryBreakdown || [])
                .map((cat) => {
                    const isIncome = cat.type.toLowerCase() === 'income';
                    const color = isIncome ? '#4ade80' : '#f87171'; // Green and Red from theme
                    const formattedAmount = `Rp ${cat.totalAmount.toLocaleString('id-ID')}`;

                    return `
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #334155; color: #f8fafc;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${color};"></div>
                                    <span>${cat.categoryName || 'Uncategorized'}</span>
                                </div>
                            </td>
                            <td style="padding: 12px; border-bottom: 1px solid #334155; color: ${color}; font-weight: bold; text-align: right;">
                                ${formattedAmount}
                            </td>
                        </tr>
                    `;
                })
                .join('');

            // Format amounts
            const formattedIncome = `Rp ${reportSummary.totalIncome.toLocaleString('id-ID')}`;
            const formattedExpense = `Rp ${reportSummary.totalExpense.toLocaleString('id-ID')}`;
            const formattedNet = `Rp ${(reportSummary.totalIncome - reportSummary.totalExpense).toLocaleString('id-ID')}`;
            const netColor = (reportSummary.totalIncome - reportSummary.totalExpense) >= 0 ? '#4ade80' : '#f87171';

            // Generate HTML Content (Dark Theme, Premium Look)
            const htmlContent = `
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
                            body {
                                margin: 0;
                                padding: 40px;
                                background-color: #0f172a; /* Tailwind slate-900 */
                                color: #f8fafc; /* Tailwind slate-50 */
                                font-family: 'Plus Jakarta Sans', sans-serif;
                            }
                            .header {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                border-bottom: 2px solid #3b82f6; /* Primary blue */
                                padding-bottom: 20px;
                                margin-bottom: 30px;
                            }
                            .title {
                                font-size: 28px;
                                font-weight: bold;
                                margin: 0;
                            }
                            .subtitle {
                                font-size: 16px;
                                color: #94a3b8; /* slate-400 */
                                margin-top: 5px;
                            }
                            .logo-placeholder {
                                font-size: 32px;
                                font-weight: 800;
                                color: #3b82f6;
                            }
                            .summary-cards {
                                display: flex;
                                justify-content: space-between;
                                gap: 20px;
                                margin-bottom: 40px;
                            }
                            .card {
                                flex: 1;
                                background-color: #1e293b; /* slate-800 */
                                border: 1px solid #334155; /* slate-700 */
                                border-radius: 16px;
                                padding: 20px;
                                text-align: center;
                            }
                            .card-label {
                                font-size: 14px;
                                color: #94a3b8;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                margin-bottom: 10px;
                            }
                            .card-value {
                                font-size: 24px;
                                font-weight: bold;
                            }
                            .income-value { color: #4ade80; }
                            .expense-value { color: #f87171; }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                                background-color: #1e293b;
                                border-radius: 12px;
                                overflow: hidden;
                            }
                            th {
                                background-color: #334155;
                                color: #94a3b8;
                                text-transform: uppercase;
                                font-size: 13px;
                                letter-spacing: 1px;
                                padding: 15px 12px;
                                text-align: left;
                            }
                            th.right {
                                text-align: right;
                            }
                            .footer {
                                margin-top: 50px;
                                padding-top: 20px;
                                border-top: 1px solid #334155;
                                text-align: center;
                                font-size: 12px;
                                color: #64748b;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div>
                                <h1 class="title">Monthly Financial Report</h1>
                                <p class="subtitle">For the period of ${monthName} ${year}</p>
                            </div>
                            <div class="logo-placeholder">Tukar.</div>
                        </div>

                        <div class="summary-cards">
                            <div class="card">
                                <div class="card-label">Total Income</div>
                                <div class="card-value income-value">${formattedIncome}</div>
                            </div>
                            <div class="card">
                                <div class="card-label">Total Expense</div>
                                <div class="card-value expense-value">${formattedExpense}</div>
                            </div>
                            <div class="card border-color">
                                <div class="card-label">Net Flow</div>
                                <div class="card-value" style="color: ${netColor}">${formattedNet}</div>
                            </div>
                        </div>

                        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 15px;">Category Breakdown</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th class="right">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows || '<tr><td colspan="2" style="padding: 20px; text-align: center; color: #94a3b8;">No transactions found for this period.</td></tr>'}
                            </tbody>
                        </table>

                        <div class="footer">
                            <p>Generated securely by Tukar App Personal Financial Assistant.</p>
                            <p>Data reflects status as of the moment of generation.</p>
                        </div>
                    </body>
                </html>
            `;

            // Print HTML to PDF File
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false
            });

            // Share the PDF
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share your Tukar Report',
                UTI: 'com.adobe.pdf'
            });

            return true;
        } catch (error) {
            Logger.error('Error generating or sharing PDF report:', error);
            return false;
        }
    }
};
