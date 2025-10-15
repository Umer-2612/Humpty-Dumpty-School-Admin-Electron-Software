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
import Modal from "@/components/Modal";

const DeleteConfirmationModal = ({
  open,
  onClose,
  transport,
  onSuccess,
  setError,
  setLoading,
}) => {
  const [loading, setLocalLoading] = useState(false);

  const handleDeleteTransport = async () => {
    console.log("🔴 [FRONTEND] DeleteConfirmationModal: Starting delete operation");
    console.log("🔴 [FRONTEND] Transport to delete:", transport);
    console.log("🔴 [FRONTEND] Transport ID:", transport?.id);
    
    setLocalLoading(true);
    setLoading(true);
    setError("");
    
    try {
      console.log("🔴 [FRONTEND] Calling api.deleteTransport with ID:", transport.id);
      const res = await api.deleteTransport(transport.id);
      console.log("🔴 [FRONTEND] Response from electronAPI.deleteTransport:", res);
      
      if (res.success) {
        console.log("🔴 [FRONTEND] Delete successful, calling onSuccess()");
        onSuccess();
      } else {
        console.log("🔴 [FRONTEND] Delete failed with error:", res.error);
        setError(res.error || "Failed to delete transport entry");
      }
    } catch (err) {
      console.log("🔴 [FRONTEND] Delete operation threw error:", err);
      setError("Failed to delete transport entry");
    } finally {
      console.log("🔴 [FRONTEND] Delete operation completed, resetting loading states");
      setLocalLoading(false);
      setLoading(false);
    }
  };

  if (!transport) return null;

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
              Delete Transport Entry
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete this transport entry?
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {transport?.driver_name} - {transport?.driver_car_number}
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
              onClick={handleDeleteTransport}
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
