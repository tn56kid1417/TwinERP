import { createApp } from "../server";

// Create the Express app (routes only, no Vite, no listen)
const app = createApp();

// Export as Vercel Serverless Function handler
export default app;

