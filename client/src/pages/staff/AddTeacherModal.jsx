import React, { useEffect, useState } from "react";
import Modal from "../../component/Modal";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import { teal } from "@mui/material/colors";
import PersonIcon from "@mui/icons-material/Person";
import TeacherForm from "./TeacherForm";

const AddTeacherModal = ({
  open,
  onClose,
  classes,
  shifts,
  classEntries = [],
  onSuccess,
  setError,
  loading,
  setLoading,
}) => {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    isOfficeStaff: false,
    assignmentsRows: [],
  });

  useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
        assignmentsRows:
          prev.assignmentsRows && prev.assignmentsRows.length
            ? prev.assignmentsRows
            : (classEntries && classEntries.length
                ? [{ classEntryId: "", divisions: [] }]
                : [{ classId: "", divisions: [], shiftIds: [] }]
              ),
      }));
    }
  }, [open, classEntries]);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Build expanded assignments from rows (unified or legacy)
      const rows = form.assignmentsRows || [];
      let assignments = [];
      const unifiedMode = Array.isArray(classEntries) && classEntries.length > 0;
      if (form.isOfficeStaff) {
        // No assignments required for office staff
        assignments = [];
      } else if (unifiedMode) {
        const getEntryById = (id) => (classEntries || []).find((e) => e.id === id);
        for (const row of rows) {
          if (!row.classEntryId) continue;
          const entry = getEntryById(row.classEntryId);
          if (!entry) continue;
          const needsDivision = Number(entry?.division_count || 0) > 0;
          if (needsDivision && !(row.divisions || []).length)
            throw new Error("Please select division(s) for classes that have divisions");
          const divisions = (row.divisions || []).length ? row.divisions : [""];
          for (const division of divisions) {
            assignments.push({ classId: entry.class_id, shiftId: entry.shift_id, division });
          }
        }
      } else {
        const getClassById = (id) => (classes || []).find((c) => c.id === id);
        for (const row of rows) {
          if (!row.classId) continue;
          const cls = getClassById(row.classId);
          const needsDivision = Number(cls?.num_divisions || 0) > 0;
          if ((row.shiftIds || []).length === 0)
            throw new Error("Each assignment must have at least one shift");
          if (needsDivision && !(row.divisions || []).length)
            throw new Error("Please select division(s) for classes that have divisions");
          const divisions = (row.divisions || []).length ? row.divisions : [""];
          for (const division of divisions) {
            for (const shiftId of row.shiftIds || []) {
              assignments.push({ classId: row.classId, division, shiftId });
            }
          }
        }
      }
      if (!form.name?.trim()) throw new Error("Name is required");
      if (!form.isOfficeStaff && assignments.length === 0)
        throw new Error(
          unifiedMode
            ? "Please add at least one assignment (class & shift / division)"
            : "Please add at least one assignment (class/division/shift)"
        );
      const res = await window.electronAPI.addTeacher({
        name: form.name,
        contact: form.contact,
        assignments,
      });
      if (res.success) {
        setForm({ name: "", contact: "", isOfficeStaff: false, assignmentsRows: [] });
        onSuccess();
      } else {
        setError(res.error || "Failed to add teacher");
      }
    } catch (err) {
      setError(err?.message || "Failed to add teacher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Slide in={open} direction="down">
        <Paper
          elevation={6}
          sx={{
            borderRadius: 3,
            minWidth: 340,
            maxWidth: 520,
            mx: "auto",
            bgcolor: "#f8fafc",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Box
            sx={{
              bgcolor: teal[500],
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              p: 2,
              display: "flex",
              alignItems: "center",
            }}
          >
            <PersonIcon sx={{ color: "#fff", mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
              Add Teacher
            </Typography>
          </Box>
          <Divider />
          <Box
            component="form"
            id="add-teacher-form"
            onSubmit={handleAddTeacher}
            sx={{ p: 3, pt: 2 }}
          >
            <TeacherForm
              form={form}
              setForm={setForm}
              classes={classes}
              shifts={shifts}
              classEntries={classEntries}
            />
          </Box>
          <Divider />
          <Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "flex-end",
              bgcolor: "#f8fafc",
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
            }}
          >
            <Button onClick={onClose} disabled={loading} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-teacher-form"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Teacher"}
            </Button>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default AddTeacherModal;
