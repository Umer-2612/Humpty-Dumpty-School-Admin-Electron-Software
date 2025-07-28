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
        p: 0,
        m: 0,
        boxShadow: "none",
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
        autoHeight
        filterMode="none"
        disableColumnFilter
        sx={{ border: 0, width: "100%" }}
        {...props}
      />
    </Paper>
  );
}
