import React from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Slide from "@mui/material/Slide";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { teal } from "@mui/material/colors";
import Modal from "../../component/Modal";

const DeleteConfirmationModal = ({ open, onClose, onSuccess, setError, setLoading, feesRecord }) => {
  const handleDelete = async () => {
    if (!feesRecord?.id) return;
    setLoading(true);
    try {
      const result = await window.electronAPI.deleteFees(feesRecord.id);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || "Failed to delete fees record");
      }
    } catch (err) {
      console.error("Error deleting fees:", err);
      setError("Failed to delete fees record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Slide direction="down" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={24}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: "80%", md: "500px" },
            maxHeight: "90vh",
            overflow: "auto",
            p: 0,
            borderRadius: 2,
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <WarningAmberIcon sx={{ mr: 2, color: teal[700], fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: teal[800] }}>
                Confirm Deletion
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography sx={{ mb: 2 }}>
              Are you sure you want to delete this fees record?
            </Typography>
            {feesRecord && (
              <Box sx={{ mb: 2, p: 2, bgcolor: "#f9fafb", borderRadius: 1, border: "1px solid #e5e7eb" }}>
                <Typography variant="body2"><strong>Receipt No:</strong> {feesRecord.receipt_number}</Typography>
                <Typography variant="body2"><strong>Student:</strong> {feesRecord.student_name} ({feesRecord.roll_number})</Typography>
                <Typography variant="body2"><strong>Class:</strong> {feesRecord.class_name}</Typography>
                <Typography variant="body2"><strong>Amount:</strong> ₹{feesRecord.amount}</Typography>
                <Typography variant="body2"><strong>Payment Date:</strong> {feesRecord.payment_date}</Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button variant="outlined" onClick={onClose}>Cancel</Button>
              <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
            </Box>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default DeleteConfirmationModal;
