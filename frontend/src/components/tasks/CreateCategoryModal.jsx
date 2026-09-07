import { useEffect, useState } from "react";
import { FolderPlus } from "lucide-react";

import Modal from "../common/Modal";
import { createCategory } from "../../services/categoryService";
import { getParentCategories } from "../../utils/categories";

// Create a category or subcategory without leaving the current screen.
const CreateCategoryModal = ({
  open,
  onClose,
  categories = [],
  defaultParentId = null,
  onCreated,
}) => {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(defaultParentId);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
      setParentId(defaultParentId);
    }
  }, [open, defaultParentId]);

  const parents = getParentCategories(categories);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Give your category a name.");
      return;
    }

    try {
      setLoading(true);

      const category = await createCategory({
        name: name.trim(),
        parentCategory: parentId || null,
      });

      onCreated?.(category, parentId);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create the category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New category" size="sm">
      <form className="category-create-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="new-category-name">
            {parentId ? "Subcategory name" : "Category name"}
          </label>

          <input
            id="new-category-name"
            type="text"
            placeholder={parentId ? "e.g. Mathematics" : "e.g. Study"}
            value={name}
            autoFocus
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Parent category</label>

          <div className="parent-picker">
            <button
              type="button"
              className={`parent-pill ${!parentId ? "selected" : ""}`}
              onClick={() => setParentId(null)}
            >
              Top-level
            </button>

            {parents.map((parent) => (
              <button
                type="button"
                key={parent._id}
                className={`parent-pill ${parentId === parent._id ? "selected" : ""}`}
                onClick={() => setParentId(parent._id)}
              >
                <span className={`selector-cat-dot cat-${parent.color || "lavender"}`} />
                {parent.name}
              </button>
            ))}

            {parents.length === 0 && <span className="parent-picker-hint">This will be a top-level category.</span>}
          </div>

          {parentId && <p className="form-hint">This will be added under the selected category.</p>}
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-footer-inner">
          <button type="button" className="df-btn secondary" onClick={onClose}>
            Cancel
          </button>

          <button type="submit" className="df-btn primary" disabled={loading || !name.trim()}>
            <FolderPlus size={16} />
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCategoryModal;