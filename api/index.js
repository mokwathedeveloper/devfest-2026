// Vercel serverless entry point: the whole Express API runs as one function behind /api/*.
import { createApp } from '../server/app.js';

export default createApp();
