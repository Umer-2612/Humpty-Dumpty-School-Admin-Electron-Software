import React, { useState } from "react";
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
  onSuccess,
  setError,
  loading,
  setLoading,
}) => {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    classIds: [],
    shiftIds: [],
  });

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await window.electronAPI.addTeacher({
        name: form.name,
        contact: form.contact,
        classIds: form.classIds,
        shiftIds: form.shiftIds,
      });
      if (res.success) {
        setForm({ name: "", contact: "", classIds: [], shiftIds: [] });
        onSuccess();
      } else {
        setError(res.error || "Failed to add teacher");
      }
    } catch (err) {
      setError("Failed to add teacher", err);
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
