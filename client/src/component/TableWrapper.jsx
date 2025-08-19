import * as React from "react";
import { useMemo, useState } from "react";
import { DataGrid, GridToolbarContainer } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import {
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Typography,
} from "@mui/material";

export default function TableWrapper({
  columns,
  rows,
  pageSize = 10,
  checkboxSelection = false,
  style = {},
  enableExport = true,
  exportFileName = "export.csv",
  ...props
}) {
  const [selectionModel, setSelectionModel] = useState([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportOnlySelected, setExportOnlySelected] = useState(false);
  const [selectedFields, setSelectedFields] = useState(null); // null = use visible

  const isExportable = (c) =>
    c && c.field && c.field !== "actions" && c.exportable !== false;

  const csvColumns = useMemo(() => {
    // Use only visible columns that have a field and headerName
    return (columns || []).filter((c) => !c.hide && isExportable(c));
  }, [columns]);

  const exportToCsv = (dataRows, columnsOverride) => {
    const useCols =
      columnsOverride && columnsOverride.length ? columnsOverride : csvColumns;
    const headers = useCols.map((c) =>
      (c.headerName || c.field).replace(/\n/g, " ")
    );
    const escape = (val) => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      // Escape quotes and wrap in quotes if needed
      const needsQuotes = /[",\n]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };
    const rowsCsv = (dataRows || []).map((r) =>
      useCols
        .map((c) => {
          const v =
            typeof c.valueGetter === "function"
              ? c.valueGetter({ row: r })
              : r[c.field];
          return escape(v);
        })
        .join(",")
    );
    const csv = [headers.join(","), ...rowsCsv].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const Toolbar = () => {
    if (!enableExport) return null;
    const selectedRows = new Set(selectionModel);
    const selectedData = rows.filter((r) => selectedRows.has(r.id));
    return (
      <GridToolbarContainer>
        <Stack direction="row" spacing={1} sx={{ p: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setExportOpen(true)}
          >
            Export
          </Button>
          {checkboxSelection && (
            <Button
              size="small"
              variant="outlined"
              disabled={!selectedData.length}
              onClick={() => {
                setExportOnlySelected(true);
                setExportOpen(true);
              }}
            >
              Export Selected
            </Button>
          )}
        </Stack>
      </GridToolbarContainer>
    );
  };

  return (
    <Paper
      sx={{
        width: "100%",
        height: "100%",
        p: 0,
        m: 0,
        boxShadow: "none",
        minWidth: 0,
        overflowX: "auto",
        overflowY: "auto",
        ...style,
      }}
    >
      {enableExport && (
        <Stack direction="row" spacing={1} sx={{ p: 1, pb: 0 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setExportOpen(true)}
          >
            Export
          </Button>
          {checkboxSelection && (
            <Button
              size="small"
              variant="outlined"
              disabled={!rows?.length || !selectionModel?.length}
              onClick={() => {
                setExportOnlySelected(true);
                setExportOpen(true);
              }}
            >
              Export Selected
            </Button>
          )}
        </Stack>
      )}
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[5, 10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize } },
          sorting: { sortModel: [{ field: "id", sort: "asc" }] },
        }}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick
        filterMode="none"
        disableColumnFilter
        rowHeight={44}
        headerHeight={48}
        density="standard"
        components={{ Toolbar }}
        selectionModel={selectionModel}
        onSelectionModelChange={(m) => setSelectionModel(m)}
        sx={{
          border: 0,
          width: "100%",
          height: "100%",
          // Ensure DataGrid uses its internal scrollers; allow horizontal scroll when needed
          // Ensure perfect vertical centering for all cells
          "& .MuiDataGrid-cell": {
            display: "flex",
            alignItems: "center",
          },
          // Keep header text vertically centered
          "& .MuiDataGrid-columnHeaderTitleContainer": {
            alignItems: "center",
          },
        }}
        {...props}
      />

      {/* Export Modal */}
      {enableExport && (
        <Dialog
          open={exportOpen}
          onClose={() => {
            setExportOpen(false);
            setExportOnlySelected(false);
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Export Options</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <div>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Rows
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant={!exportOnlySelected ? "contained" : "outlined"}
                    onClick={() => setExportOnlySelected(false)}
                  >
                    All rows ({rows?.length || 0})
                  </Button>
                </Stack>
              </div>

              <Divider />

              <div>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Columns
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Button
                    size="small"
                    onClick={() =>
                      setSelectedFields(csvColumns.map((c) => c.field))
                    }
                  >
                    Select all
                  </Button>
                  <Button size="small" onClick={() => setSelectedFields([])}>
                    Clear
                  </Button>
                </Stack>
                <FormGroup>
                  {(columns || [])
                    .filter((c) => isExportable(c))
                    .map((c) => {
                      const checked =
                        selectedFields === null
                          ? !c.hide
                          : selectedFields.includes(c.field);
                      return (
                        <FormControlLabel
                          key={c.field}
                          control={
                            <Checkbox
                              size="small"
                              checked={!!checked}
                              onChange={(e) => {
                                const on = e.target.checked;
                                setSelectedFields((prev) => {
                                  if (prev === null) {
                                    // start from current visible set
                                    const base = (columns || [])
                                      .filter(
                                        (cc) => isExportable(cc) && !cc.hide
                                      )
                                      .map((cc) => cc.field);
                                    if (on)
                                      return Array.from(
                                        new Set([...base, c.field])
                                      );
                                    return base.filter((f) => f !== c.field);
                                  }
                                  if (on)
                                    return Array.from(
                                      new Set([...(prev || []), c.field])
                                    );
                                  return (prev || []).filter(
                                    (f) => f !== c.field
                                  );
                                });
                              }}
                            />
                          }
                          label={c.headerName || c.field}
                        />
                      );
                    })}
                </FormGroup>
              </div>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setExportOpen(false);
                setExportOnlySelected(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                const selectedSet = new Set(selectionModel);
                const data = exportOnlySelected
                  ? rows.filter((r) => selectedSet.has(r.id))
                  : rows;
                const cols =
                  selectedFields === null
                    ? csvColumns
                    : (columns || []).filter(
                        (c) =>
                          isExportable(c) && selectedFields.includes(c.field)
                      );
                exportToCsv(data, cols);
                setExportOpen(false);
                setExportOnlySelected(false);
              }}
            >
              Export CSV
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
}
