import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Stack,
} from "@mui/material";

const AddAcademicYearModal = ({
  open,
  onClose,
  onSuccess,
  setError,
  setLoading,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.start_date || !formData.end_date) {
      setError("Please fill in all fields");
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      const result = await window.electronAPI.addAcademicYear(formData);
      if (result.success !== false) {
        setFormData({ name: "", start_date: "", end_date: "" });
        onSuccess();
      } else {
        setError(result.error || "Failed to add academic year");
      }
    } catch (err) {
      setError("Failed to add academic year");
      console.error("Error adding academic year:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", start_date: "", end_date: "" });
    onClose();
  };

  // Generate suggested name based on dates
  const generateSuggestedName = () => {
    if (formData.start_date && formData.end_date) {
      const startYear = new Date(formData.start_date).getFullYear();
      const endYear = new Date(formData.end_date).getFullYear();
      return `${startYear}-${endYear}`;
    }
    return "";
  };

  const handleAutoFillName = () => {
    const suggested = generateSuggestedName();
    if (suggested) {
      setFormData((prev) => ({ ...prev, name: suggested }));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Academic Year</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3}>
            <TextField
              name="name"
              label="Academic Year Name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              placeholder="e.g., 2025-2026"
            />

            {formData.start_date && formData.end_date && !formData.name && (
              <Box textAlign="center">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAutoFillName}
                >
                  Use Suggested Name: {generateSuggestedName()}
                </Button>
              </Box>
            )}

            <TextField
              name="start_date"
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              name="end_date"
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={handleChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />

            <Box className="bg-blue-50 p-3 rounded">
              <Typography variant="body2" className="text-blue-800">
                <strong>Tip:</strong> Academic years typically run from March to
                April (e.g., March 1, 2025 to April 30, 2026)
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Academic Year
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddAcademicYearModal;
