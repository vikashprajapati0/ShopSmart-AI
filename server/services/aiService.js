import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

/**
 * Extract intent, budget, category, keywords from natural language query
 */
export const extractQueryIntent = async (userMessage) => {
  const query = userMessage.toLowerCase();
  const filters = {};

  // Extract budget / price constraints
  // Matches: "under 3000", "under ₹3,000", "below 60000", "less than 1500", "between 2000 and 5000"
  const underMatch = query.match(/(?:under|below|less than|max|up to|within)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
  if (underMatch) {
    const amount = parseInt(underMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(amount)) {
      filters.maxPrice = amount;
    }
  }

  const aboveMatch = query.match(/(?:above|over|more than|min|at least)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
  if (aboveMatch) {
    const amount = parseInt(aboveMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(amount)) {
      filters.minPrice = amount;
    }
  }

  const betweenMatch = query.match(/between\s*(?:₹|rs\.?|inr)?\s*([\d,]+)\s*(?:and|to|-)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
  if (betweenMatch) {
    const min = parseInt(betweenMatch[1].replace(/,/g, ''), 10);
    const max = parseInt(betweenMatch[2].replace(/,/g, ''), 10);
    if (!isNaN(min) && !isNaN(max)) {
      filters.minPrice = min;
      filters.maxPrice = max;
    }
  }

  // Detect intention
  let intent = 'search';
  if (query.includes('compare') || query.includes('difference between') || query.includes('vs')) {
    intent = 'compare';
  } else if (query.includes('recommend') || query.includes('suggest') || query.includes('best') || query.includes('top')) {
    intent = 'recommend';
  } else if (query.includes('gift') || query.includes('present')) {
    intent = 'gift';
  }

  // Detect categories or keywords
  const categories = await Category.find({ isActive: true }).select('_id name slug');
  for (const cat of categories) {
    const catName = cat.name.toLowerCase();
    const catSlug = cat.slug.toLowerCase();
    if (query.includes(catName) || query.includes(catSlug)) {
      filters.categoryId = cat._id;
      filters.categoryName = cat.name;
      break;
    }
  }

  // Specific common keyword maps if category not explicitly named
  if (!filters.categoryId) {
    if (query.includes('laptop') || query.includes('notebook') || query.includes('macbook')) {
      const elecCat = categories.find(c => c.slug === 'electronics');
      if (elecCat) filters.categoryId = elecCat._id;
      filters.searchTerms = 'laptop';
    } else if (query.includes('headphone') || query.includes('earphone') || query.includes('earbuds') || query.includes('audio')) {
      filters.searchTerms = 'headphone earbuds audio';
    } else if (query.includes('watch') || query.includes('smartwatch')) {
      filters.searchTerms = 'watch smartwatch';
    } else if (query.includes('shirt') || query.includes('dress') || query.includes('jacket') || query.includes('jeans') || query.includes('clothes')) {
      const fashCat = categories.find(c => c.slug === 'fashion');
      if (fashCat) filters.categoryId = fashCat._id;
      filters.searchTerms = 'fashion clothes';
    }
  }

  return { intent, filters, query };
};

/**
 * Retrieve candidates from MongoDB based on extracted intent and filters
 */
export const searchProductsForAI = async (intentData, userMessage) => {
  const { filters, query } = intentData;
  const mongoQuery = { isActive: true };

  // Price range
  if (filters.maxPrice !== undefined || filters.minPrice !== undefined) {
    mongoQuery.price = {};
    if (filters.maxPrice !== undefined) mongoQuery.price.$lte = filters.maxPrice;
    if (filters.minPrice !== undefined) mongoQuery.price.$gte = filters.minPrice;
  }

  // Category
  if (filters.categoryId) {
    mongoQuery.category = filters.categoryId;
  }

  // Extract clean keywords removing stopwords
  const stopWords = new Set(['find', 'me', 'a', 'an', 'the', 'under', 'below', 'for', 'and', 'or', 'in', 'with', 'show', 'recommend', 'suggest', 'looking', 'need', 'want', 'buy', 'best', 'top', 'good', 'compare', 'between', 'give', 'please']);
  const words = query
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w) && isNaN(w));

  let products = [];

  // Try text / keyword match first
  if (words.length > 0) {
    const regexPattern = words.join('|');
    const searchFilter = {
      ...mongoQuery,
      $or: [
        { name: { $regex: regexPattern, $options: 'i' } },
        { description: { $regex: regexPattern, $options: 'i' } },
        { brand: { $regex: regexPattern, $options: 'i' } },
        { tags: { $in: words.map(w => new RegExp(w, 'i')) } }
      ]
    };

    products = await Product.find(searchFilter)
      .populate('category', 'name slug')
      .sort({ 'ratings.average': -1, isFeatured: -1 })
      .limit(6)
      .lean();
  }

  // Fallback: If no products found with strict keyword, loosen filter or fetch top rated in category/price
  if (products.length === 0) {
    const relaxedQuery = { isActive: true };
    if (filters.categoryId) relaxedQuery.category = filters.categoryId;
    if (filters.maxPrice) relaxedQuery.price = { $lte: filters.maxPrice };

    products = await Product.find(relaxedQuery)
      .populate('category', 'name slug')
      .sort({ 'ratings.average': -1, isFeatured: -1 })
      .limit(4)
      .lean();
  }

  // If still empty (e.g. price filter too low), fetch nearest budget alternatives
  if (products.length === 0) {
    products = await Product.find({ isActive: true })
      .populate('category', 'name slug')
      .sort({ price: 1 })
      .limit(4)
      .lean();
  }

  return products;
};

/**
 * Generate intelligent assistant response using Gemini API or rule-based fallback
 */
export const generateAIResponse = async ({ userMessage, conversationHistory = [], matchedProducts = [], intentData = {} }) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const catalogContext = matchedProducts.map((p, idx) => ({
    id: p._id.toString(),
    index: idx + 1,
    name: p.name,
    brand: p.brand,
    price: p.price,
    discountPrice: p.discountPrice,
    rating: p.ratings?.average || 4.5,
    inStock: p.stock > 0,
    category: p.category?.name || 'General',
    description: p.description?.slice(0, 150),
    specs: p.specifications ? p.specifications.slice(0, 3) : []
  }));

  // If Gemini API Key is available, use official Google Generative AI
  if (geminiApiKey && !geminiApiKey.includes('placeholder')) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const systemPrompt = `
You are the AI Shopping Assistant for ShopSmart AI, a modern e-commerce platform.
Strict Rules:
1. ONLY recommend products present in the supplied DATABASE CATALOG CONTEXT below. NEVER invent products, specs, stock, or prices.
2. Prices are in Indian Rupees (₹).
3. Be conversational, helpful, concise, and professional.
4. Explain clearly why each matched product fits the customer's requirements.
5. If important preferences (like specific budget, color, or use-case) are missing, ask a helpful follow-up clarifying question.
6. If no products in the catalog directly match the exact criteria, explain that and present the closest alternatives provided in the context.

DATABASE CATALOG CONTEXT:
${JSON.stringify(catalogContext, null, 2)}
`;

      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...conversationHistory.slice(-4).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      const result = await model.generateContent({ contents });
      const response = await result.response;
      const text = response.text();

      return {
        reply: text,
        matchedProductIds: matchedProducts.map(p => p._id),
        matchedProducts,
        modelUsed: 'gemini-1.5-flash'
      };
    } catch (err) {
      console.warn(`[AI Gemini API Notice] Falling back to intelligent local assistant engine: ${err.message}`);
    }
  }

  // Intelligent fallback conversational generation engine (offline / dev / resilient)
  let reply = '';
  const count = matchedProducts.length;

  if (count === 0) {
    reply = `I searched our entire catalog for "${userMessage}", but couldn't find an exact match right now. Would you like to explore products in another price range or category?`;
  } else {
    const { intent, filters } = intentData;

    if (intent === 'compare' && count >= 2) {
      const p1 = matchedProducts[0];
      const p2 = matchedProducts[1];
      reply = `Here is a side-by-side comparison of our top selections:\n\n` +
        `• **${p1.name}** by ${p1.brand}: Priced at ₹${p1.price.toLocaleString('en-IN')}, rated ${p1.ratings.average}★. ${p1.description.slice(0, 100)}...\n` +
        `• **${p2.name}** by ${p2.brand}: Priced at ₹${p2.price.toLocaleString('en-IN')}, rated ${p2.ratings.average}★. ${p2.description.slice(0, 100)}...\n\n` +
        `Which of these features or price points best suits your daily needs?`;
    } else if (filters.maxPrice) {
      reply = `I found ${count} great option${count > 1 ? 's' : ''} under ₹${filters.maxPrice.toLocaleString('en-IN')} that match your criteria:\n\n`;
      matchedProducts.forEach((p, idx) => {
        reply += `${idx + 1}. **${p.name}** (${p.brand}) - **₹${p.price.toLocaleString('en-IN')}** [${p.ratings.average}★]\n   Why it fits: ${p.description.slice(0, 110)}...\n\n`;
      });
      reply += `Would you like more details on any of these, or would you like to narrow down by brand or specific features?`;
    } else {
      reply = `Based on your request, here are our recommended top-rated products from the catalog:\n\n`;
      matchedProducts.forEach((p, idx) => {
        reply += `${idx + 1}. **${p.name}** (${p.brand}) - **₹${p.price.toLocaleString('en-IN')}** [${p.ratings.average}★]\n   ${p.description.slice(0, 110)}...\n\n`;
      });
      reply += `Let me know if you would like to filter by a specific budget or feature!`;
    }
  }

  return {
    reply,
    matchedProductIds: matchedProducts.map(p => p._id),
    matchedProducts,
    modelUsed: 'smart-catalog-assistant'
  };
};

export default {
  extractQueryIntent,
  searchProductsForAI,
  generateAIResponse
};
