/**
 * iconMap.ts — Centralized icon mapping untuk dynamic rendering berdasarkan icon_name dari DB.
 *
 * Gunakan utility ini di mana pun kamu butuh render ikon secara dinamis
 * (TransactionItem, ManageCategoriesScreen, AddCategoryScreen, dll.)
 * agar tidak perlu `import * as Icons` yang membloat bundle size.
 *
 * Cara pakai:
 *   import { getIconComponent, DEFAULT_ICON } from '@/utils/iconMap';
 *   const IconComponent = getIconComponent(category.icon_name);
 *   <IconComponent size={20} color="#fff" />
 */

import {
    // Keuangan & Pembayaran
    Wallet, CreditCard, Banknote, Receipt, PiggyBank, TrendingUp, TrendingDown,
    ArrowRightLeft, CircleDollarSign, BadgeDollarSign, Coins,
    // Makanan & Gaya Hidup
    Utensils, Coffee, ShoppingBag, ShoppingCart, Shirt, Home, Landmark,
    // Transportasi
    Car, Bus, Train, Plane, Bike, Fuel,
    // Kesehatan & Edukasi
    Heart, Activity, Stethoscope, Pill, BookOpen, GraduationCap, School,
    // Hiburan & Sosial
    Gamepad2, Music, Film, Tv, Gift, PartyPopper, Smartphone, Laptop,
    // Pekerjaan & Produktivitas
    Briefcase, Building2, Wrench, Package, Truck,
    // Lainnya
    Star, Tag, HelpCircle, CircleDashed, Globe, MapPin, Zap, Leaf,
    type LucideIcon,
} from 'lucide-react-native';

// ─── Icon Map ────────────────────────────────────────────────────────────────

export const ICON_MAP: Record<string, LucideIcon> = {
    // Keuangan
    Wallet, CreditCard, Banknote, Receipt, PiggyBank,
    TrendingUp, TrendingDown, ArrowRightLeft,
    CircleDollarSign, BadgeDollarSign, Coins,

    // Makanan & Gaya Hidup
    Utensils, Coffee, ShoppingBag, ShoppingCart, Shirt, Home, Landmark,

    // Transportasi
    Car, Bus, Train, Plane, Bike, Fuel,

    // Kesehatan & Edukasi
    Heart, Activity, Stethoscope, Pill,
    BookOpen, GraduationCap, School,

    // Hiburan & Sosial
    Gamepad2, Music, Film, Tv, Gift, PartyPopper, Smartphone, Laptop,

    // Pekerjaan
    Briefcase, Building2, Wrench, Package, Truck,

    // Lainnya
    Star, Tag, HelpCircle, Globe, MapPin, Zap, Leaf,
    CircleDashed, // Fallback default
};

/** Icon default jika icon_name tidak ditemukan di map. */
export const DEFAULT_ICON: LucideIcon = CircleDashed;

/** Fallback per tipe transaksi. */
export const TRANSACTION_TYPE_ICON: Record<string, LucideIcon> = {
    EXPENSE: TrendingDown,
    INCOME: TrendingUp,
    TRANSFER: ArrowRightLeft,
};

/**
 * Ambil komponen ikon berdasarkan nama string dari DB.
 * Selalu mengembalikan komponen valid — tidak pernah undefined.
 *
 * @param iconName - Nama ikon (contoh: "Utensils", "Car", "Heart")
 * @param fallback - Ikon fallback jika nama tidak ditemukan (default: CircleDashed)
 */
export function getIconComponent(
    iconName?: string | null,
    fallback: LucideIcon = DEFAULT_ICON
): LucideIcon {
    if (!iconName) return fallback;
    return ICON_MAP[iconName] ?? fallback;
}
