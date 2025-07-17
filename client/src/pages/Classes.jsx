import React, { useEffect, useState } from "react";
import TableWrapper from "../component/TableWrapper";
import { useBranch } from "../context/useBranch";
import Button from "@mui/material/Button";

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-all">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
        {children}
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

const Classes = () => {
  const { selected: selectedBranch } = useBranch();
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deletingClass, setDeletingClass] = useState(null);
  const [form, setForm] = useState({ name: "" });
  const [editForm, setEditForm] = useState({ name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // MUI DataGrid columns
  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "name", headerName: "Class Name", flex: 1 },
    { field: "branch_name", headerName: "Branch", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <div>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleEditClick(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchClasses(selectedBranch.id);
    } else {
      setClasses([]);
    }
  }, [selectedBranch]);

  const fetchClasses = async (branch_id) => {
    setLoading(true);
    setError("");
    try {
      const data = await window.electronAPI.getClassesByBranch(branch_id);
      setClasses(data);
    } catch (err) {
      setError("Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await window.electronAPI.addClass({
        name: form.name,
        branch_id: selectedBranch.id,
      });
      if (res.success) {
        setShowModal(false);
        setForm({ name: "" });
        setSuccess("Class added successfully!");
        fetchClasses(selectedBranch.id);
      } else {
        setError(res.error || "Failed to add class");
      }
    } catch (err) {
      setError("Failed to add class");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  const handleEditClick = (classData) => {
    setEditingClass(classData);
    setEditForm({ name: classData.name });
    setShowEditModal(true);
    setError("");
    setSuccess("");
  };

  const handleEditClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await window.electronAPI.updateClass({
        id: editingClass.id,
        name: editForm.name,
      });
      if (res.success) {
        setShowEditModal(false);
        setEditingClass(null);
        setEditForm({ name: "" });
        setSuccess("Class updated successfully!");
        fetchClasses(selectedBranch.id);
      } else {
        setError(res.error || "Failed to update class");
      }
    } catch (err) {
      setError("Failed to update class");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  const handleDeleteClick = (classData) => {
    setDeletingClass(classData);
    setShowDeleteModal(true);
    setError("");
    setSuccess("");
  };

  const handleDeleteClass = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await window.electronAPI.deleteClass(deletingClass.id);
      if (res.success) {
        setShowDeleteModal(false);
        setDeletingClass(null);
        setSuccess("Class deleted successfully!");
        fetchClasses(selectedBranch.id);
      } else {
        setError(res.error || "Failed to delete class");
      }
    } catch (err) {
      setError("Failed to delete class");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Classes</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
          onClick={() => setShowModal(true)}
          disabled={!selectedBranch?.id}
        >
          + Add Class
        </button>
      </div>
      {error && <div className="text-red-600 mb-2 font-medium">{error}</div>}
      {success && (
        <div className="text-green-600 mb-2 font-medium">{success}</div>
      )}
      <TableWrapper columns={columns} rows={classes} pageSize={10} />

      {/* Add Class Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <h2 className="text-xl font-semibold mb-4">Add Class</h2>
        <form onSubmit={handleAddClass} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Class Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Branch</label>
            <input
              type="text"
              value={selectedBranch?.name || ""}
              className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-500"
              disabled
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
              onClick={() => setShowModal(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Class"}
            </button>
          </div>
        </form>
        {error && <div className="text-red-600 mt-2 font-medium">{error}</div>}
        {success && (
          <div className="text-green-600 mt-2 font-medium">{success}</div>
        )}
      </Modal>

      {/* Edit Class Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)}>
        <h2 className="text-xl font-semibold mb-4">Edit Class</h2>
        <form onSubmit={handleEditClass} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Class Name</label>
            <input
              type="text"
              name="name"
              value={editForm.name}
              onChange={handleEditInputChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Branch</label>
            <input
              type="text"
              value={editingClass?.branch_name || ""}
              className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-500"
              disabled
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
              onClick={() => {
                setShowEditModal(false);
                setEditingClass(null);
                setEditForm({ name: "" });
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Class"}
            </button>
          </div>
        </form>
        {error && <div className="text-red-600 mt-2 font-medium">{error}</div>}
        {success && (
          <div className="text-green-600 mt-2 font-medium">{success}</div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="flex flex-col items-center">
          <svg
            className="w-12 h-12 text-red-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <h2 className="text-xl font-semibold mb-2 text-red-600">
            Delete Class
          </h2>
          <p className="mb-4 text-center text-gray-700">
            Are you sure you want to delete the class{" "}
            <span className="font-bold">"{deletingClass?.name}"</span>?<br />
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4 w-full">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingClass(null);
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 transition"
              onClick={handleDeleteClass}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
          {error && (
            <div className="text-red-600 mt-2 font-medium">{error}</div>
          )}
          {success && (
            <div className="text-green-600 mt-2 font-medium">{success}</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Classes;
