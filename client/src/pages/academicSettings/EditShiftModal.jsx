import React, { useState, useEffect } from "react";
import Modal from "../../component/Modal";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import { teal } from "@mui/material/colors";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ShiftForm from "./ShiftForm";

const EditShiftModal = ({
  open,
  onClose,
  shift,
  onSuccess,
  setError,
  setLoading,
  loading,
}) => {
  const [form, setForm] = useState({ name: "", time: "" });

  useEffect(() => {
    if (shift) {
      setForm({
        name: shift.name || "",
        time: shift.time || "",
      });
    }
  }, [shift]);

  const handleEditShift = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await window.electronAPI.updateClassShift({
        id: shift.id,
        ...form,
      });
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Failed to update shift");
      }
    } catch (err) {
      setError("Failed to update shift", err);
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
            <AccessTimeIcon sx={{ color: "#fff", mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
              Edit Shift
            </Typography>
          </Box>
          <Divider />
          <Box
            component="form"
            id="edit-shift-form"
            onSubmit={handleEditShift}
            sx={{ p: 3, pt: 2 }}
          >
            <ShiftForm form={form} setForm={setForm} isEditing />
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
              form="edit-shift-form"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Shift"}
            </Button>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default EditShiftModal;
