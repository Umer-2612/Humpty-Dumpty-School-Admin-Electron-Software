import React, { useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import { teal } from "@mui/material/colors";
import Modal from "../../component/Modal";

const DeleteConfirmationModal = ({
  open,
  onClose,
  student,
  onSuccess,
  setError,
  setLoading,
}) => {
  const [loading, setLocalLoading] = useState(false);
  const handleDeleteStudent = async () => {
    console.log("🔴 [FRONTEND] DeleteConfirmationModal: Starting delete operation");
    console.log("🔴 [FRONTEND] Student to delete:", student);
    console.log("🔴 [FRONTEND] Student ID:", student?.id);
    
    setLocalLoading(true);
    setLoading(true);
    setError("");
    
    try {
      console.log("🔴 [FRONTEND] Calling window.electronAPI.deleteStudent with ID:", student.id);
      const res = await window.electronAPI.deleteStudent(student.id);
      console.log("🔴 [FRONTEND] Response from electronAPI.deleteStudent:", res);
      
      if (res.success) {
        console.log("🔴 [FRONTEND] Delete successful, calling onSuccess()");
        onSuccess();
      } else {
        console.log("🔴 [FRONTEND] Delete failed with error:", res.error);
        setError(res.error || "Failed to delete student");
      }
    } catch (err) {
      console.log("🔴 [FRONTEND] Delete operation threw error:", err);
      setError("Failed to delete student", err);
    } finally {
      console.log("🔴 [FRONTEND] Delete operation completed, resetting loading states");
      setLocalLoading(false);
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
            maxWidth: 420,
            mx: "auto",
            bgcolor: "#f8fafc",
          }}
        >
          <Box
            sx={{
              bgcolor: teal[500],
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              p: 2,
            }}
          >
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
              Delete Student
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete this student?
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {student?.name}
            </Typography>
          </Box>
          <Divider />
          <Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "flex-end",
              bgcolor: "#f8fafc",
            }}
          >
            <Button onClick={onClose} disabled={loading} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteStudent}
              variant="contained"
              color="error"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default DeleteConfirmationModal;
