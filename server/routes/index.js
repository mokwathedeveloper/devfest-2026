import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAdmin } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';
import * as event from '../controllers/eventController.js';
import * as speakers from '../controllers/speakersController.js';
import * as sessions from '../controllers/sessionsController.js';
import { getTracks } from '../controllers/tracksController.js';
import { uploadPhoto, MAX_UPLOAD_BYTES } from '../controllers/uploadController.js';
import express from 'express';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_RATE_LIMIT || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a few minutes.' },
});

router.post('/auth/login', loginLimiter, auth.login);
router.get('/auth/me', requireAdmin, auth.me);

router.post('/uploads', requireAdmin, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: MAX_UPLOAD_BYTES }), uploadPhoto);

router.get('/event', event.getEvent);
router.put('/event', requireAdmin, event.updateEvent);

router.get('/tracks', getTracks);

router.get('/speakers', speakers.listSpeakers);
router.get('/speakers/:id', speakers.getSpeaker);
router.post('/speakers', requireAdmin, speakers.createSpeaker);
router.put('/speakers/:id', requireAdmin, speakers.updateSpeaker);
router.delete('/speakers/:id', requireAdmin, speakers.deleteSpeaker);

router.get('/sessions', sessions.listSessions);
router.get('/sessions/:id', sessions.getSession);
router.post('/sessions', requireAdmin, sessions.createSession);
router.put('/sessions/:id', requireAdmin, sessions.updateSession);
router.delete('/sessions/:id', requireAdmin, sessions.deleteSession);

export default router;
