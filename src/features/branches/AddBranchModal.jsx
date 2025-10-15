import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import { useBranch } from "@/context/useBranch";

const AddBranchModal = ({
  open,
  onClose,
  onSuccess,
  setError,
  setLoading,
}) => {
  const { addBranch, selected: activeBranch } = useBranch();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
    }
  }, [open]);

  const handleSubmit = async (event) => {
    event?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError?.("Branch name is required");
      return;
    }

    try {
      setLoading?.(true);
      const branch = await addBranch({
        name: trimmed,
        sourceBranchId: activeBranch?.id || null,
      });
      onSuccess?.(branch);
      setName("");
    } catch (error) {
      console.error("Failed to add branch:", error);
      setError?.(error?.message || "Failed to add branch");
    } finally {
      setLoading?.(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Branch</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Branch Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              fullWidth
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Add Branch
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddBranchModal;
