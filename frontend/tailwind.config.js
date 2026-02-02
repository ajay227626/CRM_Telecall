/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#F59E0B',
                    light: 'rgba(245, 158, 11, 0.1)',
                    dark: '#D97706',
                },
                danger: {
                    DEFAULT: '#EF4444',
                    light: '#FEE2E2',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
