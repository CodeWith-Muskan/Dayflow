const CategoryTag = ({ category }) => {
  if (!category) return null;

  const colorKey = category.color || "lavender";
  const parent = category.parentCategory;

  return (
    <span className={`category-tag cat-${colorKey}`}>
      <span className="category-tag-dot" />
      {parent ? `${parent.name} · ${category.name}` : category.name}
    </span>
  );
};

export default CategoryTag;