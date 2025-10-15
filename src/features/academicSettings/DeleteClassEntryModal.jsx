'use client';
import api from "@/lib/api";

import React from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Slide from "@mui/material/Slide";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { teal } from "@mui/material/colors";
import SchoolIcon from "@mui/icons-material/School";
import Modal from "@/components/Modal";

const DeleteClassEntryModal = ({ open, onClose, entry, onDeleted, loading: parentLoading = false, setError, setLoading: setParentLoading }) => {
  const [loading, setLoading] = React.useState(false);
  const busy = loading || parentLoading;

  const handleDelete = async () => {
    if (!entry?.id) return;
    try {
      setLoading(true);
      setParentLoading && setParentLoading(true);
      const res = await api.deleteClassEntry(entry.id);
      if (res?.success === false) throw new Error(res.error || "Failed to delete");
      onDeleted && onDeleted(entry.id);
    } catch (err) {
      console.error("[DeleteClassEntryModal] delete failed", err);
      setError && setError(err.message || "Failed to delete class");
    } finally {
      setLoading(false);
      setParentLoading && setParentLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Slide in={open} direction="down">
        <Paper
          elevation={6}
          sx={{
            borderRadius: 3,
            minWidth: 320,
            maxWidth: 480,
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
            <SchoolIcon sx={{ color: "#fff", mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
              Delete Class
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Are you sure you want to delete this class entry?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {entry ? `${entry.class_name} — ${entry.shift_name}` : ""}
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
            <Button onClick={onClose} disabled={busy} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button onClick={handleDelete} variant="contained" color="error" disabled={busy}>
              {busy ? "Deleting..." : "Delete"}
            </Button>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default DeleteClassEntryModal;
