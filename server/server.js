import 'dotenv/config';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT || 4000);

for (const key of ['ADMIN_PASSWORD_HASH', 'JWT_SECRET']) {
  if (!process.env[key]) console.warn(`⚠️  ${key} is not set — admin login will not work. See server/.env.example.`);
}

createApp().listen(PORT, () => console.log(`DevFest 2026 API listening on http://localhost:${PORT}`));
