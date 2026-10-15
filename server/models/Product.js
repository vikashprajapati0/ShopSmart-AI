import mongoose from 'mongoose';
import slugify from 'slugify';

const specificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  brand: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  discountPrice: {
    type: Number,
    default: null,
    min: [0, 'Discount price must be positive'],
    validate: {
      validator: function(v) {
        return v === null || v === undefined || v < this.price;
      },
      message: 'Discount price must be less than the regular price'
    }
  },
  images: [{
    type: String,
    required: true
  }],
  stock: {
    type: Number,
    required: [true, 'Stock count is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  specifications: [specificationSchema],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for high performance searches and filters
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });

productSchema.pre('save', function () {
  if (this.isModified('name') || !this.slug) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.slug = `${slugify(this.name, { lower: true, strict: true })}-${randomSuffix}`;
  }
});

const Product = mongoose.model('Product', productSchema);
export default Product;
