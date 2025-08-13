import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";

export default function TableWrapper({
  columns,
  rows,
  pageSize = 10,
  checkboxSelection = false,
  style = {},
  ...props
}) {
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
    </Paper>
  );
}
