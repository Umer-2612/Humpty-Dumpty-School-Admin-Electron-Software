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

const EditBranchModal = ({
  open,
  onClose,
  branch,
  onSuccess,
  setError,
  setLoading,
}) => {
  const { updateBranch } = useBranch();
  const [name, setName] = useState(branch?.name || "");

  useEffect(() => {
    if (open) {
      setName(branch?.name || "");
    } else {
      setName("");
    }
  }, [open, branch]);

  const handleSubmit = async (event) => {
    event?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError?.("Branch name is required");
      return;
    }

    try {
      setLoading?.(true);
      const updated = await updateBranch({ id: branch?.id, name: trimmed });
      onSuccess?.(updated);
    } catch (error) {
      console.error("Failed to update branch:", error);
      setError?.(error?.message || "Failed to update branch");
    } finally {
      setLoading?.(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Branch</DialogTitle>
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
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditBranchModal;
