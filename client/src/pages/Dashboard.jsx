import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
  Skeleton,
  Chip,
  Tooltip,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import TodayIcon from "@mui/icons-material/Today";
import { teal } from "@mui/material/colors";
import { useBranch } from "../context/useBranch";
import { useYear } from "../context/YearProvider.jsx";

const currency = (n) =>
  typeof n === "number"
    ? n.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      })
    : "—";

const Card = ({ title, value, icon, sub, accent = teal[600], trend }) => (
  <Paper elevation={2} sx={{ p: 2.5, height: "100%" }}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: accent + "22",
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" color="text.secondary" noWrap>
          {title}
        </Typography>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h5" sx={{ fontWeight: 700 }} noWrap>
            {value}
          </Typography>
          {trend && (
            <Tooltip title={trend.title || "Compared to last month"}>
              <Chip
                size="small"
                label={`${trend.sign}${Math.abs(trend.percent)}%`}
                sx={{
                  height: 22,
                  borderRadius: 1,
                  bgcolor: trend.up ? "#e8f5e9" : "#ffebee",
                  color: trend.up ? "#1b5e20" : "#b71c1c",
                  fontWeight: 600,
                }}
              />
            </Tooltip>
          )}
        </Stack>
        {sub && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {sub}
          </Typography>
        )}
      </Box>
    </Stack>
  </Paper>
);

const Dashboard = () => {
  const { selected: selectedBranch } = useBranch?.() || {};
  const { selected: selectedYear } = useYear();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [transport, setTransport] = useState([]);
  const [fees, setFees] = useState([]);

  useEffect(() => {
    let mounted = true;
    const safeCall = async (fnName) => {
      try {
        if (window?.electronAPI?.[fnName]) {
          return await window.electronAPI[fnName]();
        }
      } catch (e) {
        console.warn(`[Dashboard] ${fnName} failed:`, e);
      }
      return null;
    };

    const load = async () => {
      setLoading(true);
      if (!selectedBranch?.id) {
        // reset data if no branch is selected
        setStudents([]);
        setFees([]);
        const [staffRes, transportRes] = await Promise.all([
          safeCall("getTeachers"),
          safeCall("getTransport"),
        ]);
        if (!mounted) return;
        setStaff(Array.isArray(staffRes) ? staffRes : []);
        setTransport(Array.isArray(transportRes) ? transportRes : []);
        setLoading(false);
        return;
      }
      const [studentsRes, staffRes, transportRes, feesRes] = await Promise.all([
        // Branch- and Year-scoped where applicable
        window?.electronAPI?.getStudents?.(selectedBranch.id, selectedYear?.id || null),
        safeCall("getTeachers"), // not year-scoped yet
        safeCall("getTransport"), // not year-scoped yet
        window?.electronAPI?.getFees?.(selectedBranch.id, selectedYear?.id || null),
      ]);
      if (!mounted) return;
      setStudents(Array.isArray(studentsRes) ? studentsRes : []);
      setStaff(Array.isArray(staffRes) ? staffRes : []);
      setTransport(Array.isArray(transportRes) ? transportRes : []);
      const normalizedFees = Array.isArray(feesRes)
        ? feesRes
        : feesRes && typeof feesRes === "object" && Array.isArray(feesRes.fees)
        ? feesRes.fees
        : [];
      setFees(normalizedFees);
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [selectedBranch?.id, selectedYear?.id]);

  const now = new Date();
  const monthStart = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
    [now]
  );

  // Parse a date string like 'YYYY-MM-DD' as LOCAL date to avoid UTC offset issues
  const parseLocalYMD = (str) => {
    if (!str || typeof str !== "string") return null;
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!y || !mo || !d) return null;
    return new Date(y, mo - 1, d);
  };

  const getRowDate = useCallback((row) => {
    // Prefer payment_date; fallback to created_at
    const pd = row?.payment_date;
    const cd = row?.created_at;
    // Try local YMD first (for 'YYYY-MM-DD')
    let dt = parseLocalYMD(pd) || parseLocalYMD(cd);
    if (dt) return dt;
    // Fallback generic parser
    if (pd) {
      const t = new Date(pd);
      if (!isNaN(t.getTime())) return t;
    }
    if (cd) {
      const t = new Date(cd);
      if (!isNaN(t.getTime())) return t;
    }
    return null;
  }, []);

  const stats = useMemo(() => {
    const studentCount = students.length;
    const staffCount = staff.length;
    const transportCount = transport.length;

    let feesCollectedMonth = 0;
    let feesCollectedToday = 0;
    let feesCollectedPrevMonth = 0;
    for (const f of fees) {
      const amt = Number(f?.amount) || 0;
      const dt = getRowDate(f);
      if (!dt) continue;
      const sameMonth =
        dt.getFullYear() === now.getFullYear() &&
        dt.getMonth() === now.getMonth();
      if (sameMonth) feesCollectedMonth += amt;
      const sameDay = sameMonth && dt.getDate() === now.getDate();
      if (sameDay) feesCollectedToday += amt;
      // previous month
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const samePrevMonth =
        dt.getFullYear() === prevMonth.getFullYear() &&
        dt.getMonth() === prevMonth.getMonth();
      if (samePrevMonth) feesCollectedPrevMonth += amt;
    }

    // If students carry pending_fees, compute total pending
    const pendingFees = students.reduce(
      (acc, s) => acc + (Number(s?.pending_fees) || 0),
      0
    );

    // Payment method breakdown for this month
    const methods = { cash: 0, cheque: 0, upi: 0 };
    for (const f of fees) {
      const dt = getRowDate(f);
      if (!dt) continue;
      const sameMonth =
        dt.getFullYear() === now.getFullYear() &&
        dt.getMonth() === now.getMonth();
      if (!sameMonth) continue;
      const amt = Number(f?.amount) || 0;
      const key = (f?.payment_type || "").toString().toLowerCase();
      if (key === "cash" || key === "cheque" || key === "upi") {
        methods[key] += amt;
      }
    }

    // Month-over-month trend percent
    const trendPercent = feesCollectedPrevMonth
      ? Math.round(
          ((feesCollectedMonth - feesCollectedPrevMonth) /
            feesCollectedPrevMonth) *
            100
        )
      : feesCollectedMonth > 0
      ? 100
      : 0;

    return {
      studentCount,
      staffCount,
      transportCount,
      feesCollectedMonth,
      feesCollectedToday,
      pendingFees,
      methods,
      trendPercent,
    };
  }, [students, staff.length, transport.length, fees, getRowDate, now]);

  const Header = (
    <Box sx={{ mb: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${teal[600]} 0%, ${teal[400]} 100%)`,
          color: "#fff",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Dashboard
            </Typography>
            {selectedBranch?.name && (
              <Chip
                size="small"
                label={selectedBranch.name}
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff" }}
              />
            )}
            {selectedYear?.name && (
              <Chip
                size="small"
                label={selectedYear.name}
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff" }}
              />
            )}
          </Stack>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {now.toLocaleDateString()}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );

  const loadingCards = (
    <Grid container spacing={2}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Paper elevation={2} sx={{ p: 2.5 }}>
            <Skeleton variant="rounded" width={48} height={48} />
            <Skeleton sx={{ mt: 1 }} width="50%" />
            <Skeleton width="30%" />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {Header}
      {!selectedBranch?.id ? (
        <Paper
          elevation={0}
          sx={{ p: 3, textAlign: "center", color: "text.secondary" }}
        >
          <Typography variant="body1">
            Please select a branch to view branch-specific dashboard data.
          </Typography>
        </Paper>
      ) : loading ? (
        loadingCards
      ) : (
        <Grid container spacing={2} alignItems="stretch">
          <Grid item xs={12} sm={6} md={4}>
            <Card
              title="Total Students"
              value={stats.studentCount}
              icon={<PeopleIcon />}
              sub="All active students"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              title="Total Staff"
              value={stats.staffCount}
              icon={<SchoolIcon />}
              sub="Teaching & non-teaching"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              title="Transport Vehicles"
              value={stats.transportCount}
              icon={<DirectionsBusIcon />}
              sub="Registered vehicles"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              title="Fees Collected (Month)"
              value={currency(stats.feesCollectedMonth)}
              icon={<CurrencyRupeeIcon />}
              sub={`Since ${monthStart.toLocaleDateString()}`}
              trend={{
                percent: Math.abs(stats.trendPercent),
                up: stats.trendPercent >= 0,
                sign:
                  stats.trendPercent > 0
                    ? "+"
                    : stats.trendPercent < 0
                    ? "-"
                    : "",
                title: "Month-over-month change",
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              title="Fees Collected (Today)"
              value={currency(stats.feesCollectedToday)}
              icon={<TodayIcon />}
              sub={now.toLocaleDateString()}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              title="Total Pending Fees"
              value={currency(stats.pendingFees)}
              icon={<PendingActionsIcon />}
              sub="Across all students"
            />
          </Grid>

          {/* Payment method breakdown and recent activity */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Payment Methods (This Month)
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`Cash: ${currency(stats.methods.cash)}`}
                  color="default"
                />
                <Chip
                  label={`Cheque: ${currency(stats.methods.cheque)}`}
                  color="default"
                />
                <Chip
                  label={`UPI: ${currency(stats.methods.upi)}`}
                  color="default"
                />
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Recent Fee Receipts
              </Typography>
              <Stack spacing={1.25}>
                {fees
                  .map((f) => ({ ...f, _dt: getRowDate(f) }))
                  .filter((f) => f._dt)
                  .sort((a, b) => b._dt - a._dt)
                  .slice(0, 5)
                  .map((f, idx) => (
                    <Stack
                      key={idx}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ minWidth: 0 }}
                      >
                        <Chip
                          size="small"
                          label={(f.payment_type || "")
                            .toString()
                            .toUpperCase()}
                          variant="outlined"
                        />
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 240 }}
                        >
                          {f.student_name || `Student #${f.student_id}`}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          {f._dt?.toLocaleDateString?.()}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {currency(Number(f.amount) || 0)}
                        </Typography>
                      </Stack>
                    </Stack>
                  ))}
                {fees.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No receipts yet.
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;
