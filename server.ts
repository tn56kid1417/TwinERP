import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createApp } from './api/index';
import { checkDbConnection } from './api/db';
import { setupDatabase } from './scripts/setup-postgres';

// Load environment variables from .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

export { createApp };

async function startServer() {
  // Initialize and verify PostgreSQL connection
  try {
    await setupDatabase();
    await checkDbConnection();
  } catch (err: any) {
    console.warn('[DB] Automatic PostgreSQL setup note:', err?.message);
  }

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
    console.log(`\n======================================================`);
    console.log(`  🚀 TwinERP Server is RUNNING locally on http://localhost:${PORT}`);
    console.log(`  🗄️  PostgreSQL Database: twin_erp (User: postgres)`);
    console.log(`======================================================\n`);
  });
}

// Only start the local server when this file is run directly (not imported by api/index.ts)
if (process.env.VERCEL !== '1') {
  startServer();
}
