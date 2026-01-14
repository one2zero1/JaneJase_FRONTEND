/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // 영문 + 한글 같이 보기 좋은 조합
        sans: [
          'Inter',
          'Pretendard',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Noto Sans KR',
          'Apple SD Gothic Neo',
          'sans-serif',
        ],
      },

      colors: {
        // ✅ 브랜드 원색 (고정값)
        jj: {
          blue: {
            500: '#0064FF',
          },
          purple: {
            500: '#5F33FF',
          },
          green: {
            500: '#009F00',
            600: '#008700', // 흰 글자 버튼용 추천
          },
        },

        // ✅ 앱에서 실제로 쓰는 “의미 기반(semantic)” 컬러 (CSS 변수로 라이트/다크 자동 전환)
        bg: 'rgb(var(--jj-bg) / <alpha-value>)',
        surface: 'rgb(var(--jj-surface) / <alpha-value>)',
        border: 'rgb(var(--jj-border) / <alpha-value>)',

        text: 'rgb(var(--jj-text) / <alpha-value>)',
        muted: 'rgb(var(--jj-muted) / <alpha-value>)',
        'text-muted': 'rgb(var(--jj-text-muted) / <alpha-value>)',

        primary: 'rgb(var(--jj-primary) / <alpha-value>)',
        accent: 'rgb(var(--jj-accent) / <alpha-value>)',
        success: 'rgb(var(--jj-success) / <alpha-value>)',
        danger: 'rgb(var(--jj-danger) / <alpha-value>)',

        'primary-soft': 'rgb(var(--jj-primary-soft) / <alpha-value>)',
        'accent-soft': 'rgb(var(--jj-accent-soft) / <alpha-value>)',
        'success-soft': 'rgb(var(--jj-success-soft) / <alpha-value>)',
      },

      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.08)',
      },

      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
