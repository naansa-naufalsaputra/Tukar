// src/lib/logger.ts

// Kita bisa mematikan log saat aplikasi di-build untuk production
const isDevelopment = __DEV__;

export const Logger = {
    info: (message: string, data?: any) => {
        if (isDevelopment) {
            console.log(`🔵 [INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
        }
    },

    warn: (message: string, data?: any) => {
        if (isDevelopment) {
            console.warn(`🟠 [WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
        }
    },

    error: (message: string, error?: any) => {
        if (isDevelopment) {
            console.error(`🔴 [ERROR] ${message}`, error ? JSON.stringify(error, null, 2) : '');
            // NANTI: Di sini kita bisa tambahkan kode untuk mengirim error ke Sentry/Crashlytics
        }
    },

    // Khusus untuk mencatat respon dari AI (Gemini) agar mudah di-debug
    ai: (message: string, data?: any) => {
        if (isDevelopment) {
            console.log(`🤖 [GEMINI AI] ${message}`, data ? JSON.stringify(data, null, 2) : '');
        }
    }
};
