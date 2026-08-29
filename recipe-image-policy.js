(function attachRecipeImagePolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RecipeImagePolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createRecipeImagePolicy() {
  'use strict';
  const IMAGES = Object.freeze({
    uncommon: 'assets/recipe-uncommon.png?v=20260830-quality-recipe-art-v1',
    rare: 'assets/recipe-rare.png?v=20260830-quality-recipe-art-v1',
    epic: 'assets/recipe-epic.png?v=20260830-quality-recipe-art-v1',
    legendary: 'assets/recipe-legendary.png?v=20260830-quality-recipe-art-v1'
  });
  function getImage(quality) { return IMAGES[String(quality || '').toLowerCase()] || null; }
  return Object.freeze({ IMAGES, getImage });
}));
