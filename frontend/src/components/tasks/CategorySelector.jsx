import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, FolderPlus, Plus, Search, X } from "lucide-react";

import { getParentCategories, getSubcategories, categoryLabel } from "../../utils/categories";

// Custom searchable category selector supporting a single level of subcategories.
// Only shows the search box when there are enough categories.
const CategorySelector = ({
  categories = [],
  value,
  onChange,
  onCreateCategory,
  onCreateSubcategory,
  placeholder = "Category",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState([]);

  const selectorRef = useRef(null);

  const selectedCategory = categories.find((category) => category._id === value);

  const parents = getParentCategories(categories);
  const showSearch = categories.length > 5;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleExpanded = (id) => {
    setExpandedIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    );
  };

  const selectCategory = (id) => {
    onChange(id);
    setIsOpen(false);
    setSearch("");
  };

  const visibleParents = parents.filter((parent) => {
    const query = search.toLowerCase();

    const parentMatches = parent.name.toLowerCase().includes(query);
    const childMatches = getSubcategories(categories, parent._id).some((sub) =>
      sub.name.toLowerCase().includes(query)
    );

    return parentMatches || childMatches;
  });

  return (
    <div className="category-selector" ref={selectorRef}>
      <button
        type="button"
        className={`category-selector-trigger ${isOpen ? "selector-open" : ""}`}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span className={`selector-cat-dot ${selectedCategory ? `cat-${selectedCategory.color || "lavender"}` : "cat-none"}`} />

        <span className="selector-selected">
          {selectedCategory ? categoryLabel(selectedCategory) : placeholder}
        </span>

        {selectedCategory && (
          <span
            className="clear-category"
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              selectCategory("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.stopPropagation();
                selectCategory("");
              }
            }}
          >
            <X size={14} />
          </span>
        )}

        <ChevronDown size={16} className={`selector-chevron ${isOpen ? "chevron-rotate" : ""}`} />
      </button>

      {isOpen && (
        <div className="category-dropdown">
          {showSearch && (
            <div className="category-search">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                autoFocus
              />
            </div>
          )}

          <div className="category-options">
            <button type="button" className={`category-option no-category ${!value ? "option-selected" : ""}`} onClick={() => selectCategory("")}>
              <span className="selector-cat-dot cat-none" />
              <span>No category</span>
              {!value && <Check size={15} />}
            </button>

            {visibleParents.map((parent) => {
              const subcategories = getSubcategories(categories, parent._id);
              const isExpanded = expandedIds.includes(parent._id) || search.length > 0;

              return (
                <div className="category-group" key={parent._id}>
                  <div className="parent-category-row">
                    <button type="button" className="expand-category" onClick={() => toggleExpanded(parent._id)} aria-label="Expand subcategories">
                      <ChevronRight size={14} className={isExpanded ? "subcategory-expanded" : ""} />
                    </button>

                    <button
                      type="button"
                      className={`category-option parent-option ${value === parent._id ? "option-selected" : ""}`}
                      onClick={() => selectCategory(parent._id)}
                    >
                      <span className={`selector-cat-dot cat-${parent.color || "lavender"}`} />
                      <span>{parent.name}</span>
                      {value === parent._id && <Check size={15} />}
                    </button>

                    <button
                      type="button"
                      className="quick-add-subcategory"
                      title="Add subcategory"
                      onClick={() => {
                        setIsOpen(false);
                        onCreateSubcategory(parent);
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {isExpanded &&
                    subcategories.map((subcategory) => (
                      <button
                        type="button"
                        className={`category-option subcategory-option ${value === subcategory._id ? "option-selected" : ""}`}
                        key={subcategory._id}
                        onClick={() => selectCategory(subcategory._id)}
                      >
                        <span className="subcategory-line" />
                        <span className={`selector-cat-dot cat-${parent.color || "lavender"}`} />
                        <span>{subcategory.name}</span>
                        {value === subcategory._id && <Check size={15} />}
                      </button>
                    ))}

                  {isExpanded && subcategories.length === 0 && (
                    <button type="button" className="empty-subcategory" onClick={() => { setIsOpen(false); onCreateSubcategory(parent); }}>
                      Create first subcategory
                    </button>
                  )}
                </div>
              );
            })}

            {visibleParents.length === 0 && search && <div className="no-search-results">No matching category found.</div>}

            {categories.length === 0 && <div className="no-search-results">You haven't created any categories yet.</div>}
          </div>

          <div className="category-dropdown-footer">
            <button type="button" onClick={() => { setIsOpen(false); onCreateCategory(); }}>
              <FolderPlus size={16} />
              New category
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;