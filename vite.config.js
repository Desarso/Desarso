import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import projectContent from './build/project-content.mjs'

export default defineConfig({
  plugins: [projectContent(), react()],
  build: { target: 'es2022' },
})
