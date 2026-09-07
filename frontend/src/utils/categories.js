export const getParentCategories = (categories) =>
  categories.filter((category) => !category.parentCategory);

export const getSubcategories = (categories, parentId) =>
  categories.filter((category) => {
    if (!category.parentCategory) return false;

    const parent = category.parentCategory;

    return parent === parentId || parent?._id === parentId;
  });

export const findCategory = (categories, id) =>
  categories.find((category) => category._id === id);

export const categoryLabel = (category) => {
  if (!category) return "";

  const parent = category.parentCategory;

  return parent ? `${parent.name} · ${category.name}` : category.name;
};