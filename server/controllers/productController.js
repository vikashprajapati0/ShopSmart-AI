import Product from '../models/Product.js';
import Category from '../models/Category.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      inStock,
      sort = 'newest'
    } = req.query;

    const query = { isActive: true };

    // Search filter
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Category filter
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const catDoc = await Category.findOne({ slug: category.toLowerCase() });
        if (catDoc) {
          query.category = catDoc._id;
        }
      }
    }

    // Brand filter (comma-separated or single)
    if (brand) {
      const brands = brand.split(',').map(b => new RegExp(`^${b.trim()}$`, 'i'));
      query.brand = { $in: brands };
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
    }

    // Rating
    if (rating) {
      query['ratings.average'] = { $gte: Number(rating) };
    }

    // In Stock
    if (inStock === 'true' || inStock === true) {
      query.stock = { $gt: 0 };
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    switch (sort) {
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'rating':
        sortOptions = { 'ratings.average': -1, 'ratings.count': -1 };
        break;
      case 'popularity':
        sortOptions = { 'ratings.count': -1, isFeatured: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      products
    });
  } catch (err) {
    next(err);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .populate('category', 'name slug')
      .sort({ 'ratings.average': -1 })
      .limit(8)
      .lean();

    res.status(200).json({ success: true, products });
  } catch (err) {
    next(err);
  }
};

export const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentProduct = await Product.findById(id);

    if (!currentProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const related = await Product.find({
      _id: { $ne: currentProduct._id },
      category: currentProduct.category,
      isActive: true
    })
      .populate('category', 'name slug')
      .limit(4)
      .lean();

    res.status(200).json({ success: true, products: related });
  } catch (err) {
    next(err);
  }
};

export const getFilterMeta = async (req, res, next) => {
  try {
    const [categories, brands, priceStats] = await Promise.all([
      Category.find({ isActive: true }).select('name slug icon'),
      Product.distinct('brand', { isActive: true }),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      categories,
      brands: brands.filter(Boolean).sort(),
      priceRange: {
        min: priceStats[0]?.minPrice || 0,
        max: priceStats[0]?.maxPrice || 100000
      }
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getProducts,
  getProductBySlug,
  getProductById,
  getFeaturedProducts,
  getRelatedProducts,
  getFilterMeta
};
