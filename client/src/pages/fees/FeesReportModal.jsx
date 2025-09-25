import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Divider,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
  Stack,
  Chip,
  Button,
  IconButton,
} from "@mui/material";
import { teal } from "@mui/material/colors";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useBranch } from "../../context/useBranch";
import { useYear } from "../../context/YearProvider";
import FeesReportTable from "../../component/FeesReportTable";

export default function FeesReportModal({ open, onClose }) {
  const { selected: branch } = useBranch?.() || {};
  const { selected: year } = useYear();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [classEntries, setClassEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1); // 1-based for MUI Pagination
  const rowsPerPage = 10;
  const tableContainerRef = useRef(null);

  console.log({ selectedClass });

  // Add serial numbers to students data
  const studentsWithSrNo = students.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

  // Labels for report header summary
  const reportClassLabel = useMemo(() => {
    if (!selectedEntryId) return "Not Selected";
    const c = classEntries.find(
      (x) => String(x.class_id || x.id) === String(selectedEntryId)
    );
    return c?.class_name
      ? `${c.class_name} - ${c.shift_name}`
      : String(selectedEntryId);
  }, [selectedEntryId, classEntries]);

  const reportDivisionLabel = useMemo(() => {
    if (!selectedDivision) return "Not Selected";
    return String(selectedDivision);
  }, [selectedDivision]);

  const yearLabel = useMemo(() => {
    const y = year || {};
    return y.name || y.year_name || y.label || y.title || y.id || "-";
  }, [year]);

  const branchLabel = useMemo(() => branch?.name || "-", [branch]);

  const reportCount = students.length;
  const reportGeneratedAt = useMemo(() => {
    try {
      return new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Failed to format date:", e);
      return new Date().toISOString();
    }
  }, []);

  // Fetch class entries when modal opens
  useEffect(() => {
    const fetchClassEntries = async () => {
      if (!open || !branch?.id) return;
      try {
        const data = await window.electronAPI.listClassesByBranch(branch.id);
        setClassEntries(data || []);
      } catch (e) {
        console.error("Failed to fetch class entries:", e);
      }
    };
    fetchClassEntries();
  }, [open, branch?.id]);

  // Generate divisions when class is selected
  useEffect(() => {
    console.log("Division generation - selectedEntryId:", selectedEntryId);
    console.log("Division generation - classEntries:", classEntries);

    if (!selectedEntryId) {
      // When "All" is selected, show all divisions from all classes
      const allDivisions = new Set();
      classEntries.forEach((entry) => {
        console.log("Processing entry for all divisions:", entry);
        for (
          let i = 1;
          i <= (entry.division_count || entry.num_divisions || 1);
          i++
        ) {
          allDivisions.add(String.fromCharCode(64 + i)); // A, B, C, etc.
        }
      });
      const sortedDivisions = Array.from(allDivisions).sort();
      console.log("All divisions generated:", sortedDivisions);
      setDivisionOptions(sortedDivisions);
      setSelectedDivision("");
      setPage(1);
      return;
    }
    const entry = classEntries.find(
      (e) => String(e.class_id || e.id) === String(selectedEntryId)
    );
    console.log("Found entry for specific class:", entry);
    if (entry) {
      setSelectedClass(entry.class_name);
      const divisions = [];
      for (
        let i = 1;
        i <= (entry.division_count || entry.num_divisions || 1);
        i++
      ) {
        divisions.push(String.fromCharCode(64 + i)); // A, B, C, etc.
      }
      console.log("Divisions for specific class:", divisions);
      setDivisionOptions(divisions);
      setSelectedDivision("");
      setPage(1);
    }
  }, [selectedEntryId, classEntries]);

  // Fetch students when class and division are selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedDivision) {
        setStudents([]);
        setPage(1);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const result = await window.electronAPI.getStudents(
          branch.id,
          year?.id || null
        );
        console.log("Students API result:", result);

        // Handle both direct array response and success object response
        const allStudents = Array.isArray(result)
          ? result
          : result?.students || [];

        // Filter by class and division
        const filtered = allStudents.filter((student) => {
          const matchesClass =
            !selectedEntryId ||
            String(student.class_id) === String(selectedEntryId);
          const matchesDivision =
            String(student.division || "").toUpperCase() ===
            selectedDivision.toUpperCase();
          console.log(
            `Student ${student.name}: class_id=${student.class_id}, division=${student.division}, matchesClass=${matchesClass}, matchesDivision=${matchesDivision}`
          );
          return matchesClass && matchesDivision;
        });

        console.log(
          `Filtered ${filtered.length} students from ${allStudents.length} total`
        );

        // Get term summary for each student
        const studentsWithFees = await Promise.all(
          filtered.map(async (student) => {
            try {
              const termResult = await window.electronAPI.getStudentTermSummary(
                student.id,
                year?.id || null
              );
              return {
                ...student,
                termSummary: termResult?.success
                  ? termResult.summary
                  : { terms: {} },
              };
            } catch (e) {
              console.error(
                `Failed to get term summary for student ${student.id}:`,
                e
              );
              return {
                ...student,
                termSummary: { terms: {} },
              };
            }
          })
        );

        setStudents(studentsWithFees);
      } catch (e) {
        console.error("Failed to fetch students:", e);
        setError("Failed to load students");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedEntryId, selectedDivision, branch?.id, year?.id]);

  // Reset to first page when modal reopens or dataset changes significantly
  useEffect(() => {
    setPage(1);
  }, [open]);

  // Report modal columns
  const reportColumns = useMemo(() => {
    const baseColumns = [
      {
        field: "srNo",
        headerName: "Sr. No.",
        width: 80,
        headerAlign: "center",
        align: "center",
      },
      {
        field: "name",
        headerName: "Student Name",
        width: 200,
        renderCell: (params) => {
          const rollNumber = params.row.roll_number;
          return rollNumber ? `${params.value} (${rollNumber})` : params.value;
        },
      },
    ];

    const currencyCell = (params) =>
      `₹${params.value?.toLocaleString("en-IN") || 0}`;

    // New structure: For each of Term1, Term2, Books -> subcolumns Total, Paid, Pending
    const term1Columns = [
      {
        field: "term1Total",
        headerName: "Total",
        width: 90,
        headerAlign: "center",
        align: "right",
        renderCell: currencyCell,
      },
      {
        field: "term1Paid",
        headerName: "Paid",
        width: 90,
        headerAlign: "center",
        align: "right",
        renderCell: currencyCell,
      },
      {
        field: "term1Pending",
        headerName: "Pending",
        width: 90,
        headerAlign: "center",
        align: "right",
        renderCell: currencyCell,
      },
    ];
    const term2Columns = [
      {
        field: "term2Total",
        headerName: "Total",
        width: 90,
        headerAlign: "center",
        align: "right",
        renderCell: currencyCell,
      },
      {
        field: "term2Paid",
        headerName: "Paid",
        width: 90,
        headerAlign: "center",
        align: "right",
        renderCell: currencyCell,
      },
      {
        field: "term2Pending",
        headerName: "Pending",
        width: 90,
        headerAlign: "center",
        align: "right",
        renderCell: currencyCell,
      },
    ];
    const booksColumns = [
      {
        field: "booksTotal",
        headerName: "Total",
        width: 90,
        headerAlign: "center",
        align: "right",
        renderCell: currencyCell,
      },
      {
        field: "booksPaid",
        headerName: "Paid",
        width: 90,
        headerAlign: "center",
        align: "right",
        renderCell: currencyCell,
      },
      {
        field: "booksPending",
        headerName: "Pending",
        width: 90,
        headerAlign: "center",
        align: "right",
        renderCell: currencyCell,
      },
    ];

    return [...baseColumns, ...term1Columns, ...term2Columns, ...booksColumns];
  }, []);

  // Prepare students data with calculated amounts
  const studentsWithAmounts = useMemo(() => {
    return studentsWithSrNo.map((student) => {
      const terms = student.termSummary?.terms || {};

      // Get individual term data
      const term1Data = terms.term1 || { total: 0, paid: 0, pending: 0 };
      const term2Data = terms.term2 || { total: 0, paid: 0, pending: 0 };
      const booksData = terms.books || { total: 0, paid: 0, pending: 0 };

      return {
        ...student,
        // Term1
        term1Total: Number(term1Data.total) || 0,
        term1Paid: Number(term1Data.paid) || 0,
        term1Pending: Number(term1Data.pending) || 0,
        // Term2
        term2Total: Number(term2Data.total) || 0,
        term2Paid: Number(term2Data.paid) || 0,
        term2Pending: Number(term2Data.pending) || 0,
        // Books
        booksTotal: Number(booksData.total) || 0,
        booksPaid: Number(booksData.paid) || 0,
        booksPending: Number(booksData.pending) || 0,
        // Keep legacy totals for grand total calculations
        totalAmount:
          (Number(term1Data.total) || 0) +
          (Number(term2Data.total) || 0) +
          (Number(booksData.total) || 0),
        receivedAmount:
          (Number(term1Data.paid) || 0) +
          (Number(term2Data.paid) || 0) +
          (Number(booksData.paid) || 0),
        pendingAmount:
          (Number(term1Data.pending) || 0) +
          (Number(term2Data.pending) || 0) +
          (Number(booksData.pending) || 0),
      };
    });
  }, [studentsWithSrNo]);

  // Pagination derivations
  const totalItems = studentsWithAmounts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const pagedRows = studentsWithAmounts.slice(startIndex, endIndex);

  // Calculate grand totals for all students
  const grandTotals = useMemo(() => {
    return studentsWithAmounts.reduce(
      (acc, student) => ({
        totalAmount: acc.totalAmount + (student.totalAmount || 0),
        receivedAmount: acc.receivedAmount + (student.receivedAmount || 0),
        pendingAmount: acc.pendingAmount + (student.pendingAmount || 0),
        // Term1
        term1Total: acc.term1Total + (student.term1Total || 0),
        term1Paid: acc.term1Paid + (student.term1Paid || 0),
        term1Pending: acc.term1Pending + (student.term1Pending || 0),
        // Term2
        term2Total: acc.term2Total + (student.term2Total || 0),
        term2Paid: acc.term2Paid + (student.term2Paid || 0),
        term2Pending: acc.term2Pending + (student.term2Pending || 0),
        // Books
        booksTotal: acc.booksTotal + (student.booksTotal || 0),
        booksPaid: acc.booksPaid + (student.booksPaid || 0),
        booksPending: acc.booksPending + (student.booksPending || 0),
      }),
      {
        totalAmount: 0,
        receivedAmount: 0,
        pendingAmount: 0,
        term1Total: 0,
        term1Paid: 0,
        term1Pending: 0,
        term2Total: 0,
        term2Paid: 0,
        term2Pending: 0,
        booksTotal: 0,
        booksPaid: 0,
        booksPending: 0,
      }
    );
  }, [studentsWithAmounts]);

  // Build report HTML string (used by Print)
  const buildReportHtml = useCallback(
    (rows) => {
      const htmlRows = (rows || [])
        .map((r) => {
          const vals = [
            r.srNo || "",
            r.roll_number ? `${r.name || ""} (${r.roll_number})` : r.name || "",
            // Term1: Total, Paid, Pending
            `₹${r.term1Total?.toLocaleString("en-IN") || 0}`,
            `₹${r.term1Paid?.toLocaleString("en-IN") || 0}`,
            `₹${r.term1Pending?.toLocaleString("en-IN") || 0}`,
            // Term2: Total, Paid, Pending
            `₹${r.term2Total?.toLocaleString("en-IN") || 0}`,
            `₹${r.term2Paid?.toLocaleString("en-IN") || 0}`,
            `₹${r.term2Pending?.toLocaleString("en-IN") || 0}`,
            // Books: Total, Paid, Pending
            `₹${r.booksTotal?.toLocaleString("en-IN") || 0}`,
            `₹${r.booksPaid?.toLocaleString("en-IN") || 0}`,
            `₹${r.booksPending?.toLocaleString("en-IN") || 0}`,
          ].map((v) =>
            String(v)
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
          );
          return `<tr>${vals.map((v) => `<td>${v}</td>`).join("")}</tr>`;
        })
        .join("");

      const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Fee Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 10px; }
          .header { margin-bottom: 12px; text-align: center; }
          .branch { margin: 0; font-size: 18px; font-weight: 700; }
          .subject { margin: 2px 0 0 0; font-size: 12px; color: #333; }
          .meta { margin: 4px 0 8px 0; font-size: 11px; color: #555; }
          .chips { margin: 6px 0 12px 0; text-align: center; }
          .chip { display: inline-block; border: 1px solid #bbb; border-radius: 12px; padding: 1px 6px; font-size: 10px; margin-right: 4px; margin-bottom: 4px; }
          table { border-collapse: collapse; width: 100%; table-layout: fixed; }
          th, td { border: 1px solid #999; padding: 4px 6px; font-size: 11px; word-wrap: break-word; }
          th { background: #f0f0f0; text-align: left; }
          @media print {
            @page { size: A4 landscape; margin: 10mm; }
            thead { display: table-header-group; }
            tfoot { display: table-row-group; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="branch">${branchLabel}</div>
          <div class="subject">Fee Report</div>
          <div class="meta">${reportGeneratedAt} • Total: ${reportCount}</div>
          <div class="chips">
            <span class="chip">Year: ${yearLabel}</span>
            <span class="chip">Class: ${reportClassLabel}</span>
            <span class="chip">Division: ${reportDivisionLabel}</span>
          </div>
        </div>
        <table>
          <colgroup>
            <col style="width:5%" />
            <col style="width:20%" />
            <col style="width:7.5%" />
            <col style="width:7.5%" />
            <col style="width:7.5%" />
            <col style="width:7.5%" />
            <col style="width:7.5%" />
            <col style="width:7.5%" />
            <col style="width:7.5%" />
            <col style="width:7.5%" />
            <col style="width:7.5%" />
          </colgroup>
          <thead>
            <tr>
              <th rowspan="2">Sr. No.</th>
              <th rowspan="2">Student Name</th>
              <th colspan="3" style="text-align: center;">Term1</th>
              <th colspan="3" style="text-align: center;">Term2</th>
              <th colspan="3" style="text-align: center;">Books</th>
            </tr>
            <tr>
              <th>Total</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Pending</th>
            </tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid #333; background: #f5f5f5;">
              <td colspan="2" style="font-weight: bold; text-align: right; padding: 8px;">Grand Total:</td>
              <td style="font-weight: bold; text-align: left; padding: 8px;">₹${grandTotals.term1Total.toLocaleString(
                "en-IN"
              )}</td>
              <td style="font-weight: bold; text-align: left; padding: 8px;">₹${grandTotals.term1Paid.toLocaleString(
                "en-IN"
              )}</td>
              <td style="font-weight: bold; text-align: left; padding: 8px;">₹${grandTotals.term1Pending.toLocaleString(
                "en-IN"
              )}</td>
              <td style="font-weight: bold; text-align: left; padding: 8px;">₹${grandTotals.term2Total.toLocaleString(
                "en-IN"
              )}</td>
              <td style="font-weight: bold; text-align: left; padding: 8px;">₹${grandTotals.term2Paid.toLocaleString(
                "en-IN"
              )}</td>
              <td style="font-weight: bold; text-align: left; padding: 8px;">₹${grandTotals.term2Pending.toLocaleString(
                "en-IN"
              )}</td>
              <td style="font-weight: bold; text-align: left; padding: 8px;">₹${grandTotals.booksTotal.toLocaleString(
                "en-IN"
              )}</td>
              <td style="font-weight: bold; text-align: left; padding: 8px;">₹${grandTotals.booksPaid.toLocaleString(
                "en-IN"
              )}</td>
              <td style="font-weight: bold; text-align: left; padding: 8px;">₹${grandTotals.booksPending.toLocaleString(
                "en-IN"
              )}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>`;
      return html;
    },
    [
      branchLabel,
      reportGeneratedAt,
      reportCount,
      yearLabel,
      reportClassLabel,
      reportDivisionLabel,
      grandTotals.term1Total,
      grandTotals.term1Paid,
      grandTotals.term1Pending,
      grandTotals.term2Total,
      grandTotals.term2Paid,
      grandTotals.term2Pending,
      grandTotals.booksTotal,
      grandTotals.booksPaid,
      grandTotals.booksPending,
    ]
  );

  // Print: open print dialog with all filtered rows
  const printReport = useCallback(() => {
    const html = buildReportHtml(studentsWithAmounts);
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(
        html.replace(
          "</body>",
          "<script>window.onload = function(){ window.print(); }</script></body>"
        )
      );
      w.document.close();
    }
  }, [buildReportHtml, studentsWithAmounts]);

  // Removed scale-to-fit; we now use internal scroll inside the table container

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={false}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "90vw",
          height: "85vh",
          maxWidth: "90vw",
          maxHeight: "85vh",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <AssessmentIcon sx={{ color: teal[700] }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                Fee Report
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {reportGeneratedAt} • Total: {reportCount}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          overflow: "hidden",
          p: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Filter chips summary */}
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
          <Chip size="small" label={`Branch: ${branchLabel}`} />
          <Chip size="small" label={`Year: ${yearLabel}`} />
          <Chip size="small" label={`Class: ${reportClassLabel}`} />
          <Chip size="small" label={`Division: ${reportDivisionLabel}`} />
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {/* Filters */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel
              shrink={selectedEntryId === "" || selectedEntryId !== ""}
            >
              Class
            </InputLabel>
            <Select
              value={selectedEntryId}
              label="Class"
              onChange={(e) => setSelectedEntryId(e.target.value)}
              displayEmpty
              renderValue={(selected) => {
                const selectedClass = classEntries.find(
                  (c) => String(c.class_id || c.id) === String(selected)
                );
                return selectedClass?.class_name
                  ? `${selectedClass.class_name} - ${selectedClass.shift_name}`
                  : "Select Class";
              }}
            >
              {classEntries.map((entry) => (
                <MenuItem
                  key={entry.class_id || entry.id}
                  value={entry.class_id || entry.id}
                >
                  {entry.class_name} - {entry.shift_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel
              shrink={selectedDivision === "" || selectedDivision !== ""}
            >
              Division
            </InputLabel>
            <Select
              value={selectedDivision}
              label="Division"
              onChange={(e) => setSelectedDivision(e.target.value)}
              displayEmpty
              disabled={!selectedEntryId}
              renderValue={(selected) => selected || "Select Division"}
            >
              {divisionOptions.map((div) => (
                <MenuItem key={div} value={div}>
                  {div}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="text"
            color="inherit"
            onClick={() => {
              setSelectedEntryId("");
              setSelectedDivision("");
            }}
            sx={{ ml: "auto" }}
          >
            Reset
          </Button>
        </Stack>

        {/* Content */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {!loading && !error && !selectedDivision && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary">
              Please select a division to view the report.
            </Typography>
          </Box>
        )}

        {!loading && !error && selectedDivision && (
          <>
            <Box
              ref={tableContainerRef}
              sx={{
                width: "100%",
                flex: 1,
                minHeight: 0,
                display: "flex",
              }}
            >
              <FeesReportTable
                columns={reportColumns}
                rows={[
                  ...pagedRows,
                  ...(currentPage === totalPages
                    ? [
                        {
                          id: "grand-total",
                          srNo: "",
                          roll_number: "",
                          name: "Grand Total",
                          term1Total: grandTotals.term1Total,
                          term1Paid: grandTotals.term1Paid,
                          term1Pending: grandTotals.term1Pending,
                          term2Total: grandTotals.term2Total,
                          term2Paid: grandTotals.term2Paid,
                          term2Pending: grandTotals.term2Pending,
                          booksTotal: grandTotals.booksTotal,
                          booksPaid: grandTotals.booksPaid,
                          booksPending: grandTotals.booksPending,
                          isGrandTotal: true,
                        },
                      ]
                    : []),
                ]}
                getRowClassName={(params) =>
                  params.row.isGrandTotal ? "grand-total-row" : ""
                }
              />
            </Box>

            {/* Pagination controls (moved inside content for consistency with Staff) */}
            <Box
              sx={{
                mt: 2,
                display: "flex",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Box
                sx={{
                  ml: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {totalItems === 0 ? 0 : startIndex + 1}–{endIndex} of{" "}
                  {totalItems}
                </Typography>
                <IconButton
                  size="small"
                  color="inherit"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    if (currentPage > 1) setPage(currentPage - 1);
                    if (tableContainerRef.current) {
                      try {
                        tableContainerRef.current.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      } catch {
                        tableContainerRef.current.scrollTop = 0;
                      }
                    }
                  }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="inherit"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    if (currentPage < totalPages) setPage(currentPage + 1);
                    if (tableContainerRef.current) {
                      try {
                        tableContainerRef.current.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      } catch {
                        tableContainerRef.current.scrollTop = 0;
                      }
                    }
                  }}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2 }}>
        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={printReport}
            disabled={
              !selectedEntryId ||
              !selectedDivision ||
              studentsWithAmounts.length === 0
            }
          >
            Print
          </Button>
          <Button onClick={onClose}>Close</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
