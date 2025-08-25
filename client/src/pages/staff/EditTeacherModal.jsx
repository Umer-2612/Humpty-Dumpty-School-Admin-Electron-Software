import React, { useState, useEffect } from "react";
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

const EditTeacherModal = ({
  open,
  onClose,
  teacher,
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
    if (teacher) {
      // Build rows directly from assignments to avoid losing mapping
      const unifiedMode = Array.isArray(classEntries) && classEntries.length > 0;
      const rows = Array.isArray(teacher.assignments)
        ? teacher.assignments
            .filter((a) => a && a.class_id && a.shift_id)
            .map((a) => {
              if (unifiedMode) {
                const entry = classEntries.find(
                  (e) => e.class_id === a.class_id && e.shift_id === a.shift_id
                );
                if (entry) {
                  return {
                    classEntryId: entry.id,
                    divisions: a.division ? [a.division] : [],
                  };
                }
              }
              return {
                classId: a.class_id,
                divisions: a.division ? [a.division] : [],
                shiftIds: [a.shift_id],
              };
            })
        : [];
      setForm({
        name: teacher.name || "",
        contact: teacher.contact || "",
        isOfficeStaff:
          !Array.isArray(teacher.assignments) || teacher.assignments.length === 0,
        assignmentsRows: rows,
      });
    }
  }, [teacher, classes, shifts, classEntries]);

  const handleEditTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Expand rows to assignments array (unified or legacy)
      const rows = form.assignmentsRows || [];
      let assignments = [];
      const unifiedMode = Array.isArray(classEntries) && classEntries.length > 0;
      if (form.isOfficeStaff) {
        assignments = [];
      } else if (unifiedMode) {
        for (const row of rows) {
          if (!row.classEntryId) continue;
          const entry = classEntries.find((e) => e.id === row.classEntryId);
          if (!entry) continue;
          const divisions = (row.divisions || []).length ? row.divisions : [""];
          for (const division of divisions) {
            assignments.push({ classId: entry.class_id, shiftId: entry.shift_id, division });
          }
        }
      } else {
        for (const row of rows) {
          if (!row.classId) continue;
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
      const res = await window.electronAPI.updateTeacher({
        id: teacher.id,
        name: form.name,
        contact: form.contact,
        assignments,
      });
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Failed to update teacher");
      }
    } catch (err) {
      setError(err?.message || "Failed to update teacher");
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
              Edit Teacher
            </Typography>
          </Box>
          <Divider />
          <Box
            component="form"
            id="edit-teacher-form"
            onSubmit={handleEditTeacher}
            sx={{ p: 3, pt: 2 }}
          >
            <TeacherForm
              form={form}
              setForm={setForm}
              classes={classes}
              shifts={shifts}
              classEntries={classEntries}
              isEditing
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
              form="edit-teacher-form"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Teacher"}
            </Button>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default EditTeacherModal;
