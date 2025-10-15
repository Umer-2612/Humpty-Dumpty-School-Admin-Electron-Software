'use client';
import api from "@/lib/api";

import React, { useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import { teal } from "@mui/material/colors";
import PersonIcon from "@mui/icons-material/Person";
import Modal from "@/components/Modal";

const DeleteStaffModal = ({
  open,
  onClose,
  staff,
  onSuccess,
  setError,
  setLoading,
}) => {
  const [loading, setLocalLoading] = useState(false);
  
  const handleDeleteStaff = async () => {
    if (!staff?.id) return;

    setLocalLoading(true);
    setLoading(true);
    setError("");
    try {
      const res = await api.deleteStaff(staff.id);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Failed to delete staff");
      }
    } catch (err) {
      setError("Failed to delete staff: " + err.message);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  if (!staff) return null;

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
              display: "flex",
              alignItems: "center",
            }}
          >
            <PersonIcon sx={{ color: "#fff", mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
              Delete Staff
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete this staff member?
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {staff?.name}
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
              onClick={handleDeleteStaff}
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

export default DeleteStaffModal;
