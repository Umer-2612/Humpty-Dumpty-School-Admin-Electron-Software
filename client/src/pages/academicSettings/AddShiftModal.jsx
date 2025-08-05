import React, { useState } from "react";
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

const AddShiftModal = ({
  open,
  onClose,
  onSuccess,
  setError,
  setLoading,
  loading,
}) => {
  const [form, setForm] = useState({ name: "", time: "" });

  const handleAddShift = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      console.log({ form });
      const res = await window.electronAPI.addClassShift(form);
      if (res.success) {
        setForm({ name: "", time: "" });
        onSuccess();
      } else {
        setError(res.error || "Failed to add shift");
      }
    } catch (err) {
      setError("Failed to add shift", err);
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
              Add Shift
            </Typography>
          </Box>
          <Divider />
          <Box
            component="form"
            id="add-shift-form"
            onSubmit={handleAddShift}
            sx={{ p: 3, pt: 2 }}
          >
            <ShiftForm form={form} setForm={setForm} />
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
              form="add-shift-form"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Shift"}
            </Button>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default AddShiftModal;
