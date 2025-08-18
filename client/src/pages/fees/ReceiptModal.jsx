import React, { useMemo, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import PrintIcon from "@mui/icons-material/Print";
import Divider from "@mui/material/Divider";
import Slide from "@mui/material/Slide";
import GlobalStyles from "@mui/material/GlobalStyles";
import Grid from "@mui/material/Grid";
import Modal from "../../component/Modal";
import { useBranch } from "../../context/useBranch";

// Helpers for booklet-like underlined fields
const Label = ({ children }) => (
  <Typography sx={{ fontSize: 14, fontWeight: 400, mr: 0.5 }}>
    {children}
  </Typography>
);

const Underline = ({ children, width = 200, align = "left" }) => (
  <Box
    sx={{
      borderBottom: "0 none",
      minWidth: width,
      height: 22,
      display: "flex",
      alignItems: "flex-end",
      px: 0.25,
      justifyContent: align === "right" ? "flex-end" : "flex-start",
    }}
  >
    <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{children}</Typography>
  </Box>
);

const ReceiptModal = ({ open, onClose, feesRecord }) => {
  console.log({ feesRecord });
  const r = useMemo(() => feesRecord || {}, [feesRecord]);
  const { selected: selectedBranch } = useBranch?.() || {};
  const [shiftName, setShiftName] = useState("");

  // Resolve shift display: prefer provided name; else look up by shift_id via IPC
  useEffect(() => {
    const resolveShift = async () => {
      const provided = r.shift || r.shift_name;
      if (provided) {
        setShiftName(provided);
        return;
      }

      console.log({ r });
      const shId =
        r.shift_id ??
        r.shiftId ??
        r.shiftid ??
        (r.student && r.student.shift_id) ??
        r.student_shift_id;
      // If we don't have a shift id yet, try to fetch student by id
      let effectiveShiftId = shId;
      if (
        !effectiveShiftId &&
        r.student_id &&
        window?.electronAPI?.getStudentById
      ) {
        try {
          const student = await window.electronAPI.getStudentById(r.student_id);
          effectiveShiftId = student?.shift_id || null;
        } catch (e) {
          console.error("Failed to load student for shift:", e);
        }
      }

      if (effectiveShiftId && window?.electronAPI?.getClassShifts) {
        try {
          const list = await window.electronAPI.getClassShifts();
          const found = Array.isArray(list)
            ? list.find((s) => String(s.id) === String(effectiveShiftId))
            : null;
          setShiftName(found?.name || found?.shift || found?.shift_name || "");
        } catch (e) {
          console.error("Failed to load shifts for receipt:", e);
          setShiftName("");
        }
      } else {
        setShiftName("");
      }
    };
    if (open) resolveShift();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    r.shift,
    r.shift_name,
    r.shift_id,
    r.shiftId,
    r.shiftid,
    r.student_id,
  ]);

  return (
    <Modal open={open} onClose={onClose} maxWidth="md">
      <GlobalStyles
        styles={`
          @media print {
            body * { visibility: hidden; }
            #receipt-print-area, #receipt-print-area * { visibility: visible; }
            #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; height: auto; box-shadow: none !important; }
            .print-hide { display: none !important; }
          }
          @page { size: A5; margin: 6mm; }
        `}
      />

      <Slide direction="down" in={open} mountOnEnter unmountOnExit>
        <Box sx={{ p: 2 }}>
          {/* Receipt Canvas */}
          <Box
            id="receipt-print-area"
            sx={{
              width: 720,
              height: "auto",
              mx: "auto",
              bgcolor: "#FFE873",
              p: 1.5,
              pt: 1,
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              border: "1px solid #222",
            }}
          >
            {/* Header */}
            <Grid
              container
              alignItems="center"
              sx={{ mb: 1, justifyContent: "space-between" }}
            >
              <Grid item xs={2}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    border: "1px solid #222",
                    bgcolor: "#f8f8f8",
                  }}
                />
              </Grid>
              <Grid item xs={8}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 20,
                      fontWeight: 800,
                      lineHeight: 1,
                      textAlign: "center",
                    }}
                  >
                    {r.branch_name ||
                      selectedBranch?.name ||
                      "Humpty Dumpty Kindergarten"}
                  </Typography>
                  <Typography sx={{ fontSize: 12, textAlign: "center" }}>
                    31, Ghanshyam Soc., Opp. Rushabh Apt., Adajan Patiya,
                    Rander, Surat.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={2}>
                <Box
                  sx={{
                    fontSize: 12,
                    textAlign: "right",
                    lineHeight: 1.15,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <div>Mob.: 99099 11966</div>
                  <div>99093 11966</div>
                  <div>91067 53875</div>
                </Box>
              </Grid>
            </Grid>

            <Divider
              sx={{ borderColor: "#222", borderBottomWidth: 2, mb: 0.5 }}
            />

            {/* Row 1: Name full width */}
            <Grid
              container
              columnSpacing={1}
              sx={{
                alignItems: "flex-end",
                borderBottom: "2px solid #222",
                minHeight: 28,
                pb: 0.25,
                mb: 0.5,
              }}
            >
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                  <Label>Name :</Label>
                  <Underline width={520}>{r.student_name || ""}</Underline>
                </Box>
              </Grid>
            </Grid>

            {/* Row 2: Class / Shift / Rcpt No */}
            <Grid
              container
              columnSpacing={2}
              sx={{
                alignItems: "flex-end",
                borderBottom: "2px solid #222",
                minHeight: 32,
                pb: 0.5,
                mb: 0.5,
              }}
            >
              <Grid item xs={4}>
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                  <Label>Class :</Label>
                  <Underline width={140}>{r.class_name || ""}</Underline>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                  <Label>Shift :</Label>
                  <Underline width={120}>{shiftName}</Underline>
                </Box>
              </Grid>
              <Grid item xs={4} sx={{ p: 0 }}>
                <Grid container alignItems="flex-end" columnSpacing={0}>
                  <Grid item xs={6}>
                    <Box sx={{ width: "100%", textAlign: "right" }}>
                      <Label>Rcpt. No. :</Label>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Underline width="100%" align="left">
                      {r.receipt_number || ""}
                    </Underline>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Row 3: Cash / Date */}
            <Grid
              container
              columnSpacing={2}
              sx={{
                alignItems: "flex-end",
                borderBottom: "2px solid #222",
                minHeight: 32,
                pb: 0.5,
                mb: 0.5,
              }}
            >
              <Grid item xs={8}>
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5 }}>
                  <Label>Cash ₹ :</Label>
                  <Underline width={120}>{r.amount || ""}</Underline>
                </Box>
              </Grid>
              <Grid item xs={4} sx={{ p: 0 }}>
                <Grid container alignItems="flex-end" columnSpacing={0}>
                  <Grid item xs={6}>
                    <Box sx={{ width: "100%", textAlign: "right" }}>
                      <Label>Date :</Label>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Underline width="100%" align="left">
                      {r.payment_date || ""}
                    </Underline>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Row 4: Cheque No / Bank / Sign */}
            <Grid
              container
              columnSpacing={2}
              sx={{
                alignItems: "flex-end",
                borderBottom: "2px solid #222",
                minHeight: 28,
                pb: 0.5,
                mb: 0.5,
              }}
            >
              <Grid item xs={4}>
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5 }}>
                  <Label>Cheque No. :</Label>
                  <Underline width={120}>{r.cheque_number || ""}</Underline>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5 }}>
                  <Label>Bank :</Label>
                  <Underline width={120}>{r.bank_name || ""}</Underline>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 0.5,
                    justifyContent: "flex-end",
                  }}
                >
                  <Label>Sign. :</Label>
                  <Underline width={120} align="right"></Underline>
                </Box>
              </Grid>
            </Grid>

            {/* Row 5: Cheque / Months */}
            <Grid
              container
              columnSpacing={2}
              sx={{
                alignItems: "flex-end",
                borderBottom: "2px solid #222",
                minHeight: 32,
                pb: 0.5,
                mb: 0.5,
              }}
            >
              <Grid item xs={8}>
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                  <Label>Cheque ₹ :</Label>
                  <Underline width={120}>
                    {String((r.payment_type || "").toLowerCase()).includes(
                      "bank"
                    ) ||
                    String((r.payment_type || "").toLowerCase()) === "cheque"
                      ? r.amount || ""
                      : ""}
                  </Underline>
                </Box>
              </Grid>
              <Grid item xs={4} sx={{ p: 0 }}>
                <Grid container alignItems="flex-end" columnSpacing={0}>
                  <Grid item xs={6}>
                    <Box sx={{ width: "100%", textAlign: "right" }}>
                      <Label>Months :</Label>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Underline width="100%">{r.months || "-"}</Underline>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Footer note line if needed */}
          </Box>
          {/* Footer controls (consistent with AddTeacherModal) */}
          <Divider className="print-hide" />
          <Box
            className="print-hide"
            sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}
          >
            <Button onClick={onClose} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </Box>
        </Box>
      </Slide>
    </Modal>
  );
};

export default ReceiptModal;
