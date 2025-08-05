import React from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import { teal } from "@mui/material/colors";
import Modal from "../../component/Modal";

const DeleteShiftModal = ({
  open,
  onClose,
  shift,
  onSuccess,
  setError,
  setLoading,
  loading,
}) => {
  const handleDeleteShift = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await window.electronAPI.deleteClassShift(shift.id);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Failed to delete shift");
      }
    } catch (err) {
      setError("Failed to delete shift", err);
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
              Delete Shift
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete this shift?
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {shift?.name}
            </Typography>
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
              onClick={handleDeleteShift}
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

export default DeleteShiftModal;
