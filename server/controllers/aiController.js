import Conversation from '../models/Conversation.js';
import Product from '../models/Product.js';
import { extractQueryIntent, searchProductsForAI, generateAIResponse } from '../services/aiService.js';

export const chatWithAssistant = async (req, res, next) => {
  try {
    const { message, sessionId, conversationId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Find or create conversation
    let conversation = null;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else {
      conversation = await Conversation.findOne({ sessionId: currentSessionId });
    }

    if (!conversation) {
      conversation = new Conversation({
        sessionId: currentSessionId,
        user: req.user ? req.user._id : null,
        title: message.slice(0, 40) + '...',
        messages: []
      });
    }

    // Associate user if newly authenticated
    if (req.user && !conversation.user) {
      conversation.user = req.user._id;
    }

    // 1. Extract intent, budget, keywords from user's message
    const intentData = await extractQueryIntent(message);

    // 2. Search MongoDB product catalog for real matching candidates
    const matchedProducts = await searchProductsForAI(intentData, message);

    // 3. Generate response (Gemini API with fallback to intelligent local assistant)
    const history = conversation.messages.slice(-6);
    const aiOutput = await generateAIResponse({
      userMessage: message,
      conversationHistory: history,
      matchedProducts,
      intentData
    });

    // 4. Validate matched product IDs strictly exist in our database
    const validProductIds = matchedProducts.map(p => p._id);

    // 5. Save user message and assistant reply to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    conversation.messages.push({
      role: 'assistant',
      content: aiOutput.reply,
      matchedProductIds: validProductIds,
      metadata: {
        intent: intentData.intent,
        extractedFilters: intentData.filters,
        modelUsed: aiOutput.modelUsed
      },
      timestamp: new Date()
    });

    await conversation.save();

    // Populate full product objects for the frontend cards
    const populatedProducts = await Product.find({ _id: { $in: validProductIds } })
      .populate('category', 'name slug')
      .lean();

    res.status(200).json({
      success: true,
      reply: aiOutput.reply,
      products: populatedProducts,
      conversationId: conversation._id,
      sessionId: conversation.sessionId,
      intent: intentData.intent,
      modelUsed: aiOutput.modelUsed
    });
  } catch (err) {
    next(err);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const query = req.user
      ? { user: req.user._id }
      : { sessionId: req.query.sessionId || '' };

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('title sessionId createdAt updatedAt');

    res.status(200).json({
      success: true,
      conversations
    });
  } catch (err) {
    next(err);
  }
};

export const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate({
        path: 'messages.matchedProductIds',
        populate: { path: 'category', select: 'name slug' }
      });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    res.status(200).json({
      success: true,
      conversation
    });
  } catch (err) {
    next(err);
  }
};

export const clearConversation = async (req, res, next) => {
  try {
    await Conversation.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Conversation cleared.' });
  } catch (err) {
    next(err);
  }
};

export default {
  chatWithAssistant,
  getConversations,
  getConversationById,
  clearConversation
};
