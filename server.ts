import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './api/index';

export { createApp };


async function startServer() {
  const app = createApp();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // --- Vite Middleware for Development ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Only start the local server when this file is run directly (not imported by api/index.ts)
if (process.env.VERCEL !== '1') {
  startServer();
}
