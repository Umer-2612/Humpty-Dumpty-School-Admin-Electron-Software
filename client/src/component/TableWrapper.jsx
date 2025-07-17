import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";

export default function TableWrapper({
  columns,
  rows,
  pageSize = 10,
  checkboxSelection = false,
  ...props
}) {
  return (
    <Paper sx={{ height: 500, width: "100%", p: 0, m: 0, boxShadow: "none" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[5, 10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize } },
        }}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick
        sx={{ border: 0 }}
        {...props}
      />
    </Paper>
  );
}
