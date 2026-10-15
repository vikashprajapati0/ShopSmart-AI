import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  matchedProductIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  metadata: {
    intent: { type: String, default: '' },
    extractedFilters: { type: mongoose.Schema.Types.Mixed, default: {} },
    modelUsed: { type: String, default: 'gemini-1.5-flash' }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const conversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  messages: [messageSchema],
  title: {
    type: String,
    default: 'Shopping Assistant Conversation'
  }
}, {
  timestamps: true
});

conversationSchema.index({ user: 1, updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
