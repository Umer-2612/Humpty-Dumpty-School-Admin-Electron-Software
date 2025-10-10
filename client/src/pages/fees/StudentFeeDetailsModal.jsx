import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Modal from "../../component/Modal";

const TERM_LABELS = {
  term1: "Term 1",
  term2: "Term 2",
  books: "Books",
};

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;

const StudentFeeDetailsModal = ({ open, onClose, feesRecord }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  const studentName =
    feesRecord?.student?.name || feesRecord?.student_name || "-";
  const rollNumber =
    feesRecord?.student?.roll_number || feesRecord?.roll_number || "-";
  const className =
    feesRecord?.student?.class_name || feesRecord?.class_name || "-";

  useEffect(() => {
    if (!open) {
      setSummary(null);
      setError("");
      setLoading(false);
      return;
    }
    if (!feesRecord?.student_id || !window?.electronAPI?.getStudentTermSummary) {
      setSummary(null);
      setError(
        feesRecord?.student_id
          ? "Term summary lookup is unavailable."
          : "Missing student information for this record."
      );
      return;
    }

    let isMounted = true;
    const fetchSummary = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await window.electronAPI.getStudentTermSummary(
          feesRecord.student_id,
          feesRecord.academic_year_id || null
        );
        if (!isMounted) return;
        if (res?.success) {
          setSummary(res.summary || { terms: {} });
        } else {
          setSummary(null);
          setError(res?.error || "Unable to fetch term summary.");
        }
      } catch (e) {
        console.error("Failed to fetch student term summary:", e);
        if (isMounted) {
          setSummary(null);
          setError("Failed to fetch term summary.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, [open, feesRecord?.student_id, feesRecord?.academic_year_id]);

  const termRows = useMemo(() => {
    const terms = summary?.terms || {};
    return ["term1", "term2", "books"]
      .filter((key) => terms[key])
      .map((key) => ({
        key,
        label: TERM_LABELS[key] || key,
        ...terms[key],
      }));
  }, [summary]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={studentName !== "-" ? `${studentName} - Fees Details` : "Fees Details"}
      maxWidth="sm"
      actions={
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      }
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Student
          </Typography>
          <Typography variant="h6">{studentName}</Typography>
          <Typography variant="body2" color="text.secondary">
            Class: {className} | Roll No.: {rollNumber}
          </Typography>
        </Box>

        {loading && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 160,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && termRows.length === 0 && (
          <Alert severity="info">No term-wise data available for this student.</Alert>
        )}

        {!loading && !error && termRows.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Term</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Pending</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {termRows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell align="right">{currency(row.total)}</TableCell>
                  <TableCell align="right">{currency(row.paid)}</TableCell>
                  <TableCell align="right">{currency(row.pending)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Stack>
    </Modal>
  );
};

export default StudentFeeDetailsModal;
