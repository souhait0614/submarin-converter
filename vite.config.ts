import { defineConfig } from 'vite'
import dts from "vite-plugin-dts"

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'SubmarinConverterCore3',
      fileName: 'index'
    }
  },
  plugins: [dts()],
})
