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
import logo from "../../assets/humpty_dumpty_logo.jpeg";

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
    <Typography
      sx={{
        fontSize: 16,
        fontWeight: 700,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {children}
    </Typography>
  </Box>
);

// Helper to normalize legacy receipt numbers e.g., c1 -> C-1, b2 -> B-2
const normalizeReceipt = (raw) => {
  if (!raw) return "";
  const s = String(raw);
  if (/^[cb]\d+$/i.test(s)) return `${s[0].toUpperCase()}-${s.slice(1)}`;
  return s;
};

// Convert a variety of inputs into a Month name, e.g., '2025-08' -> 'August'
const toMonthName = (val) => {
  if (!val) return null;
  const s = String(val).trim();
  // Try ISO like YYYY-MM or YYYY/MM
  let m = s.match(/^(\d{4})[-.](\d{1,2})$/);
  if (m) {
    const monthIdx = Math.max(0, Math.min(11, parseInt(m[2], 10) - 1));
    return new Date(2000, monthIdx, 1).toLocaleString(undefined, {
      month: "long",
    });
  }
  // Try MM-YYYY or MM/YYYY
  m = s.match(/^(\d{1,2})[-.](\d{4})$/);
  if (m) {
    const monthIdx = Math.max(0, Math.min(11, parseInt(m[1], 10) - 1));
    return new Date(2000, monthIdx, 1).toLocaleString(undefined, {
      month: "long",
    });
  }
  // If already contains a month name, return capitalized month token
  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const lower = s.toLowerCase();
  const found = monthNames.find((mn) => lower.includes(mn));
  if (found) return found.charAt(0).toUpperCase() + found.slice(1);
  return null;
};

const displayUptoMonth = (monthYear, fallback) => {
  const name = toMonthName(monthYear) || toMonthName(fallback);
  const raw = monthYear || fallback;
  return name ? `Upto ${name}` : raw ? `Upto ${raw}` : "-";
};

// Layout constants
const LABEL_TEXT_W = 72; // px, default label text width
const COL_W = 8; // px, default colon width
const LABEL_PAD = 2; // px, right padding after label text
const VALUE_PAD = 6; // px, left padding before value to keep even spacing after colon
// Tighter sizing for middle column (col 2) so its label->colon gap is smaller
const MID_LABEL_TEXT_W = 60; // px
const MID_COL_W = 6; // px
const MID_VALUE_PAD = 4; // px
// Fixed column widths so each field group starts at the exact same x-position across rows
const COL1_W = 260; // px (first column width)
const COL2_W = 220; // px (second column width)
const COL3_W = 220; // px (third column width)

// Reusable left-aligned label with separate colon and flexible value space
const Field = ({
  label,
  children,
  labelTextW = LABEL_TEXT_W,
  colonW = COL_W,
  valuePad = VALUE_PAD,
}) => (
  <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
    <Box sx={{ width: labelTextW, pr: `${LABEL_PAD}px` }}>
      <Label>{label}</Label>
    </Box>
    <Box sx={{ width: colonW, display: "flex", justifyContent: "center" }}>
      <Label>:</Label>
    </Box>
    <Box sx={{ flex: 1, pl: `${valuePad}px` }}>{children}</Box>
  </Box>
);

const ReceiptModal = ({ open, onClose, feesRecord }) => {
  console.log({ feesRecord });
  const r = useMemo(() => feesRecord || {}, [feesRecord]);
  const { selected: selectedBranch } = useBranch?.() || {};
  const [shiftName, setShiftName] = useState("");

  // Resolve shift display: prefer provided name; else look up by class_id via IPC
  useEffect(() => {
    const resolveShift = async () => {
      const provided = r.shift || r.shift_name;
      if (provided) {
        setShiftName(provided);
        return;
      }

      console.log({ r });
      
      // Try to get shift name from class information
      const classId = r.class_id || (r.student && r.student.class_id);
      
      if (classId && window?.electronAPI?.listClassesByBranch) {
        try {
          // Get the branch ID first
          const branchId = r.branch_id || (r.student && r.student.branch_id);
          if (branchId) {
            const classes = await window.electronAPI.listClassesByBranch(branchId);
            const foundClass = Array.isArray(classes)
              ? classes.find((c) => String(c.class_id || c.id) === String(classId))
              : null;
            setShiftName(foundClass?.shift_name || "");
          } else {
            setShiftName("");
          }
        } catch (e) {
          console.error("Failed to load class info for shift:", e);
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
    r.class_id,
    r.branch_id,
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
            #receipt-print-area .receipt { width: 700px; margin: 0 auto 8mm; page-break-inside: avoid; }
            .print-hide { display: none !important; }
          }
          @media screen {
            #receipt-print-area .receipt.copy-2 { display: none; }
          }
          @page { size: A4; margin: 10mm; }
        `}
      />

      <Slide direction="down" in={open} mountOnEnter unmountOnExit>
        <Box sx={{ p: 2 }}>
          {/* Receipt Canvas (two copies for A4 print) */}
          <Box id="receipt-print-area">
            {/* Copy 1 */}
            <Box
              className="receipt"
              sx={{
                width: 700,
                height: "auto",
                mx: "auto",
                bgcolor: "#FFF",
                p: 1.5,
                pt: 1,
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                border: "1px solid #222",
                mb: 1.5,
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={logo}
                    alt="Humpty Dumpty Logo"
                    sx={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </Box>
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

            {/* Row 1: Name full width with aligned label */}
            <Grid
              container
              columnSpacing={1}
              sx={{
                alignItems: "center",
                borderBottom: "2px solid #222",
                minHeight: 28,
                pb: 0.25,
                mb: 0.5,
              }}
            >
              <Grid item xs={12}>
                <Field label="Name">
                  <Underline width="100%">{r.student_name || ""}</Underline>
                </Field>
              </Grid>
            </Grid>

            {/* Row 2: Class / Shift / Rcpt No */}
            <Grid
              container
              columnSpacing={0}
              sx={{
                alignItems: "center",
                borderBottom: "2px solid #222",
                minHeight: 32,
                pb: 0.5,
                mb: 0.5,
                flexWrap: "nowrap",
              }}
            >
              <Grid item sx={{ width: COL1_W, flex: "0 0 auto", pr: 1 }}>
                <Box sx={{ width: "100%" }}>
                  <Field label="Class">
                    <Underline width="100%">{r.class_name || ""}</Underline>
                  </Field>
                </Box>
              </Grid>
              <Grid item sx={{ width: COL2_W, flex: "0 0 auto", pr: 1 }}>
                <Box sx={{ width: "100%" }}>
                  <Field
                    label="Shift"
                    labelTextW={MID_LABEL_TEXT_W}
                    colonW={MID_COL_W}
                    valuePad={MID_VALUE_PAD}
                  >
                    <Underline width="100%">{shiftName}</Underline>
                  </Field>
                </Box>
              </Grid>
              <Grid item sx={{ width: COL3_W, flex: "0 0 auto" }}>
                <Box sx={{ width: "100%" }}>
                  <Field label="Rcpt. No.">
                    <Underline width="100%" align="left">
                      {normalizeReceipt(r.receipt_number || "")}
                    </Underline>
                  </Field>
                </Box>
              </Grid>
            </Grid>

            {/* Row 3: Cash / Date / Spacer */}
            <Grid
              container
              columnSpacing={0}
              sx={{
                alignItems: "center",
                borderBottom: "2px solid #222",
                minHeight: 32,
                pb: 0.5,
                mb: 0.5,
                flexWrap: "nowrap",
              }}
            >
              <Grid item sx={{ width: COL1_W, flex: "0 0 auto", pr: 1 }}>
                <Field label="Cash ₹">
                  <Underline width="100%">
                    {String((r.payment_type || "").toLowerCase()).includes(
                      "bank"
                    ) ||
                    String((r.payment_type || "").toLowerCase()) === "cheque"
                      ? ""
                      : r.amount || ""}
                  </Underline>
                </Field>
              </Grid>
              <Grid item sx={{ width: COL2_W, flex: "0 0 auto", pr: 1 }}>
                <Field
                  label="Date"
                  labelTextW={MID_LABEL_TEXT_W}
                  colonW={MID_COL_W}
                  valuePad={MID_VALUE_PAD}
                >
                  <Underline width="100%" align="left">
                    {r.payment_date ? 
                      new Date(r.payment_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric'
                      }).replace(/\//g, '-') : ""
                    }
                  </Underline>
                </Field>
              </Grid>
              <Grid item sx={{ width: COL3_W, flex: "0 0 auto" }}>
                <Box sx={{ width: "100%" }} />
              </Grid>
            </Grid>

            {/* Row 4: Cheque No / Bank / Spacer */}
            <Grid
              container
              columnSpacing={0}
              sx={{
                alignItems: "center",
                borderBottom: "2px solid #222",
                minHeight: 28,
                pb: 0.5,
                mb: 0.5,
                flexWrap: "nowrap",
              }}
            >
              <Grid item sx={{ width: COL1_W, flex: "0 0 auto", pr: 1 }}>
                <Field label="Cheque No.">
                  <Underline width="100%">{r.cheque_number || ""}</Underline>
                </Field>
              </Grid>
              <Grid item sx={{ width: COL2_W, flex: "0 0 auto", pr: 1 }}>
                <Field
                  label="Bank"
                  labelTextW={MID_LABEL_TEXT_W}
                  colonW={MID_COL_W}
                  valuePad={MID_VALUE_PAD}
                >
                  <Underline width="100%">{r.bank_name || ""}</Underline>
                </Field>
              </Grid>
              <Grid item sx={{ width: COL3_W, flex: "0 0 auto" }}>
                <Box sx={{ width: "100%" }} />
              </Grid>
            </Grid>

            {/* Row 5: Cheque / Months / Sign */}
            <Grid
              container
              columnSpacing={0}
              sx={{
                alignItems: "center",
                borderBottom: "2px solid #222",
                minHeight: 32,
                pb: 0.5,
                mb: 0.5,
                flexWrap: "nowrap",
              }}
            >
              <Grid item sx={{ width: COL1_W, flex: "0 0 auto", pr: 1 }}>
                <Field label="Cheque ₹">
                  <Underline width="100%">
                    {String((r.payment_type || "").toLowerCase()).includes(
                      "bank"
                    ) ||
                    String((r.payment_type || "").toLowerCase()) === "cheque"
                      ? r.amount || ""
                      : ""}
                  </Underline>
                </Field>
              </Grid>
              <Grid item sx={{ width: COL2_W, flex: "0 0 auto", pr: 1 }}>
                <Field
                  label="Months"
                  labelTextW={MID_LABEL_TEXT_W}
                  colonW={MID_COL_W}
                  valuePad={MID_VALUE_PAD}
                >
                  <Underline width="100%">
                    {displayUptoMonth(r.month_year, r.months)}
                  </Underline>
                </Field>
              </Grid>
              <Grid item sx={{ width: COL3_W, flex: "0 0 auto" }}>
                <Field label="Sign.">
                  <Underline width="100%" align="right"></Underline>
                </Field>
              </Grid>
            </Grid>

              {/* Footer note line if needed */}
            </Box>

            {/* Copy 2 */}
            <Box
              className="receipt copy-2"
              sx={{
                width: 700,
                height: "auto",
                mx: "auto",
                bgcolor: "#FFF",
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      component="img"
                      src={logo}
                      alt="Humpty Dumpty Logo"
                      sx={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </Box>
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

              {/* Row 1: Name full width with aligned label */}
              <Grid
                container
                columnSpacing={1}
                sx={{
                  alignItems: "center",
                  borderBottom: "2px solid #222",
                  minHeight: 28,
                  pb: 0.25,
                  mb: 0.5,
                }}
              >
                <Grid item xs={12}>
                  <Field label="Name">
                    <Underline width="100%">{r.student_name || ""}</Underline>
                  </Field>
                </Grid>
              </Grid>

              {/* Row 2: Class / Shift / Rcpt No */}
              <Grid
                container
                columnSpacing={0}
                sx={{
                  alignItems: "center",
                  borderBottom: "2px solid #222",
                  minHeight: 32,
                  pb: 0.5,
                  mb: 0.5,
                  flexWrap: "nowrap",
                }}
              >
                <Grid item sx={{ width: COL1_W, flex: "0 0 auto", pr: 1 }}>
                  <Box sx={{ width: "100%" }}>
                    <Field label="Class">
                      <Underline width="100%">{r.class_name || ""}</Underline>
                    </Field>
                  </Box>
                </Grid>
                <Grid item sx={{ width: COL2_W, flex: "0 0 auto", pr: 1 }}>
                  <Box sx={{ width: "100%" }}>
                    <Field
                      label="Shift"
                      labelTextW={MID_LABEL_TEXT_W}
                      colonW={MID_COL_W}
                      valuePad={MID_VALUE_PAD}
                    >
                      <Underline width="100%">{shiftName}</Underline>
                    </Field>
                  </Box>
                </Grid>
                <Grid item sx={{ width: COL3_W, flex: "0 0 auto" }}>
                  <Box sx={{ width: "100%" }}>
                    <Field label="Rcpt. No.">
                      <Underline width="100%" align="left">
                        {normalizeReceipt(r.receipt_number || "")}
                      </Underline>
                    </Field>
                  </Box>
                </Grid>
              </Grid>

              {/* Row 3: Cash / Date / Spacer */}
              <Grid
                container
                columnSpacing={0}
                sx={{
                  alignItems: "center",
                  borderBottom: "2px solid #222",
                  minHeight: 32,
                  pb: 0.5,
                  mb: 0.5,
                  flexWrap: "nowrap",
                }}
              >
                <Grid item sx={{ width: COL1_W, flex: "0 0 auto", pr: 1 }}>
                  <Field label="Cash ₹">
                    <Underline width="100%">
                      {String((r.payment_type || "").toLowerCase()).includes(
                        "bank"
                      ) ||
                      String((r.payment_type || "").toLowerCase()) === "cheque"
                        ? ""
                        : r.amount || ""}
                    </Underline>
                  </Field>
                </Grid>
                <Grid item sx={{ width: COL2_W, flex: "0 0 auto", pr: 1 }}>
                  <Field
                    label="Date"
                    labelTextW={MID_LABEL_TEXT_W}
                    colonW={MID_COL_W}
                    valuePad={MID_VALUE_PAD}
                  >
                    <Underline width="100%" align="left">
                      {r.payment_date ? 
                        new Date(r.payment_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric'
                        }).replace(/\//g, '-') : ""
                      }
                    </Underline>
                  </Field>
                </Grid>
                <Grid item sx={{ width: COL3_W, flex: "0 0 auto" }}>
                  <Box sx={{ width: "100%" }} />
                </Grid>
              </Grid>

              {/* Row 4: Cheque No / Bank / Spacer */}
              <Grid
                container
                columnSpacing={0}
                sx={{
                  alignItems: "center",
                  borderBottom: "2px solid #222",
                  minHeight: 28,
                  pb: 0.5,
                  mb: 0.5,
                  flexWrap: "nowrap",
                }}
              >
                <Grid item sx={{ width: COL1_W, flex: "0 0 auto", pr: 1 }}>
                  <Field label="Cheque No.">
                    <Underline width="100%">{r.cheque_number || ""}</Underline>
                  </Field>
                </Grid>
                <Grid item sx={{ width: COL2_W, flex: "0 0 auto", pr: 1 }}>
                  <Field
                    label="Bank"
                    labelTextW={MID_LABEL_TEXT_W}
                    colonW={MID_COL_W}
                    valuePad={MID_VALUE_PAD}
                  >
                    <Underline width="100%">{r.bank_name || ""}</Underline>
                  </Field>
                </Grid>
                <Grid item sx={{ width: COL3_W, flex: "0 0 auto" }}>
                  <Box sx={{ width: "100%" }} />
                </Grid>
              </Grid>

              {/* Row 5: Cheque / Months / Sign */}
              <Grid
                container
                columnSpacing={0}
                sx={{
                  alignItems: "center",
                  borderBottom: "2px solid #222",
                  minHeight: 32,
                  pb: 0.5,
                  mb: 0.5,
                  flexWrap: "nowrap",
                }}
              >
                <Grid item sx={{ width: COL1_W, flex: "0 0 auto", pr: 1 }}>
                  <Field label="Cheque ₹">
                    <Underline width="100%">
                      {String((r.payment_type || "").toLowerCase()).includes(
                        "bank"
                      ) ||
                      String((r.payment_type || "").toLowerCase()) === "cheque"
                        ? r.amount || ""
                        : ""}
                    </Underline>
                  </Field>
                </Grid>
                <Grid item sx={{ width: COL2_W, flex: "0 0 auto", pr: 1 }}>
                  <Field
                    label="Months"
                    labelTextW={MID_LABEL_TEXT_W}
                    colonW={MID_COL_W}
                    valuePad={MID_VALUE_PAD}
                  >
                    <Underline width="100%">
                      {displayUptoMonth(r.month_year, r.months)}
                    </Underline>
                  </Field>
                </Grid>
                <Grid item sx={{ width: COL3_W, flex: "0 0 auto" }}>
                  <Field label="Sign.">
                    <Underline width="100%" align="right"></Underline>
                  </Field>
                </Grid>
              </Grid>

              {/* Footer note line if needed */}
            </Box>
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
