import express from 'express';
import {
  chatWithAssistant,
  getConversations,
  getConversationById,
  clearConversation
} from '../controllers/aiController.js';
import { optionalAuth, protect } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/chat', aiLimiter, optionalAuth, chatWithAssistant);
router.get('/conversations', optionalAuth, getConversations);
router.get('/conversations/:id', optionalAuth, getConversationById);
router.delete('/conversations/:id', protect, clearConversation);

export default router;
