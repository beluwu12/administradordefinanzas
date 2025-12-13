/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#212121', // Main BG (Gray 900)
                surface: '#2f2f2f',    // Cards/Elements (Lighter Gray)
                sidebar: '#171717',    // Sidebar (Darker)
                primary: '#10a37f',    // OpenAI Green
                'primary-hover': '#1a7f64',
                secondary: '#10a37f',  // Keep consistent
                danger: '#ef4146',     // Red for expenses
                text: '#ececf1',       // Main Text
                muted: '#b4b4b4',      // Muted Text
                border: '#4d4d4f',     // Borders
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
