import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import InventoryMovement from '../models/InventoryMovement.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopsmart_ai';

const seedData = async () => {
  try {
    console.log(`[Seed] Connecting to MongoDB: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Database connected.');

    // Clear existing data
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Product.deleteMany(),
      Order.deleteMany(),
      Review.deleteMany(),
      Coupon.deleteMany(),
      InventoryMovement.deleteMany()
    ]);

    // 1. Seed Users
    console.log('[Seed] Creating demo users...');
    const [admin, customer] = await User.create([
      {
        name: 'ShopSmart Administrator',
        email: 'admin@shopsmart.ai',
        password: 'Admin@123456',
        role: 'admin',
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        addresses: [
          {
            fullName: 'Admin Headquarters',
            phone: '+91 98765 43210',
            street: '101 Cyber City Tech Park',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560100',
            country: 'India',
            isDefault: true
          }
        ]
      },
      {
        name: 'Rahul Sharma',
        email: 'customer@shopsmart.ai',
        password: 'Customer@123456',
        role: 'customer',
        phone: '+91 91234 56789',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        addresses: [
          {
            fullName: 'Rahul Sharma',
            phone: '+91 91234 56789',
            street: '42 Lotus Apartment, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560038',
            country: 'India',
            isDefault: true
          }
        ]
      }
    ]);

    // 2. Seed Categories
    console.log('[Seed] Creating categories...');
    const categories = await Category.create([
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Laptops, wireless headphones, smartwatches, and premium gadgets',
        icon: 'Laptop',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80',
        displayOrder: 1
      },
      {
        name: 'Fashion',
        slug: 'fashion',
        description: 'Contemporary streetwear, denim jackets, shoes, and modern apparel',
        icon: 'Shirt',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
        displayOrder: 2
      },
      {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        description: 'Smart kitchen appliances, espresso makers, and home aesthetics',
        icon: 'Home',
        image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
        displayOrder: 3
      },
      {
        name: 'Books',
        slug: 'books',
        description: 'Software engineering, design, self-growth, and bestselling literature',
        icon: 'BookOpen',
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
        displayOrder: 4
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Handcrafted leather wallets, backpacks, and designer sunglasses',
        icon: 'Watch',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        displayOrder: 5
      },
      {
        name: 'Beauty & Wellness',
        slug: 'beauty-wellness',
        description: 'Organic skincare, herbal botanicals, and daily self-care routines',
        icon: 'Sparkles',
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
        displayOrder: 6
      }
    ]);

    const catMap = {};
    categories.forEach(c => { catMap[c.slug] = c._id; });

    // 3. Seed Products
    console.log('[Seed] Creating products with specifications and pricing...');
    const productsData = [
      // Electronics
      {
        name: 'AeroBook Pro 15 Ultra-Lightweight Laptop',
        brand: 'Zenith',
        category: catMap['electronics'],
        price: 58999,
        discountPrice: 54999,
        stock: 24,
        sku: 'SKU-ZEN-LPT-001',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Engineered for developers, students, and creative professionals. Powered by an 8-core CPU, 16GB high-speed RAM, and a stunning 2.8K OLED display weighing only 1.29kg with up to 14 hours battery life.',
        specifications: [
          { name: 'Processor', value: 'Intel Core i7 13th Gen / 10-Core' },
          { name: 'RAM', value: '16GB LPDDR5 5200MHz' },
          { name: 'Storage', value: '512GB PCIe 4.0 NVMe SSD' },
          { name: 'Display', value: '15.6" OLED 2.8K 120Hz' },
          { name: 'Weight', value: '1.29 kg' }
        ],
        tags: ['laptop', 'coding', 'college', 'programming', 'lightweight', 'zenith', 'electronics']
      },
      {
        name: 'SonicWave Wireless Noise-Cancelling Headphones',
        brand: 'AcousticAI',
        category: catMap['electronics'],
        price: 2999,
        discountPrice: 2499,
        stock: 45,
        sku: 'SKU-ACO-HPH-002',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Immerse yourself in high-fidelity audio with active noise cancellation up to 35dB. Featuring 40mm neodymium drivers, plush memory foam ear cushions, and 40-hour playtime.',
        specifications: [
          { name: 'Driver Size', value: '40mm Neodymium' },
          { name: 'Noise Cancellation', value: 'Hybrid ANC (-35dB)' },
          { name: 'Battery Life', value: '40 Hours Playback' },
          { name: 'Bluetooth', value: 'Bluetooth 5.3' }
        ],
        tags: ['headphones', 'wireless', 'audio', 'earphones', 'noise cancelling', 'budget', 'under 3000']
      },
      {
        name: 'PulseTrack GPS Smartwatch',
        brand: 'ApexFit',
        category: catMap['electronics'],
        price: 4999,
        discountPrice: 3999,
        stock: 30,
        sku: 'SKU-APX-WTC-003',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Advanced AMOLED smartwatch featuring continuous SpO2 heart-rate tracking, multi-satellite GPS, 110+ sports modes, Bluetooth calling, and 5ATM water resistance.',
        specifications: [
          { name: 'Display', value: '1.43" AMOLED 466x466' },
          { name: 'Water Resistance', value: '5 ATM (50 meters)' },
          { name: 'Battery', value: '12 Days Typical Usage' }
        ],
        tags: ['smartwatch', 'watch', 'fitness', 'pulse', 'gps', 'electronics', 'gift']
      },
      {
        name: 'Vortex Mechanical Gaming & Typing Keyboard',
        brand: 'Zenith',
        category: catMap['electronics'],
        price: 3499,
        discountPrice: 2899,
        stock: 18,
        sku: 'SKU-ZEN-KBD-004',
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Hot-swappable custom mechanical keyboard with tactile brown switches, south-facing RGB backlighting, sound-dampening silicone foam, and tri-mode wireless connectivity.',
        specifications: [
          { name: 'Switch Type', value: 'Tactile Gateron Brown' },
          { name: 'Connectivity', value: 'Type-C, 2.4GHz Wireless, Bluetooth' },
          { name: 'Layout', value: '75% Compact (82 Keys)' }
        ],
        tags: ['keyboard', 'mechanical', 'coding', 'programming', 'gaming', 'zenith']
      },

      // Fashion
      {
        name: 'Classic Vintage Leather Biker Jacket',
        brand: 'UrbanCraft',
        category: catMap['fashion'],
        price: 6499,
        discountPrice: 5499,
        stock: 12,
        sku: 'SKU-URB-JKT-005',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Crafted from 100% full-grain leather with tailored stitch detailing, asymmetrical zip front, polyester thermal lining, and durable metallic hardware.',
        specifications: [
          { name: 'Material', value: '100% Genuine Full-Grain Leather' },
          { name: 'Fit', value: 'Regular Tailored Fit' },
          { name: 'Closure', value: 'Heavy Duty YKK Metal Zippers' }
        ],
        tags: ['jacket', 'leather', 'fashion', 'winter', 'men', 'streetwear']
      },
      {
        name: 'Pure Heavyweight Cotton Relaxed Hoodie',
        brand: 'CloudWear',
        category: catMap['fashion'],
        price: 1999,
        discountPrice: 1499,
        stock: 50,
        sku: 'SKU-CLD-HOD-006',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80'
        ],
        description: '450 GSM luxury brushed fleece cotton hoodie with drop-shoulder silhouette, kangaroo pocket, and double-layered warm hood. Perfect everyday minimal streetwear.',
        specifications: [
          { name: 'Fabric', value: '100% French Terry Cotton 450 GSM' },
          { name: 'Cut', value: 'Oversized Boxy Fit' }
        ],
        tags: ['hoodie', 'sweatshirt', 'cotton', 'gift', 'fashion', 'under 1500', 'streetwear']
      },
      {
        name: 'AeroMotion Cushioned Running Sneakers',
        brand: 'ApexFit',
        category: catMap['fashion'],
        price: 3299,
        discountPrice: 2799,
        stock: 22,
        sku: 'SKU-APX-SHS-007',
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Ultralight running trainers featuring nitrogen-infused responsive foam midsoles, breathable engineered jacquard mesh, and high-traction rubber outsole.',
        specifications: [
          { name: 'Sole', value: 'Nitrogen-Infused Energy Foam' },
          { name: 'Weight', value: '230g per shoe' }
        ],
        tags: ['shoes', 'sneakers', 'running', 'fitness', 'sports', 'footwear']
      },

      // Home & Kitchen
      {
        name: 'BaristaTouch Compact Espresso Machine',
        brand: 'CaffèModerna',
        category: catMap['home-kitchen'],
        price: 14999,
        discountPrice: 12999,
        stock: 14,
        sku: 'SKU-CAF-ESP-008',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Brews authentic café-quality espresso, cappuccinos, and lattes with a 15-bar Italian pump, PID temperature stabilization, and a commercial stainless steel steam wand.',
        specifications: [
          { name: 'Pressure', value: '15-Bar Professional Pump' },
          { name: 'Water Tank', value: '1.8L Removable Reservoir' },
          { name: 'Housing', value: 'Brushed 304 Stainless Steel' }
        ],
        tags: ['coffee', 'espresso', 'kitchen', 'home', 'appliances', 'barista']
      },
      {
        name: 'SmartCrisp Rapid Air Fryer 5.5L',
        brand: 'ZenithHome',
        category: catMap['home-kitchen'],
        price: 5499,
        discountPrice: 4499,
        stock: 25,
        sku: 'SKU-ZEN-AFR-009',
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Cook delicious crispy snacks with 85% less oil. Equipped with 360-degree rapid air circulation, one-touch digital LED presets, and non-stick dishwasher-safe basket.',
        specifications: [
          { name: 'Capacity', value: '5.5 Litres Family Size' },
          { name: 'Power', value: '1700W High Efficiency' }
        ],
        tags: ['air fryer', 'kitchen', 'cooking', 'healthy', 'home']
      },

      // Books
      {
        name: 'Designing Data-Intensive Applications',
        brand: 'OReilly',
        category: catMap['books'],
        price: 1899,
        discountPrice: 1499,
        stock: 40,
        sku: 'SKU-BOK-DAT-010',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'The definitive guide to the principles and architectures of scalable, reliable, and maintainable systems. Essential reading for software architects and full-stack engineers.',
        specifications: [
          { name: 'Author', value: 'Martin Kleppmann' },
          { name: 'Format', value: 'Paperback, 616 Pages' },
          { name: 'Language', value: 'English' }
        ],
        tags: ['books', 'coding', 'architecture', 'programming', 'college', 'gift', 'under 1500']
      },
      {
        name: 'Atomic Habits: Tiny Changes, Remarkable Results',
        brand: 'Penguin',
        category: catMap['books'],
        price: 799,
        discountPrice: 599,
        stock: 60,
        sku: 'SKU-BOK-HAB-011',
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'A proven, revolutionary framework for improving every day. Discover practical strategies that will teach you exactly how to form good habits, break bad ones, and master tiny behaviors.',
        specifications: [
          { name: 'Author', value: 'James Clear' },
          { name: 'Pages', value: '320 Pages' }
        ],
        tags: ['books', 'self-help', 'productivity', 'habits', 'gift', 'bestseller', 'under 1000']
      },

      // Accessories
      {
        name: 'Handstitched Minimalist RFID Leather Wallet',
        brand: 'UrbanCraft',
        category: catMap['accessories'],
        price: 1299,
        discountPrice: 999,
        stock: 45,
        sku: 'SKU-URB-WLT-012',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Handcrafted crazy horse leather slim cardholder with RFID-blocking protection against digital scanning. Fits up to 8 cards plus folded cash in an ultra-compact pocket profile.',
        specifications: [
          { name: 'Material', value: 'Top-Grain Hunter Leather' },
          { name: 'Protection', value: 'RFID Shielding Frequency 13.56 MHz' },
          { name: 'Dimensions', value: '10.5cm x 7.5cm x 0.8cm' }
        ],
        tags: ['wallet', 'leather', 'accessories', 'gift', 'under 1000', 'under 1500']
      },
      {
        name: 'Voyager All-Weather Commuter Laptop Backpack 25L',
        brand: 'UrbanCraft',
        category: catMap['accessories'],
        price: 2899,
        discountPrice: 2299,
        stock: 35,
        sku: 'SKU-URB-BCK-013',
        isFeatured: false,
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Ergonomic water-resistant backpack engineered with padded 16-inch laptop compartment, hidden anti-theft passport pocket, luggage strap, and external USB charging port.',
        specifications: [
          { name: 'Capacity', value: '25 Litres' },
          { name: 'Material', value: '900D Oxford Water-Repellent Fabric' }
        ],
        tags: ['backpack', 'bag', 'travel', 'laptop bag', 'accessories', 'college']
      },

      // Beauty & Wellness
      {
        name: 'Radiance Botanical Vitamin C Facial Serum',
        brand: 'LuminaPure',
        category: catMap['beauty-wellness'],
        price: 1199,
        discountPrice: 899,
        stock: 50,
        sku: 'SKU-LUM-SRM-014',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80'
        ],
        description: 'Concentrated 15% Ethyl Ascorbic Acid infused with Hyaluronic Acid and Ferulic Acid. Brightens skin tone, reduces pigmentation, and boosts natural collagen production.',
        specifications: [
          { name: 'Active Ingredients', value: '15% Vitamin C, 1% Hyaluronic Acid, Vitamin E' },
          { name: 'Volume', value: '30ml Dropper Bottle' }
        ],
        tags: ['skincare', 'serum', 'vitamin c', 'beauty', 'wellness', 'gift', 'under 1000']
      }
    ];

    const products = await Product.create(productsData);

    // Initial inventory movement for each product
    for (const prod of products) {
      await InventoryMovement.create({
        product: prod._id,
        type: 'in',
        quantity: prod.stock,
        reason: 'Initial Seeding Stock',
        previousStock: 0,
        newStock: prod.stock,
        createdBy: admin._id
      });
    }

    // 4. Seed Reviews
    console.log('[Seed] Creating customer reviews and calculating ratings...');
    await Review.create([
      {
        product: products[0]._id, // Laptop
        user: customer._id,
        rating: 5,
        title: 'Superb machine for web development',
        comment: 'Runs Docker, VS Code, and tons of Chrome tabs without any lag. The OLED display is phenomenal.',
        isVerifiedPurchase: true
      },
      {
        product: products[1]._id, // Headphones
        user: customer._id,
        rating: 5,
        title: 'Unbelievable value under ₹3000!',
        comment: 'The noise cancellation completely blocks out traffic and fan noise. Deep punchy bass and battery easily lasts 4-5 days of commute.',
        isVerifiedPurchase: true
      },
      {
        product: products[2]._id, // Smartwatch
        user: customer._id,
        rating: 4,
        title: 'Very sleek display and accurate tracking',
        comment: 'The AMOLED screen is crystal clear under bright sunlight. GPS locks quickly during morning runs.',
        isVerifiedPurchase: true
      },
      {
        product: products[5]._id, // Hoodie
        user: customer._id,
        rating: 5,
        title: 'Extremely cozy and heavyweight fabric',
        comment: 'The quality of the cotton is on par with luxury streetwear brands. Keeps me warm during chilly evenings.',
        isVerifiedPurchase: true
      }
    ]);

    // Recalculate average ratings for products
    for (const prod of products) {
      await Review.calculateAverageRating(prod._id);
    }

    // 5. Seed Coupons
    console.log('[Seed] Creating promo coupons...');
    await Coupon.create([
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 500,
        maxDiscount: 1000,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
        usageLimit: 1000,
        usedCount: 14
      },
      {
        code: 'SMART500',
        discountType: 'fixed',
        discountValue: 500,
        minOrderAmount: 2999,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        isActive: true,
        usageLimit: 500,
        usedCount: 22
      },
      {
        code: 'FESTIVE20',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 1500,
        maxDiscount: 2000,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
        usageLimit: 200,
        usedCount: 45
      }
    ]);

    // 6. Seed Sample Confirmed & Delivered Orders (for instant analytics & order history)
    console.log('[Seed] Creating sample historical orders for analytics...');
    const pastOrderDates = [3, 7, 12, 18, 25];

    for (let i = 0; i < pastOrderDates.length; i++) {
      const daysAgo = pastOrderDates[i];
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      const p = products[i % products.length];
      const unitPrice = p.discountPrice || p.price;
      const subtotal = unitPrice * 1;
      const shippingCost = subtotal >= 999 ? 0 : 99;
      const total = subtotal + shippingCost;

      const orderNumber = `ORD-DEMO-${1000 + i}`;

      await Order.create({
        orderNumber,
        customer: customer._id,
        items: [
          {
            product: p._id,
            name: p.name,
            price: unitPrice,
            quantity: 1,
            image: p.images[0]
          }
        ],
        shippingAddress: customer.addresses[0],
        subtotal,
        discount: 0,
        shippingCost,
        total,
        paymentProvider: 'razorpay',
        paymentStatus: 'completed',
        orderStatus: i === 0 ? 'processing' : 'delivered',
        razorpayOrderId: `order_sim_${Date.now()}_${i}`,
        razorpayPaymentId: `pay_sim_${Date.now()}_${i}`,
        razorpaySignature: 'simulated_valid_signature',
        trackingDetails: {
          carrier: 'ShopSmart Express',
          trackingNumber: `SSE-IND-2026-${100 + i}`,
          statusTimeline: [
            { status: 'confirmed', note: 'Payment verified', updatedAt: orderDate },
            { status: i === 0 ? 'processing' : 'delivered', note: 'Order fulfilled', updatedAt: new Date() }
          ]
        },
        createdAt: orderDate,
        updatedAt: new Date()
      });
    }

    console.log('------------------------------------------------------------');
    console.log('✅ ShopSmart AI Database Seed Completed Successfully!');
    console.log('------------------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('  Admin:    admin@shopsmart.ai    / Admin@123456');
    console.log('  Customer: customer@shopsmart.ai / Customer@123456');
    console.log('Coupons:');
    console.log('  WELCOME10 (10% off), SMART500 (₹500 off), FESTIVE20 (20% off)');
    console.log('------------------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error]: ${error.message}`);
    process.exit(1);
  }
};

seedData();
