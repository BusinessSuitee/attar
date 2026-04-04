/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: ['./src/**/*.{html,ts}'],
	corePlugins: {
		preflight: true
	},
	theme: {
		extend: {
			colors: {
				primary: '#0fbd66',
				'primary-dark': '#0a8a4a',
				accent: '#E8871E',
				'accent-gold': '#d4af37',
				'background-light': '#f6f8f7',
				'background-dark': '#102219',
				'surface-light': '#ffffff',
				'surface-dark': '#1e2823'
			},
			fontFamily: {
				display: ['"Cairo"', '"Work Sans"', 'sans-serif'],
				sans: ['"Cairo"', '"Work Sans"', 'sans-serif']
			}
		}
	},
	plugins: []
};

