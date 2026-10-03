const test = require('node:test');
const assert = require('node:assert');
const { validateParentHierarchy, CategoryHierarchyError } = require('../src/services/categoryService');

test('Category Hierarchy & Cycle Prevention Suite', async (t) => {
  // Mock Category Tree:
  // Root: 1 ("Consoles")
  //   Child: 2 ("8-Bit Consoles", parent: 1)
  //     Child: 10 ("NES Subcategory", parent: 2)
  // Root: 5 ("Handhelds", parent: null)
  const categories = [
    { id: 1, name: 'Consoles', parent_category_id: null },
    { id: 2, name: '8-Bit Consoles', parent_category_id: 1 },
    { id: 10, name: 'NES Subcategory', parent_category_id: 2 },
    { id: 5, name: 'Handhelds', parent_category_id: null }
  ];

  const findCategoryById = async (id) => categories.find(c => c.id === Number(id));

  await t.test('RULE 1: Setting parent to null (root level) is valid', async () => {
    const isValid = await validateParentHierarchy(2, null, findCategoryById);
    assert.strictEqual(isValid, true);
  });

  await t.test('RULE 2: Moving category to another valid parent succeeds', async () => {
    const isValid = await validateParentHierarchy(2, 5, findCategoryById);
    assert.strictEqual(isValid, true);
  });

  await t.test('CYCLE PREVENTION 1: Setting category parent to itself must throw SELF_PARENT_CYCLE', async () => {
    await assert.rejects(
      async () => {
        await validateParentHierarchy(1, 1, findCategoryById);
      },
      (err) => {
        assert.ok(err instanceof CategoryHierarchyError);
        assert.strictEqual(err.code, 'SELF_PARENT_CYCLE');
        return true;
      }
    );
  });

  await t.test('CYCLE PREVENTION 2: Setting parent to a direct descendant creates cycle and is rejected', async () => {
    // Category 1 is parent of Category 2.
    // Attempting to set Category 1's parent to Category 2 creates 1 -> 2 -> 1 cycle!
    await assert.rejects(
      async () => {
        await validateParentHierarchy(1, 2, findCategoryById);
      },
      (err) => {
        assert.ok(err instanceof CategoryHierarchyError);
        assert.strictEqual(err.code, 'CATEGORY_CYCLE_DETECTED');
        return true;
      }
    );
  });

  await t.test('CYCLE PREVENTION 3: Setting parent to an indirect deep descendant is rejected', async () => {
    // Category 1 -> Category 2 -> Category 10
    // Attempting to set Category 1's parent to Category 10 creates 1 -> 10 -> 2 -> 1 cycle!
    await assert.rejects(
      async () => {
        await validateParentHierarchy(1, 10, findCategoryById);
      },
      (err) => {
        assert.ok(err instanceof CategoryHierarchyError);
        assert.strictEqual(err.code, 'CATEGORY_CYCLE_DETECTED');
        return true;
      }
    );
  });
});
