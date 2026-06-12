import { join } from 'path'

const PORT = 3000
const DIST_DIR = join(import.meta.dir, 'dist')

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    const pathName = url.pathname

    if (pathName.startsWith('/api')) {
      return fetch(`http://backend:8000${pathName}${url.search}`, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      })
    }

    const filePath = join(DIST_DIR, pathName)
    const file = Bun.file(filePath)
    
    const exists = await file.exists()
    if (exists && pathName !== '/') {
      return new Response(file)
    }

    return new Response(Bun.file(join(DIST_DIR, 'index.html')))
  }
})

console.log(`Frontend sirviendo en http://localhost:${PORT}`)
