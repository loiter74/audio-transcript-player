module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-markdown': {},
    'postcss-text-transform': {
      transform: {
        '.subtitle-text': {
          // 移除逗号和句号
          'text-replace': [[/[,\.]/g, '']]
        }
      }
    }
  },
}