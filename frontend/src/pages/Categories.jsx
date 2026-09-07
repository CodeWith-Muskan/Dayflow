import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Folder, FolderPlus, Pencil, Plus, Sparkles, Trash2, TriangleAlert } from "lucide-react";

import CreateCategoryModal from "../components/tasks/CreateCategoryModal";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import { StatsSkeleton } from "../components/common/Skeleton";

import { getCategories, updateCategory, deleteCategory } from "../services/categoryService";
import { getCategoryAnalytics } from "../services/analyticsService";

import { getParentCategories, getSubcategories } from "../utils/categories";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createParentId, setCreateParentId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [categoryData, analyticsData] = await Promise.all([getCategories(), getCategoryAnalytics()]);

      setCategories(categoryData);
      setAnalytics(analyticsData);
    } catch {
      setError("Unable to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setCategories, setAnalytics]);

  useEffect(() => {
    load();
  }, [load]);

  const parents = getParentCategories(categories);
  const selected = categories.find((category) => category._id === selectedId);
  const selectedChildren = selected ? getSubcategories(categories, selected._id) : [];
  const analyticsFor = (id) => analytics.find((item) => item._id === id);

  const subcategoryCount = (parentId) => getSubcategories(categories, parentId).length;

  const openCreate = (parentId = null) => {
    setCreateParentId(parentId);
    setShowCreate(true);
  };

  const handleCreated = (category) => {
    setCategories((previous) => {
      const exists = previous.some((item) => item._id === category._id);
      return exists ? previous : [...previous, category];
    });
  };

  const handleRename = async (event) => {
    event.preventDefault();

    if (!name.trim()) return;

    try {
      setSaving(true);
      const updated = await updateCategory(editing._id, { name: name.trim() });

      setCategories((previous) => previous.map((category) => (category._id === updated._id ? updated : category)));
      setEditing(null);
      setName("");
    } catch (err) {
      alert(err.response?.data?.message || "Could not rename the category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await deleteCategory(confirmDelete._id);
      setCategories((previous) =>
        previous.filter(
          (category) =>
            String(category._id) !== String(confirmDelete._id) &&
            String(category.parentCategory || "") !== String(confirmDelete._id)
        )
      );
      if (selectedId === confirmDelete._id) setSelectedId(null);
      setConfirmDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete the category.");
    }
  };

  const parentCount = selected ? analyticsFor(selected._id)?.totalTasks ?? 0 : 0;

  return (
    <div className="df-page categories-page">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      {!selected ? (
        <>
          <div className="page-head">
            <div>
              <span className="page-eyebrow">
                <Sparkles size={13} />
                CATEGORIES
              </span>
              <h1>Categories</h1>
              <p>Organize your tasks.</p>
            </div>

            <button type="button" className="df-btn primary" onClick={() => openCreate(null)}>
              <Plus size={16} />
              New Category
            </button>
          </div>

          {error ? (
            <div className="error-state">
              <TriangleAlert size={22} />
              <p>{error}</p>
              <button type="button" className="df-btn secondary" onClick={load}>
                Try Again
              </button>
            </div>
          ) : loading ? (
            <StatsSkeleton count={3} />
          ) : parents.length === 0 ? (
            <EmptyState
              icon={Folder}
              title="No categories yet."
              subtitle="Create categories to organize your tasks across every day."
              action={
                <button type="button" className="df-btn primary" onClick={() => openCreate(null)}>
                  <Plus size={16} />
                  Create category
                </button>
              }
            />
          ) : (
            <div className="categories-grid">
              {parents.map((category, index) => {
                const stats = analyticsFor(category._id);

                return (
                  <button
                    type="button"
                    className={`category-card cat-${category.color || "lavender"}`}
                    key={category._id}
                    style={{ animationDelay: `${index * 60}ms` }}
                    onClick={() => setSelectedId(category._id)}
                  >
                    <span className="category-card-icon">
                      <Folder size={19} />
                    </span>

                    <div className="category-card-body">
                      <h2>{category.name}</h2>

                      <p>
                        {stats?.totalTasks ?? 0} {stats?.totalTasks === 1 ? "task" : "tasks"}
                        {" · "}
                        {subcategoryCount(category._id)} {subcategoryCount(category._id) === 1 ? "subcategory" : "subcategories"}
                      </p>
                    </div>

                    <div className="category-card-arrow">
                      <ArrowRightIcon />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="detail-head">
            <button type="button" className="df-btn secondary back-button" onClick={() => setSelectedId(null)}>
              <ArrowLeft size={16} />
              All categories
            </button>

            <div className="detail-actions">
              <button
                type="button"
                className="df-btn secondary"
                onClick={() => openCreate(selected._id)}
              >
                <Plus size={16} />
                New subcategory
              </button>

              <button
                type="button"
                className="icon-btn"
                title="Rename"
                onClick={() => {
                  setEditing(selected);
                  setName(selected.name);
                }}
              >
                <Pencil size={16} />
              </button>

              <button
                type="button"
                className="icon-btn danger"
                title="Delete category"
                onClick={() => setConfirmDelete(selected)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className={`detail-card cat-${selected.color || "lavender"}`}>
            <span className="category-card-icon large">
              <Folder size={22} />
            </span>

            <h1>{selected.name}</h1>

            <p className="detail-count">
              {parentCount} {parentCount === 1 ? "task" : "tasks"} across all subcategories
            </p>
          </div>

          <div className="section-head">
            <div>
              <h2>Subcategories</h2>
              <p>
                {selectedChildren.length} {selectedChildren.length === 1 ? "subcategory" : "subcategories"}
              </p>
            </div>
          </div>

          {selectedChildren.length === 0 ? (
            <EmptyState
              icon={FolderPlus}
              title="No subcategories."
              subtitle="Break this space into smaller pieces."
              action={
                <button type="button" className="df-btn secondary" onClick={() => openCreate(selected._id)}>
                  <Plus size={16} />
                  New subcategory
                </button>
              }
            />
          ) : (
            <div className="subcategory-grid">
              {selectedChildren.map((subcategory) => {
                const stats = analyticsFor(subcategory._id);

                return (
                  <div className={`category-card cat-${selected.color || "lavender"}`} key={subcategory._id}>
                    <div className="category-card-body">
                      <h2>{subcategory.name}</h2>
                      <p>
                        {stats?.totalTasks ?? 0} {stats?.totalTasks === 1 ? "task" : "tasks"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <CreateCategoryModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        categories={categories}
        defaultParentId={createParentId}
        onCreated={handleCreated}
      />

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Rename category" size="sm">
        <form className="task-form" onSubmit={handleRename}>
          <div className="form-field">
            <label>Category name</label>
            <input type="text" value={name} autoFocus onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="modal-footer-inner">
            <button type="button" className="df-btn secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>

            <button type="submit" className="df-btn primary" disabled={saving || !name.trim()}>
              Save
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete category?" size="sm">
        <p className="confirm-text">
          "{confirmDelete?.name}" and its subcategories will be permanently removed. Tasks will not be deleted.
        </p>

        <div className="modal-footer-inner">
          <button type="button" className="df-btn secondary" onClick={() => setConfirmDelete(null)}>
            Cancel
          </button>

          <button type="button" className="df-btn danger" onClick={handleDelete}>
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
);

export default Categories;