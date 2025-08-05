import React, { useState, useEffect } from "react";
import Modal from "../../component/Modal";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import { teal } from "@mui/material/colors";
import SchoolIcon from "@mui/icons-material/School";
import ClassForm from "./ClassForm";

const EditClassModal = ({
  open,
  onClose,
  cls,
  onSuccess,
  setError,
  setLoading,
  loading,
}) => {
  const [form, setForm] = useState({
    name: "",
    total_fees: "",
  });

  useEffect(() => {
    if (cls) {
      setForm({
        name: cls.name || "",
        total_fees: cls.total_fees || "",
      });
    }
  }, [cls]);

  const handleEditClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await window.electronAPI.updateClass({
        id: cls.id,
        name: form.name,
        total_fees: Number(form.total_fees),
      });
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Failed to update class");
      }
    } catch (err) {
      setError("Failed to update class", err);
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
            <SchoolIcon sx={{ color: "#fff", mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
              Edit Class
            </Typography>
          </Box>
          <Divider />
          <Box
            component="form"
            id="edit-class-form"
            onSubmit={handleEditClass}
            sx={{ p: 3, pt: 2 }}
          >
            <ClassForm form={form} setForm={setForm} isEditing />
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
              form="edit-class-form"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Class"}
            </Button>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default EditClassModal;
