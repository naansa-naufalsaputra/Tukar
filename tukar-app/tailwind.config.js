/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            fontFamily: {
                sans: ["PlusJakartaSans_400Regular", "sans-serif"],
                "sans-medium": ["PlusJakartaSans_500Medium", "sans-serif"],
                "sans-semibold": ["PlusJakartaSans_600SemiBold", "sans-serif"],
                "sans-bold": ["PlusJakartaSans_700Bold", "sans-serif"],
                jakarta: ["PlusJakartaSans_400Regular", "sans-serif"],
            },
            colors: {
                wallet: {
                    blue: {
                        text: '#2563EB', // blue-600
                        bg: '#EFF6FF', // blue-50
                        darkBg: '#1E3A8A', // blue-900
                    },
                    orange: {
                        text: '#EA580C', // orange-600
                        bg: '#FFF7ED', // orange-50
                        darkBg: '#7C2D12', // orange-900
                    }
                },
                status: {
                    income: '#10B981', // emerald-500
                    expense: '#E11D48', // rose-600
                },
                background: "var(--background)",
                foreground: "var(--foreground)",
                card: "var(--card)",
                "card-foreground": "var(--card-foreground)",
                popover: "var(--popover)",
                "popover-foreground": "var(--popover-foreground)",
                primary: "var(--primary)",
                "primary-foreground": "var(--primary-foreground)",
                secondary: "var(--secondary)",
                "secondary-foreground": "var(--secondary-foreground)",
                muted: "var(--muted)",
                "muted-foreground": "var(--muted-foreground)",
                accent: "var(--accent)",
                "accent-foreground": "var(--accent-foreground)",
                destructive: "var(--destructive)",
                "destructive-foreground": "var(--destructive-foreground)",
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)"
            }
        },
    },
    plugins: [],
}
