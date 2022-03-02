// vite.config.js
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  server: {
    port: 4000,
  },
  plugins: [
    cssInjectedByJsPlugin(),
  ],
  build: {
    minify: 'terser',
    sourcemap: true,
    lib: {
      // formats: ['umd'],
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'nexteditor-sharedb',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      "external": ["@nexteditorjs/nexteditor-core", "blueimp-md5"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          // vue: 'Vue'
        }
      }
    }
  }
})
