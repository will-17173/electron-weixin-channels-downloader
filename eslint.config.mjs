import eslintConfig from '@electron-toolkit/eslint-config'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginVue from 'eslint-plugin-vue'

export default [
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/out',
      '**/.http-mitm-proxy/**',
      '**/src/main/decrypt.js' // 忽略生成的解密文件
    ]
  },
  eslintConfig,
  ...eslintPluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{js,jsx,vue}'],
    rules: {
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'linebreak-style': ['error', 'unix']
    }
  },
  eslintConfigPrettier
]
