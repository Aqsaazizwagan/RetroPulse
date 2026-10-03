const express = require('express');
const { authenticate, requireAdmin } = require('./middleware/auth');
const { validateParentHierarchy, CategoryHierarchyError } = require('./services/categoryService');
const {
  validateSkuUniqueness,
  validateStockQuantity,
  deductVariantStock,
  restockVariant,
  VariantStockError
} = require('./services/variantService');

const app = express();
app.use(express.json());

// In-Memory Data Store initialized with Seed Data
const database = {
  categories: [
    { id: 1, name: 'Consoles', slug: 'consoles', device_era: 'General', parent_category_id: null },
    { id: 2, name: '8-Bit Home Consoles', slug: '8-bit-home-consoles', device_era: '8-Bit Era (1983-1987)', parent_category_id: 1 },
    { id: 3, name: '16-Bit Home Consoles', slug: '16-bit-home-consoles', device_era: '16-Bit Era (1988-1993)', parent_category_id: 1 },
    { id: 4, name: '32/64-Bit 3D Consoles', slug: '32-64-bit-consoles', device_era: '5th Gen (1994-1999)', parent_category_id: 1 },
    { id: 5, name: 'Handhelds', slug: 'handhelds', device_era: 'Portable (1989-2004)', parent_category_id: null },
    { id: 6, name: 'Vintage Audio & CRTs', slug: 'vintage-audio-crts', device_era: 'Retro A/V (1975-1995)', parent_category_id: null },
    { id: 7, name: 'Replacement Parts & Mods', slug: 'replacement-parts-mods', device_era: 'Hardware Components', parent_category_id: null }
  ],
  products: [
    { id: 1, category_id: 2, name: 'Nintendo Entertainment System (NES-001)', brand: 'Nintendo' },
    { id: 2, category_id: 3, name: 'Sega Genesis Model 1 (High Definition Graphics)', brand: 'Sega' },
    { id: 3, category_id: 5, name: 'Nintendo Game Boy Color (CGB-001)', brand: 'Nintendo' }
  ],
  variants: [
    { id: 1, product_id: 1, sku: 'NES-001-MINT-01', variant_name: 'Recapped + Gold Pins', condition_grade: 'Mint / Restored', price: 159.99, stock_quantity: 4 },
    { id: 2, product_id: 1, sku: 'NES-001-WEAR-02', variant_name: 'OEM Cleaned', condition_grade: 'Working - Cosmetic Wear', price: 119.50, stock_quantity: 2 },
    { id: 3, product_id: 2, sku: 'GEN-M1-HDG-MINT', variant_name: 'Yamaha Audio Edition', condition_grade: 'Mint / Restored', price: 139.00, stock_quantity: 3 },
    { id: 4, product_id: 3, sku: 'GBC-IPS-ATOMIC', variant_name: 'Atomic Purple IPS Mod', condition_grade: 'Refurbished - Shell Mod', price: 179.00, stock_quantity: 5 }
  ]
};

// --- PUBLIC ROUTES ---
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'online', service: 'RetroPulse API' });
});

app.get('/api/categories', (req, res) => {
  res.json({ success: true, data: database.categories });
});

app.get('/api/products', (req, res) => {
  res.json({ success: true, data: database.products });
});

// --- ADMINISTRATIVE ROUTES (Protected: Authenticate + RequireAdmin) ---
app.use('/api/admin', authenticate, requireAdmin);

// 1. Create Category (Hierarchy validated)
app.post('/api/admin/categories', async (req, res) => {
  try {
    const { name, slug, device_era, parent_category_id } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, error: { message: 'name and slug are required.' } });
    }

    const nextId = database.categories.length + 1;
    if (parent_category_id) {
      await validateParentHierarchy(nextId, parent_category_id, async (id) =>
        database.categories.find(c => c.id === Number(id))
      );
    }

    const newCategory = {
      id: nextId,
      name,
      slug,
      device_era: device_era || 'General',
      parent_category_id: parent_category_id ? Number(parent_category_id) : null
    };

    database.categories.push(newCategory);
    res.status(201).json({ success: true, data: newCategory, message: 'Category created successfully.' });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: { code: err.code || 'BAD_REQUEST', message: err.message }
    });
  }
});

// 2. Update Category Parent (Cycle Prevention Enforced)
app.put('/api/admin/categories/:id', async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const category = database.categories.find(c => c.id === categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: { message: 'Category not found.' } });
    }

    const { name, parent_category_id } = req.body;

    if (parent_category_id !== undefined) {
      await validateParentHierarchy(categoryId, parent_category_id, async (id) =>
        database.categories.find(c => c.id === Number(id))
      );
      category.parent_category_id = parent_category_id !== null ? Number(parent_category_id) : null;
    }

    if (name) category.name = name;

    res.json({ success: true, data: category, message: 'Category updated successfully.' });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: { code: err.code || 'BAD_REQUEST', message: err.message }
    });
  }
});

// 3. Create Variant / SKU Combination (Uniqueness & Stock Rules Enforced)
app.post('/api/admin/products/:productId/variants', (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const { sku, variant_name, condition_grade, price, stock_quantity } = req.body;

    // Validate SKU uniqueness
    const validSku = validateSkuUniqueness(sku, database.variants);
    const validStock = validateStockQuantity(stock_quantity !== undefined ? stock_quantity : 0);

    const newVariant = {
      id: database.variants.length + 1,
      product_id: productId,
      sku: validSku,
      variant_name: variant_name || 'Standard Refurbished',
      condition_grade: condition_grade || 'Mint / Restored',
      price: Number(price) || 99.99,
      stock_quantity: validStock
    };

    database.variants.push(newVariant);
    res.status(201).json({ success: true, data: newVariant, message: 'Product variant/SKU registered successfully.' });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: { code: err.code || 'BAD_REQUEST', message: err.message }
    });
  }
});

// 4. Update Variant Stock (Deduction & Restock Rules)
app.patch('/api/admin/variants/:id/stock', (req, res) => {
  try {
    const variantId = Number(req.params.id);
    const variant = database.variants.find(v => v.id === variantId);
    if (!variant) {
      return res.status(404).json({ success: false, error: { message: 'Variant not found.' } });
    }

    const { action, quantity } = req.body; // action: 'deduct' or 'restock'
    let updated;

    if (action === 'deduct') {
      updated = deductVariantStock(variant, quantity);
    } else if (action === 'restock') {
      updated = restockVariant(variant, quantity);
    } else {
      return res.status(400).json({ success: false, error: { message: "action must be 'deduct' or 'restock'." } });
    }

    Object.assign(variant, updated);
    res.json({ success: true, data: variant, message: `Stock ${action}ed successfully.` });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: { code: err.code || 'BAD_REQUEST', message: err.message }
    });
  }
});

module.exports = { app, database };
