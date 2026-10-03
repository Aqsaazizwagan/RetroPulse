/**
 * Variant & SKU Inventory Service
 * Enforces business rules for SKU uniqueness, variant combinations, and non-negative stock levels.
 */

class VariantStockError extends Error {
  constructor(message, code = 'STOCK_RULE_VIOLATION') {
    super(message);
    this.name = 'VariantStockError';
    this.code = code;
    this.statusCode = 400;
  }
}

/**
 * Validates SKU format and ensures uniqueness across product variants.
 */
function validateSkuFormat(sku) {
  if (!sku || typeof sku !== 'string' || sku.trim().length < 3) {
    throw new VariantStockError('SKU must be a non-empty string with at least 3 characters.', 'INVALID_SKU_FORMAT');
  }
  // Standard SKU alphanumeric with hyphens/underscores
  const skuRegex = /^[A-Z0-9_-]+$/i;
  if (!skuRegex.test(sku.trim())) {
    throw new VariantStockError(`SKU '${sku}' contains invalid characters. Use alphanumeric, hyphens, and underscores only.`, 'INVALID_SKU_CHARS');
  }
  return sku.trim().toUpperCase();
}

/**
 * Validates stock quantity rules (must be non-negative integer).
 */
function validateStockQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new VariantStockError(`Stock quantity must be a non-negative integer. Received: ${quantity}`, 'INVALID_STOCK_QUANTITY');
  }
  return quantity;
}

/**
 * Validates SKU combination uniqueness within a collection of existing variants.
 */
function validateSkuUniqueness(newSku, existingVariants) {
  const normalizedSku = validateSkuFormat(newSku);
  const duplicate = existingVariants.some(v => v.sku.toUpperCase() === normalizedSku);
  if (duplicate) {
    throw new VariantStockError(`SKU combination conflict: SKU '${normalizedSku}' is already registered.`, 'DUPLICATE_SKU');
  }
  return normalizedSku;
}

/**
 * Deducts stock according to atomic inventory rules.
 * Throws error if requested quantity exceeds current stock.
 */
function deductVariantStock(variant, quantityToDeduct) {
  if (!Number.isInteger(quantityToDeduct) || quantityToDeduct <= 0) {
    throw new VariantStockError('Deduction quantity must be a positive integer.', 'INVALID_DEDUCTION_AMOUNT');
  }

  if (variant.stock_quantity < quantityToDeduct) {
    throw new VariantStockError(
      `Insufficient stock for SKU '${variant.sku}'. Available: ${variant.stock_quantity}, Requested: ${quantityToDeduct}`,
      'INSUFFICIENT_STOCK'
    );
  }

  const updatedStock = variant.stock_quantity - quantityToDeduct;
  if (updatedStock < 0) {
    throw new VariantStockError('Stock cannot drop below zero.', 'NEGATIVE_STOCK_PREVENTED');
  }

  return {
    ...variant,
    stock_quantity: updatedStock
  };
}

/**
 * Restocks inventory with safety limits.
 */
function restockVariant(variant, quantityToAdd) {
  if (!Number.isInteger(quantityToAdd) || quantityToAdd <= 0) {
    throw new VariantStockError('Restock quantity must be a positive integer.', 'INVALID_RESTOCK_AMOUNT');
  }

  return {
    ...variant,
    stock_quantity: variant.stock_quantity + quantityToAdd
  };
}

module.exports = {
  validateSkuFormat,
  validateStockQuantity,
  validateSkuUniqueness,
  deductVariantStock,
  restockVariant,
  VariantStockError
};
