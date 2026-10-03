/**
 * Category Hierarchy Service with Cycle Prevention
 * Ensures strict acyclic tree structure for nested taxonomy.
 */

class CategoryHierarchyError extends Error {
  constructor(message, code = 'CATEGORY_CYCLE_DETECTED') {
    super(message);
    this.name = 'CategoryHierarchyError';
    this.code = code;
    this.statusCode = 400;
  }
}

/**
 * Validates that setting `targetParentId` for category `categoryId` does not create a cycle.
 * @param {number|string} categoryId - The category being moved/updated
 * @param {number|string|null} targetParentId - The proposed parent category ID
 * @param {Function} findCategoryById - Function returning a category { id, parent_category_id }
 * @returns {boolean} true if valid, throws CategoryHierarchyError if cycle detected
 */
async function validateParentHierarchy(categoryId, targetParentId, findCategoryById) {
  // 1. Moving to root is always valid
  if (targetParentId === null || targetParentId === undefined) {
    return true;
  }

  const catId = Number(categoryId);
  const parentId = Number(targetParentId);

  // 2. A category cannot be its own parent
  if (catId === parentId) {
    throw new CategoryHierarchyError(
      `Category ${catId} cannot be its own parent. Self-referencing cycle rejected.`,
      'SELF_PARENT_CYCLE'
    );
  }

  // 3. Cycle prevention: Traverse up the ancestor chain of targetParentId
  // If we encounter categoryId in targetParentId's ancestors, then targetParentId
  // is a descendant of categoryId -> Setting it as parent would create an infinite cycle!
  let currentId = parentId;
  const visited = new Set();
  const maxDepth = 25; // Depth safeguard
  let depth = 0;

  while (currentId !== null && currentId !== undefined) {
    if (visited.has(currentId)) {
      throw new CategoryHierarchyError(
        `Pre-existing cycle detected at category ${currentId}.`,
        'PREEXISTING_CYCLE'
      );
    }
    visited.add(currentId);

    if (currentId === catId) {
      throw new CategoryHierarchyError(
        `Cycle detected: Cannot set parent to category ${parentId} because it is a descendant of category ${catId}.`,
        'CATEGORY_CYCLE_DETECTED'
      );
    }

    depth++;
    if (depth > maxDepth) {
      throw new CategoryHierarchyError(
        `Hierarchy maximum depth limit (${maxDepth}) exceeded.`,
        'MAX_DEPTH_EXCEEDED'
      );
    }

    const currentCat = await findCategoryById(currentId);
    if (!currentCat) {
      throw new CategoryHierarchyError(
        `Parent category ${currentId} does not exist.`,
        'PARENT_NOT_FOUND'
      );
    }

    currentId = currentCat.parent_category_id ? Number(currentCat.parent_category_id) : null;
  }

  return true;
}

module.exports = {
  validateParentHierarchy,
  CategoryHierarchyError
};
