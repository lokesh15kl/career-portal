import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import {
  addCareerProfile,
  addCareerSection,
  deleteCareerProfile,
  deleteCareerSection,
  getCareerCatalog,
  getCareerSections,
  updateCareerSection,
  updateCareerProfile,
  logout
} from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";

export default function AdminCareers() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [careers, setCareers] = useState([]);
  const [newSection, setNewSection] = useState("");
  const [editingSectionName, setEditingSectionName] = useState("");
  const [sectionDraft, setSectionDraft] = useState("");
  const [careerForm, setCareerForm] = useState({
    role: "",
    category: "",
    skills: "",
    path: ""
  });
  const [editingCareerId, setEditingCareerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recentReassignment, setRecentReassignment] = useState(null);

  const sectionOptions = useMemo(() => {
    const unique = Array.from(new Set(sections));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [sections]);

  const loadCareerData = async () => {
    setLoading(true);
    setError("");

    try {
      const [sectionData, careerData] = await Promise.all([getCareerSections(), getCareerCatalog()]);
      setSections(Array.isArray(sectionData) ? sectionData : []);
      setCareers(Array.isArray(careerData) ? careerData : []);
    } catch (loadError) {
      setError(loadError?.message || "Unable to load careers data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCareerData();
  }, []);

  const onLogout = async () => {
    try {
      await logout();
    } catch {
      // no-op
    }

    setLoggedIn(false);
    setRole("");
    navigate("/login", { replace: true });
  };

  const onAddSection = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setRecentReassignment(null);

    const value = newSection.trim();

    if (!value) {
      return;
    }

    try {
      const updatedSections = await addCareerSection(value);
      setSections(updatedSections);
      setNewSection("");

      setCareerForm((prev) => ({
        ...prev,
        category: prev.category || value
      }));

      setSuccess("Career section added.");
    } catch (addError) {
      setError(addError?.message || "Unable to add section.");
    }
  };

  const onStartSectionEdit = (name) => {
    setEditingSectionName(name);
    setSectionDraft(name);
    setError("");
    setSuccess("");
  };

  const onCancelSectionEdit = () => {
    setEditingSectionName("");
    setSectionDraft("");
  };

  const onSaveSectionEdit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setRecentReassignment(null);

    const nextName = sectionDraft.trim();
    if (!editingSectionName || !nextName) {
      return;
    }

    try {
      await updateCareerSection(editingSectionName, nextName);
      await loadCareerData();

      setCareerForm((prev) => ({
        ...prev,
        category:
          prev.category && prev.category.toLowerCase() === editingSectionName.toLowerCase()
            ? nextName
            : prev.category
      }));

      setEditingSectionName("");
      setSectionDraft("");
      setSuccess("Career section updated.");
    } catch (updateError) {
      setError(updateError?.message || "Unable to update section.");
    }
  };

  const onDeleteSection = async (name) => {
    const confirmed = window.confirm(`Delete section "${name}"? Careers in this section will be reassigned.`);
    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setRecentReassignment(null);

    try {
      const result = await deleteCareerSection(name);
      await loadCareerData();

      if (editingSectionName && editingSectionName.toLowerCase() === name.toLowerCase()) {
        onCancelSectionEdit();
      }

      const moved = Number(result?.reassignedCount || 0);
      const movedTo = result?.reassignedTo;
      const movedFrom = result?.reassignedFrom || name;
      const movedIds = Array.isArray(result?.reassignedIds)
        ? result.reassignedIds.map((item) => String(item))
        : [];

      if (moved > 0 && movedIds.length > 0) {
        setRecentReassignment({
          from: movedFrom,
          to: movedTo,
          ids: movedIds
        });
      }

      setSuccess(
        moved > 0
          ? `Section deleted. ${moved} career profile(s) moved to ${movedTo}.`
          : "Section deleted."
      );
    } catch (deleteError) {
      setError(deleteError?.message || "Unable to delete section.");
    }
  };

  const onCareerChange = (event) => {
    const { name, value } = event.target;
    setCareerForm((prev) => ({ ...prev, [name]: value }));
  };

  const onAddCareer = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setRecentReassignment(null);

    try {
      const createdCareer = editingCareerId
        ? await updateCareerProfile(editingCareerId, careerForm)
        : await addCareerProfile(careerForm);
      setCareers((prev) => {
        const withoutDuplicate = prev.filter(
          (item) => String(item.id) !== String(createdCareer.id)
        );

        return [...withoutDuplicate, createdCareer].sort((a, b) => a.role.localeCompare(b.role));
      });

      setSections((prev) => {
        const merged = Array.from(new Set([...prev, createdCareer.category]));
        return merged.sort((a, b) => a.localeCompare(b));
      });

      setCareerForm({ role: "", category: createdCareer.category, skills: "", path: "" });
      setEditingCareerId("");
      setSuccess(
        editingCareerId
          ? "Career profile updated and synced to user portal."
          : "Career profile added and available to users."
      );
    } catch (addError) {
      setError(addError?.message || "Unable to save career profile.");
    }
  };

  const onEditCareer = (career) => {
    setError("");
    setSuccess("");
    setRecentReassignment(null);
    setEditingCareerId(String(career.id || ""));
    setCareerForm({
      role: career.role || "",
      category: career.category || "",
      skills: career.skills || "",
      path: career.path || ""
    });
  };

  const onCancelEdit = () => {
    setEditingCareerId("");
    setCareerForm({ role: "", category: "", skills: "", path: "" });
    setError("");
    setSuccess("");
    setRecentReassignment(null);
  };

  const onDeleteCareer = async (career) => {
    const confirmDelete = window.confirm(`Delete career profile "${career.role}"?`);
    if (!confirmDelete) {
      return;
    }

    setError("");
    setSuccess("");
    setRecentReassignment(null);

    try {
      const updated = await deleteCareerProfile(career.id);
      setCareers(Array.isArray(updated) ? updated : []);

      if (editingCareerId && String(career.id) === String(editingCareerId)) {
        onCancelEdit();
      }

      setSuccess("Career profile deleted.");
    } catch (deleteError) {
      setError(deleteError?.message || "Unable to delete career profile.");
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-identity">
          <div className="admin-avatar" aria-hidden="true">A</div>
          <div>
            <h1 className="admin-title">Careers</h1>
            <p className="admin-subtitle">Manage career sections and taxonomy for recommendations</p>
          </div>
        </div>

        <div className="topbar-actions">
          <ThemeToggle />
          <button onClick={onLogout} className="admin-logout-btn">Logout</button>
        </div>
      </header>

      <main className="admin-content">
        <nav className="admin-nav-pills" aria-label="Admin navigation">
          <Link to="/admin" className="admin-nav-pill">Overview</Link>
          <Link to="/admin/assessments" className="admin-nav-pill">Assessments</Link>
          <span className="admin-nav-pill admin-nav-pill-active">Careers</span>
          <Link to="/admin/analytics" className="admin-nav-pill">Student Results</Link>
          <Link to="/admin/scores" className="admin-nav-pill">View Scores</Link>
          <Link to="/admin/users" className="admin-nav-pill">Make Admin</Link>
        </nav>

        <section className="admin-section-head">
          <h2 className="admin-section-title">Career Sections</h2>
          <p className="admin-section-subtitle">Add and organize the categories used across career recommendations.</p>
        </section>

        <section className="admin-careers-card">
          <form onSubmit={onAddSection} className="admin-careers-form">
            <label htmlFor="section-name" className="admin-careers-label">Add New Section</label>
            <div className="admin-careers-input-row">
              <input
                id="section-name"
                className="admin-careers-input"
                value={newSection}
                onChange={(event) => setNewSection(event.target.value)}
                placeholder="Section name"
              />
              <button type="submit" className="admin-careers-add-btn">Add Section</button>
            </div>
          </form>

          <form onSubmit={onAddCareer} className="admin-careers-form admin-careers-form-career">
            <h3 className="admin-careers-list-title">{editingCareerId ? "Edit Career Profile" : "Add Career Profile"}</h3>

            <div className="admin-careers-grid">
              <input
                name="role"
                className="admin-careers-input"
                value={careerForm.role}
                onChange={onCareerChange}
                placeholder="Role title (e.g. Data Scientist)"
                required
              />

              <select
                name="category"
                className="admin-careers-input"
                value={careerForm.category}
                onChange={onCareerChange}
                required
              >
                <option value="">Select section</option>
                {sectionOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <input
              name="skills"
              className="admin-careers-input"
              value={careerForm.skills}
              onChange={onCareerChange}
              placeholder="Skills (comma separated)"
              required
            />

            <textarea
              name="path"
              className="admin-careers-input admin-careers-textarea"
              value={careerForm.path}
              onChange={onCareerChange}
              placeholder="Career path details"
              rows={3}
              required
            />

            <div className="admin-careers-form-actions">
              <button type="submit" className="admin-careers-add-btn">
                {editingCareerId ? "Update Career" : "Add Career"}
              </button>
              {editingCareerId ? (
                <button type="button" className="admin-careers-secondary-btn" onClick={onCancelEdit}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="admin-careers-list-wrap">
            <h3 className="admin-careers-list-title">Existing Sections</h3>
            <div className="admin-careers-sections-grid">
              {sections.map((item) => (
                <div key={item} className="admin-careers-section-row">
                  {editingSectionName && editingSectionName.toLowerCase() === item.toLowerCase() ? (
                    <form className="admin-careers-section-edit" onSubmit={onSaveSectionEdit}>
                      <input
                        className="admin-careers-input"
                        value={sectionDraft}
                        onChange={(event) => setSectionDraft(event.target.value)}
                        placeholder="Section name"
                        required
                      />
                      <button type="submit" className="admin-careers-secondary-btn">Save</button>
                      <button type="button" className="admin-careers-secondary-btn" onClick={onCancelSectionEdit}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="admin-careers-chip">{item}</span>
                      <div className="admin-careers-profile-actions">
                        <button
                          type="button"
                          className="admin-careers-secondary-btn"
                          onClick={() => onStartSectionEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-careers-danger-btn"
                          onClick={() => onDeleteSection(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="admin-careers-list-wrap">
            <h3 className="admin-careers-list-title">Career Profiles</h3>
            {loading ? <p className="admin-careers-meta">Loading careers...</p> : null}
            {!loading && careers.length === 0 ? (
              <p className="admin-careers-meta">No career profiles yet. Add one above.</p>
            ) : null}

            {!loading && careers.length > 0 ? (
              <div className="admin-careers-profiles-grid">
                {careers.map((item) => (
                  <article key={item.id || `${item.role}-${item.category}`} className="admin-careers-profile-card">
                    {recentReassignment?.ids?.includes(String(item.id)) ? (
                      <p className="admin-careers-reassigned-badge">
                        Reassigned from {recentReassignment.from} to {recentReassignment.to}
                      </p>
                    ) : null}
                    <p className="admin-careers-chip">{item.category}</p>
                    <h4 className="admin-careers-profile-title">{item.role}</h4>
                    <p className="admin-careers-meta"><strong>Skills:</strong> {item.skills}</p>
                    <p className="admin-careers-meta"><strong>Path:</strong> {item.path}</p>
                    <div className="admin-careers-profile-actions">
                      <button type="button" className="admin-careers-secondary-btn" onClick={() => onEditCareer(item)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-careers-danger-btn"
                        onClick={() => onDeleteCareer(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>

          {success ? <p className="admin-careers-feedback admin-careers-feedback-success">{success}</p> : null}
          {error ? <p className="admin-careers-feedback admin-careers-feedback-error">{error}</p> : null}

          <Link to="/admin" className="admin-careers-back-link">← Back to Dashboard</Link>
        </section>
      </main>
    </div>
  );
}
