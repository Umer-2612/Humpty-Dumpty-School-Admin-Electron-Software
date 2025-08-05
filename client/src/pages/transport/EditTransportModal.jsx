import React, { useState, useEffect } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Slide from "@mui/material/Slide";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import { teal } from "@mui/material/colors";
import Modal from "../../component/Modal";

const EditTransportModal = ({ open, onClose, transport, onSuccess, setError, setLoading }) => {
  const [formData, setFormData] = useState({
    driver_name: "",
    driver_route: "",
    driver_car: "",
    driver_car_number: "",
    driver_contact: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (transport) {
      setFormData({
        driver_name: transport.driver_name || "",
        driver_route: transport.driver_route || "",
        driver_car: transport.driver_car || "",
        driver_car_number: transport.driver_car_number || "",
        driver_contact: transport.driver_contact || "",
      });
    }
  }, [transport]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.driver_name.trim()) {
      newErrors.driver_name = "Driver name is required";
    }

    if (!formData.driver_route.trim()) {
      newErrors.driver_route = "Driver route is required";
    }

    if (!formData.driver_car.trim()) {
      newErrors.driver_car = "Vehicle type is required";
    }

    if (!formData.driver_car_number.trim()) {
      newErrors.driver_car_number = "Vehicle number is required";
    }

    if (!formData.driver_contact.trim()) {
      newErrors.driver_contact = "Contact number is required";
    } else if (!/^\d{10}$/.test(formData.driver_contact.replace(/\s/g, ""))) {
      newErrors.driver_contact = "Contact number must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLocalLoading(true);
    setLoading(true);
    setError("");

    try {
      const result = await window.electronAPI.updateTransport({
        id: transport.id,
        ...formData
      });
      
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || "Failed to update transport entry");
      }
    } catch (err) {
      setError("Failed to update transport entry");
      console.error("Error updating transport:", err);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setErrors({});
      onClose();
    }
  };

  if (!transport) return null;

  return (
    <Modal open={open} onClose={handleClose}>
      <Slide in={open} direction="down">
        <Paper
          elevation={6}
          sx={{
            borderRadius: 3,
            width: "100%",
            maxWidth: { xs: "98vw", sm: 420, md: 520 },
            minWidth: { xs: "90vw", sm: 340 },
            mx: "auto",
            bgcolor: "#f8fafc",
            maxHeight: { xs: "95vh", sm: "80vh", md: "70vh" },
            overflowY: "auto",
            p: { xs: 1, sm: 2 },
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
            <DirectionsBusIcon sx={{ color: "#fff", mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
              Edit Transport Entry
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2, bgcolor: "#f8fafc" }}>

            <form id="edit-transport-form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Driver Name"
                    name="driver_name"
                    value={formData.driver_name}
                    onChange={handleChange}
                    error={!!errors.driver_name}
                    helperText={errors.driver_name}
                    disabled={loading}
                    size="small"
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Driver Route"
                    name="driver_route"
                    value={formData.driver_route}
                    onChange={handleChange}
                    error={!!errors.driver_route}
                    helperText={errors.driver_route}
                    disabled={loading}
                    size="small"
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Type"
                    name="driver_car"
                    value={formData.driver_car}
                    onChange={handleChange}
                    error={!!errors.driver_car}
                    helperText={errors.driver_car}
                    disabled={loading}
                    size="small"
                    placeholder="e.g., Bus, Van, Car"
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Number"
                    name="driver_car_number"
                    value={formData.driver_car_number}
                    onChange={handleChange}
                    error={!!errors.driver_car_number}
                    helperText={errors.driver_car_number}
                    disabled={loading}
                    size="small"
                    placeholder="e.g., ABC-123"
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    name="driver_contact"
                    value={formData.driver_contact}
                    onChange={handleChange}
                    error={!!errors.driver_contact}
                    helperText={errors.driver_contact}
                    disabled={loading}
                    size="small"
                    placeholder="10-digit mobile number"
                    required
                  />
                </Grid>
              </Grid>

            </form>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              bgcolor: "#f8fafc",
              p: 2,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={loading}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              form="edit-transport-form"
              sx={{
                minWidth: 100,
                backgroundColor: teal[600],
                "&:hover": { backgroundColor: teal[700] },
              }}
            >
              {loading ? "Updating..." : "Update Transport"}
            </Button>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default EditTransportModal;
