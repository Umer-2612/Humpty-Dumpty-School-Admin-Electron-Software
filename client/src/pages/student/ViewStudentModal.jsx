import React from "react";
import Dialog from "@mui/material/Dialog";
import Slide from "@mui/material/Slide";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { teal, grey, green } from "@mui/material/colors";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import CallIcon from "@mui/icons-material/Call";
import SchoolIcon from "@mui/icons-material/School";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import LinearProgress from "@mui/material/LinearProgress";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

export default function ViewStudentModal({
  open,
  onClose,
  student,
  shifts = [],
}) {
  const s = student || {};

  const fmtCurrency = (n) => {
    const v = Number(n || 0);
    return new Intl.NumberFormat("en-IN").format(v);
  };
  const fmtDate = (d) => {
    if (!d) return "-";
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return d; // keep as-is if not ISO/date
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const initials = (s.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  const handleCopy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.log(e);
    }
  };

  const total = Number(s.total_fees || 0);
  const pending = Number(s.pending_fees || 0);
  const paid = Math.max(0, total - pending);
  const paidPct =
    total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  const shiftLabel = (v) => {
    // Prefer live Shift module data
    const match = (shifts || []).find((sh) => String(sh.id) === String(v));
    if (match?.name) return match.name;
    // Fallback to simple mapping when shifts not loaded
    if (v === 1 || v === "1") return "Morning";
    if (v === 2 || v === "2") return "Afternoon";
    return v ?? "-";
  };

  const Section = ({ icon, title, children }) => (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        {icon}
        <Typography
          variant="subtitle2"
          sx={{ color: grey[700], fontWeight: 700 }}
        >
          {title}
        </Typography>
      </Stack>
      <Box
        sx={{
          border: `1px solid ${grey[200]}`,
          bgcolor: "#fff",
          borderRadius: 1.5,
          p: 1.25,
        }}
      >
        {children}
      </Box>
    </Box>
  );

  const InfoRow = ({ label, value, link, copyable }) => (
    <Stack
      direction="row"
      alignItems="flex-start"
      spacing={1.25}
      sx={{ py: 0.75, minHeight: 42 }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{ color: grey[600], fontWeight: 600, lineHeight: 1 }}
        >
          {label}
        </Typography>
        {link ? (
          <Tooltip title={value || "-"}>
            <Link
              href={link}
              underline="none"
              sx={{
                display: "block",
                fontWeight: 700,
                color: grey[900],
                lineHeight: 1.3,
              }}
            >
              {value || "-"}
            </Link>
          </Tooltip>
        ) : (
          <Tooltip title={value || "-"}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: grey[900],
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.3,
              }}
            >
              {value || "-"}
            </Typography>
          </Tooltip>
        )}
      </Box>
      {copyable && value ? (
        <IconButton size="small" onClick={() => handleCopy(value)}>
          <ContentCopyIcon sx={{ fontSize: 16, color: grey[600] }} />
        </IconButton>
      ) : null}
    </Stack>
  );

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header with fee summary */}
      <Box
        sx={{
          bgcolor: teal[600],
          color: "white",
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ bgcolor: "white", color: teal[600], fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {s.name || "-"}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption">
                {s.class_name
                  ? `${s.class_name}${s.division ? ` (${s.division})` : ""}`
                  : "-"}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                label={`Roll No. ${s.roll_number || "-"}`}
                sx={{ height: 20 }}
              />
            </Stack>
          </Box>
        </Stack>

        {/* Fees badge */}
        <Box
          sx={{
            bgcolor: "white",
            color: teal[800],
            px: 1.25,
            py: 0.75,
            borderRadius: 1.25,
            minWidth: 170,
            border: `1px solid ${grey[200]}`,
            boxShadow: 1,
          }}
        >
          <Stack spacing={0.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Total
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
              >
                ₹{fmtCurrency(s.total_fees)}
              </Typography>
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: grey[700] }}
              >
                Pending
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: (s.pending_fees ?? 0) > 0 ? teal[800] : green[800],
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ₹{fmtCurrency(s.pending_fees)}
              </Typography>
            </Stack>
            <Box sx={{ mt: 0.25 }}>
              <LinearProgress
                variant="determinate"
                value={paidPct}
                sx={{
                  height: 5,
                  borderRadius: 4,
                  bgcolor: grey[200],
                  "& .MuiLinearProgress-bar": {
                    bgcolor: pending > 0 ? teal[500] : green[600],
                  },
                }}
              />
            </Box>
          </Stack>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "white", ml: 1 }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Scrollable content */}
      <Box sx={{ p: 1.5, bgcolor: "white", overflowY: "auto", flexGrow: 1 }}>
        {/* Full-width sections with 2-fields-per-row layout */}
        <Stack spacing={2}>
          {/* Contact Section */}
          <Section
            icon={<CallIcon sx={{ fontSize: 18, color: teal[700] }} />}
            title="Contact"
          >
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <InfoRow
                  label="Father's Contact"
                  value={s.parents_contact1}
                  link={
                    s.parents_contact1 ? `tel:${s.parents_contact1}` : undefined
                  }
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <InfoRow
                  label="Mother's Contact"
                  value={s.parents_contact2}
                  link={
                    s.parents_contact2 ? `tel:${s.parents_contact2}` : undefined
                  }
                />
              </Box>
            </Stack>
          </Section>

          {/* School Section */}
          <Section
            icon={<SchoolIcon sx={{ fontSize: 18, color: teal[700] }} />}
            title="School"
          >
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <InfoRow
                    label="Class"
                    value={
                      s.class_name
                        ? `${s.class_name}${
                            s.division ? ` (${s.division})` : ""
                          }`
                        : "-"
                    }
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <InfoRow label="Roll No" value={s.roll_number} />
                </Box>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <InfoRow label="Branch" value={s.branch_name} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <InfoRow label="Shift" value={shiftLabel(s.shift_id)} />
                </Box>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <InfoRow
                    label="Admission"
                    value={fmtDate(s.admission_date)}
                  />
                </Box>
              </Stack>
            </Stack>
          </Section>

          {/* Personal Section */}
          <Section
            icon={<PersonIcon sx={{ fontSize: 18, color: teal[700] }} />}
            title="Personal"
          >
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <InfoRow label="Gender" value={s.gender} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <InfoRow label="Birth Place" value={s.birth_place} />
                </Box>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <InfoRow label="Father Name" value={s.father_name} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <InfoRow label="Mother Name" value={s.mother_name} />
                </Box>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <InfoRow label="Religion" value={s.religion} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <InfoRow label="Scholarship" value={s.fee_scholarship} />
                </Box>
              </Stack>
            </Stack>
          </Section>

          {/* Address Section */}
          <Section
            icon={<HomeIcon sx={{ fontSize: 18, color: teal[700] }} />}
            title="Address"
          >
            <Box
              sx={{
                p: 1,
                bgcolor: grey[50],
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: grey[900],
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.address || "-"}
              </Typography>
            </Box>
          </Section>

        </Stack>

        <Box sx={{ textAlign: "right", mt: 1 }}>
          <Typography variant="caption" sx={{ color: grey[500] }}>
            Created: {fmtDate(s.created_at)}
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
