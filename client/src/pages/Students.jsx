import React, { useEffect, useState } from "react";
import Table from "../component/Table";
import { useBranch } from "../context/useBranch";

const Students = () => {
  const { selected: selectedBranch } = useBranch();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    roll_number: "",
    class_id: "",
    contact: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "roll_number", label: "Roll No." },
    { key: "class_name", label: "Class" },
    { key: "branch_name", label: "Branch" },
    { key: "contact", label: "Contact" },
    { key: "address", label: "Address" },
    { key: "created_at", label: "Created At" },
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchClasses(selectedBranch.id);
    } else {
      setClasses([]);
    }
  }, [selectedBranch]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getStudents();
      setStudents(data);
    } catch (err) {
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async (branch_id) => {
    try {
      const data = await window.electronAPI.getClassesByBranch(branch_id);
      setClasses(data);
    } catch (err) {
      setError("Failed to fetch classes");
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await window.electronAPI.addStudent(form);
      if (res.success) {
        setShowModal(false);
        setForm({
          name: "",
          roll_number: "",
          class_id: "",
          contact: "",
          address: "",
        });
        fetchStudents();
      } else {
        setError(res.error || "Failed to add student");
      }
    } catch (err) {
      setError("Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Students</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          + Add Student
        </button>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <Table columns={columns} data={students} />

      {/* Modal for Add Student */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add Student</h2>
            <form onSubmit={handleAddStudent}>
              <div className="mb-2">
                <label className="block mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full border px-2 py-1 rounded"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">Roll Number</label>
                <input
                  type="text"
                  name="roll_number"
                  value={form.roll_number}
                  onChange={handleInputChange}
                  className="w-full border px-2 py-1 rounded"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">Class</label>
                <select
                  name="class_id"
                  value={form.class_id}
                  onChange={handleInputChange}
                  className="w-full border px-2 py-1 rounded"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.branch_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="block mb-1">Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={form.contact}
                  onChange={handleInputChange}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleInputChange}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
