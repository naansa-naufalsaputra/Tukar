/**
 * themeUtils.ts — Tema visual untuk kartu dompet berdasarkan nama bank/e-wallet.
 *
 * Sebelumnya tertanam di HomeScreen.tsx. Dipindahkan ke sini agar bisa dipakai ulang
 * di WalletCard, ManageWalletsScreen, DetailWalletScreen, dll.
 *
 * Cara pakai:
 *   import { getWalletTheme } from '@/utils/themeUtils';
 *   const theme = getWalletTheme(wallet.name);
 *   <View className={`${theme.bg} ${theme.border}`}>
 *     <WalletIcon color={theme.icon} />
 *   </View>
 */

export interface WalletTheme {
    /** NativeWind background class */
    bg: string;
    /** NativeWind border class */
    border: string;
    /** NativeWind text color class */
    text: string;
    /** Hex color untuk prop `color` ikon Lucide */
    icon: string;
}

/**
 * Tentukan tema warna kartu dompet berdasarkan nama dompet.
 * Mendukung bank besar Indonesia + e-wallet populer.
 *
 * @param walletName - Nama dompet (case-insensitive)
 * @returns WalletTheme dengan class NativeWind + hex icon color
 */
export const getWalletTheme = (walletName: string): WalletTheme => {
    const name = walletName.toLowerCase();

    // Bank-bank biru: BRI, BCA, Mandiri, BNI, BTN, CIMB, Jenius
    if (
        name.includes('bri') || name.includes('bca') ||
        name.includes('mandiri') || name.includes('bni') ||
        name.includes('btn') || name.includes('cimb') ||
        name.includes('jenius')
    ) {
        return {
            bg: 'bg-blue-500/10 dark:bg-blue-500/10',
            border: 'border-blue-500/30 dark:border-blue-500/30',
            text: 'text-blue-600 dark:text-blue-400',
            icon: '#60a5fa',
        };
    }

    // Tunai / dompet fisik
    if (name.includes('cash') || name.includes('tunai') || name.includes('dompet')) {
        return {
            bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
            border: 'border-emerald-500/30 dark:border-emerald-500/30',
            text: 'text-emerald-600 dark:text-emerald-400',
            icon: '#34d399',
        };
    }

    // E-wallet: Jago, GoPay, OVO, DANA, LinkAja, ShopeePay
    if (
        name.includes('jago') || name.includes('gopay') ||
        name.includes('ovo') || name.includes('dana') ||
        name.includes('linkaja') || name.includes('shopeepay')
    ) {
        return {
            bg: 'bg-sky-500/10 dark:bg-sky-500/10',
            border: 'border-sky-500/30 dark:border-sky-500/30',
            text: 'text-sky-600 dark:text-sky-400',
            icon: '#38bdf8',
        };
    }

    // Default — amber/oranye
    return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/10',
        border: 'border-amber-500/30 dark:border-amber-500/30',
        text: 'text-amber-600 dark:text-amber-400',
        icon: '#fbbf24',
    };
};

// Konfigurasi warna untuk react-native-gifted-charts menyesuaikan Cosmic Night
export const cosmicChartTheme = {
    // Warna garis/bar utama (Primary - Ungu Cosmic)
    primary: '#0ea5e9',
    // Warna garis/bar sekunder (Cyan/Teal)
    secondary: '#06b6d4',
    // Warna teks label (Muted Foreground)
    axisLabel: '#94a3b8',
    // Warna garis grid/sumbu (Border gelap)
    grid: '#1e293b',
    // Warna background tooltip
    tooltipBg: '#0f172a',
    // Warna teks tooltip
    tooltipText: '#f8fafc',
    // Efek glow di bawah garis
    gradientStart: 'rgba(139, 92, 246, 0.3)',
    gradientEnd: 'rgba(139, 92, 246, 0.01)',
};

// Palet warna untuk potongan Pie Chart (Cosmic Night Palette)
export const cosmicPieColors = [
    '#0ea5e9', // Primary Sky
    '#06b6d4', // Cyan
    '#ec4899', // Pink Neon
    '#10b981', // Emerald
    '#f59e0b', // Amber/Gold
    '#3b82f6', // Royal Blue
    '#f43f5e', // Rose Red
];
