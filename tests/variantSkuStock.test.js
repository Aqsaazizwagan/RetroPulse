const test = require('node:test');
const assert = require('node:assert');
const {
  validateSkuFormat,
  validateStockQuantity,
  validateSkuUniqueness,
  deductVariantStock,
  restockVariant,
  VariantStockError
} = require('../src/services/variantService');

test('Variant/SKU Combination and Stock Rules Suite', async (t) => {
  const existingVariants = [
    { id: 1, product_id: 1, sku: 'NES-001-MINT-01', stock_quantity: 5 },
    { id: 2, product_id: 1, sku: 'NES-001-WEAR-02', stock_quantity: 2 }
  ];

  await t.test('SKU RULE 1: Valid SKU formats are normalized to uppercase', () => {
    const sku = validateSkuFormat('gen-m1-hdg-mint');
    assert.strictEqual(sku, 'GEN-M1-HDG-MINT');
  });

  await t.test('SKU RULE 2: Invalid SKU characters trigger an error', () => {
    assert.throws(
      () => validateSkuFormat('NES$$$001!!!'),
      (err) => {
        assert.ok(err instanceof VariantStockError);
        assert.strictEqual(err.code, 'INVALID_SKU_CHARS');
        return true;
      }
    );
  });

  await t.test('SKU COMBINATION RULE: Duplicate SKU combination is strictly prevented', () => {
    assert.throws(
      () => validateSkuUniqueness('NES-001-MINT-01', existingVariants),
      (err) => {
        assert.ok(err instanceof VariantStockError);
        assert.strictEqual(err.code, 'DUPLICATE_SKU');
        return true;
      }
    );
  });

  await t.test('STOCK RULE 1: Negative stock cannot be initialized', () => {
    assert.throws(
      () => validateStockQuantity(-3),
      (err) => {
        assert.ok(err instanceof VariantStockError);
        assert.strictEqual(err.code, 'INVALID_STOCK_QUANTITY');
        return true;
      }
    );
  });

  await t.test('STOCK RULE 2: Stock deduction succeeds when quantity <= available', () => {
    const variant = { sku: 'NES-001-MINT-01', stock_quantity: 5 };
    const updated = deductVariantStock(variant, 2);
    assert.strictEqual(updated.stock_quantity, 3);
  });

  await t.test('STOCK RULE 3: Deduction exceeding available stock fails with INSUFFICIENT_STOCK', () => {
    const variant = { sku: 'NES-001-WEAR-02', stock_quantity: 2 };
    assert.throws(
      () => deductVariantStock(variant, 5),
      (err) => {
        assert.ok(err instanceof VariantStockError);
        assert.strictEqual(err.code, 'INSUFFICIENT_STOCK');
        return true;
      }
    );
  });

  await t.test('STOCK RULE 4: Restocking increments inventory accurately', () => {
    const variant = { sku: 'NES-001-WEAR-02', stock_quantity: 2 };
    const restocked = restockVariant(variant, 10);
    assert.strictEqual(restocked.stock_quantity, 12);
  });
});
