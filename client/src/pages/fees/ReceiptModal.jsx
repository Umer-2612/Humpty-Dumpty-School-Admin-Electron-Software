import React, { useEffect, useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Slide from "@mui/material/Slide";
import GlobalStyles from "@mui/material/GlobalStyles";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { teal } from "@mui/material/colors";
import Modal from "../../component/Modal";

const ReceiptModal = ({ open, onClose, feesRecord }) => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!open || !feesRecord?.receipt_number) return;
      setLoading(true);
      setError("");
      try {
        const result = await window.electronAPI.getFeesReceipt(
          feesRecord.receipt_number
        );
        if (result.success) {
          setReceipt(result.receipt);
        } else {
          setError(result.error || "Failed to load receipt");
        }
      } catch (err) {
        console.error("Error loading receipt:", err);
        setError("Failed to load receipt");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [open, feesRecord?.receipt_number]);

  const handlePrint = () => {
    // Use print-specific CSS to print only the receipt area
    window.print();
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="md">
      {/* Print styles to ensure only the receipt content is printed */}
      <GlobalStyles
        styles={`
          @media print {
            body * { visibility: hidden; }
            #receipt-print-area, #receipt-print-area * { visibility: visible; }
            #receipt-print-area {
              position: absolute; left: 0; top: 0; width: 100%;
              box-shadow: none !important; -webkit-box-shadow: none !important;
            }
            .print-hide { display: none !important; }
          }
          @page { size: A5 portrait; margin: 12mm; }
        `}
      />
      <Slide direction="down" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={6}
          sx={{
            borderRadius: 3,
            minWidth: 340,
            maxWidth: 900,
            mx: "auto",
            bgcolor: "#fff",
            maxHeight: "85vh",
            overflowY: "auto",
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <ReceiptLongIcon sx={{ mr: 2, color: teal[700], fontSize: 28 }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: teal[800] }}
              >
                Fees Receipt
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {loading && <Typography>Loading receipt...</Typography>}
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            {receipt && (
              <Box id="receipt-print-area" sx={{ p: { xs: 0, md: 1 } }}>
                {/* Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {receipt.branch_name || "Humpty Dumpty School"}
                    </Typography>
                    <Typography variant="body2">Fees Receipt</Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2">
                      <strong>Receipt No:</strong>{" "}
                      {receipt.id ?? receipt.receipt_number}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {receipt.payment_date}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Student/Payment Details */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="body2">
                      <strong>Student:</strong> {receipt.student_name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Roll No:</strong> {receipt.roll_number}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Class:</strong> {receipt.class_name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2">
                      <strong>Payee:</strong> {receipt.payee_name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Payment Type:</strong> {receipt.payment_type}
                    </Typography>
                    {receipt.payment_type === "cheque" && (
                      <>
                        <Typography variant="body2">
                          <strong>Cheque No:</strong> {receipt.cheque_number}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Bank:</strong> {receipt.bank_name}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Amount */}
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Amount Paid
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    ₹{receipt.amount}
                  </Typography>
                </Box>

                {/* Optional meta */}
                {(receipt.academic_year ||
                  receipt.month_year ||
                  receipt.notes) && (
                  <Box sx={{ mt: 2 }}>
                    {receipt.academic_year && (
                      <Typography variant="body2">
                        <strong>Academic Year:</strong> {receipt.academic_year}
                      </Typography>
                    )}
                    {receipt.month_year && (
                      <Typography variant="body2">
                        <strong>Month/Year:</strong> {receipt.month_year}
                      </Typography>
                    )}
                    {receipt.notes && (
                      <Typography variant="body2">
                        <strong>Notes:</strong> {receipt.notes}
                      </Typography>
                    )}
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* <Box
                  sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}
                >
                  <Typography variant="body2">Authorized Signature</Typography>
                </Box> */}
              </Box>
            )}

            <Box
              className="print-hide"
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 2,
              }}
            >
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                disabled={!receipt}
              >
                Print
              </Button>
            </Box>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default ReceiptModal;
