import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useBranch } from "@/context/useBranch";

const DeleteBranchModal = ({
  open,
  onClose,
  branch,
  onSuccess,
  setError,
  setLoading,
}) => {
  const { deleteBranch } = useBranch();

  const handleDelete = async () => {
    if (!branch?.id) {
      setError?.("Branch information missing");
      return;
    }
    try {
      setLoading?.(true);
      await deleteBranch(branch.id);
      onSuccess?.(branch);
    } catch (error) {
      console.error("Failed to delete branch:", error);
      setError?.(error?.message || "Failed to delete branch");
    } finally {
      setLoading?.(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle className="flex items-center gap-2">
        <WarningAmberIcon color="warning" />
        Delete Branch
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography>
            Are you sure you want to delete the branch{" "}
            <strong>{branch?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action is only allowed when no classes or fee records exist for
            the branch.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" onClick={handleDelete}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteBranchModal;
