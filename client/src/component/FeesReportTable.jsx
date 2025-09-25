import React, { useRef, useLayoutEffect, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

const FeesReportTable = ({ columns, rows, getRowClassName }) => {
  // Split columns into groups: after first two base columns
  const term1Columns = columns.slice(2, 5);
  const term2Columns = columns.slice(5, 8);
  const booksColumns = columns.slice(8, 11);

  const groupHeaderRef = useRef(null);
  const subHeaderRef = useRef(null);
  const [groupH, setGroupH] = useState(40);
  const [subH, setSubH] = useState(40);

  useLayoutEffect(() => {
    const gh = groupHeaderRef.current;
    const sh = subHeaderRef.current;
    if (!gh || !sh) return;
    const update = () => {
      setGroupH(Math.round(gh.getBoundingClientRect().height));
      setSubH(Math.round(sh.getBoundingClientRect().height));
    };
    update();
    const ro1 = new ResizeObserver(update);
    const ro2 = new ResizeObserver(update);
    ro1.observe(gh);
    ro2.observe(sh);
    return () => {
      ro1.disconnect();
      ro2.disconnect();
    };
  }, []);

  return (
    <TableContainer
      component={Paper}
      sx={{
        height: "100%",
        maxHeight: "100%",
        width: "100%",
        p: 0,
        m: 0,
        boxShadow: "none",
        border: "1px solid",
        borderColor: "divider",
        minWidth: 0,
        overflow: "auto",
      }}
    >
      <Table
        stickyHeader
        sx={{
          minWidth: 800,
          borderCollapse: "separate",
          borderSpacing: 0,
          tableLayout: "fixed",
          // Force horizontal dividers for all headers and rows
          "& th.MuiTableCell-root, & td.MuiTableCell-root": {
            borderBottom: "1px solid",
            borderColor: "divider",
          },
          "& thead .MuiTableRow-root, & tbody .MuiTableRow-root": {
            "& .MuiTableCell-root:last-of-type": {
              borderRight: 0,
            },
          },
          // Ensure the last row also shows a bottom divider line
          "& tbody .MuiTableRow-root:last-of-type .MuiTableCell-root": {
            borderBottom: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <TableHead>
          {/* Single Header Row with Group Headers and Sub Headers */}
          <TableRow ref={groupHeaderRef}>
            {/* Sr. No. */}
            <TableCell
              rowSpan={2}
              sx={{
                backgroundColor: "#f5f5f5",
                border: 0,
                borderBottom: "1px solid",
                borderColor: "divider",
                fontWeight: 600,
                fontSize: "12px",
                textAlign: "center",
                width: 80,
                verticalAlign: "middle",
                position: "sticky",
                top: 0,
                zIndex: 130,
                padding: "0 6px",
                height: 40,
                lineHeight: "40px",
                backgroundClip: "padding-box",
                backgroundImage:
                  "linear-gradient(var(--mui-palette-divider), var(--mui-palette-divider))",
                backgroundRepeat: "no-repeat",
                backgroundPosition: `0 ${groupH + subH}px`,
                backgroundSize: "100% 1px",
                borderRight: "1px solid",
              }}
            >
              Sr. No.
            </TableCell>

            {/* Student Name */}
            <TableCell
              rowSpan={2}
              sx={{
                backgroundColor: "#f5f5f5",
                border: 0,
                borderBottom: "1px solid",
                borderColor: "divider",
                fontWeight: 600,
                fontSize: "12px",
                width: 200,
                verticalAlign: "middle",
                position: "sticky",
                top: 0,
                zIndex: 130,
                padding: "0 6px",
                height: 40,
                lineHeight: "40px",
                backgroundClip: "padding-box",
                backgroundImage:
                  "linear-gradient(var(--mui-palette-divider), var(--mui-palette-divider))",
                backgroundRepeat: "no-repeat",
                backgroundPosition: `0 ${groupH + subH}px`,
                backgroundSize: "100% 1px",
                borderRight: "1px solid",
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Student Name
            </TableCell>

            {/* Term1 Group Header */}
            <TableCell
              colSpan={3}
              sx={{
                backgroundColor: "#f5f5f5",
                border: 0,
                borderBottom: "1px solid",
                borderColor: "divider",
                fontWeight: 600,
                fontSize: "12px",
                textAlign: "center",
                position: "sticky",
                top: 0,
                zIndex: 130,
                height: 40,
                padding: 0,
                lineHeight: "40px",
                backgroundClip: "padding-box",
                borderRight: "1px solid",
              }}
            >
              Term1
            </TableCell>

            {/* Term2 Group Header */}
            <TableCell
              colSpan={3}
              sx={{
                backgroundColor: "#f5f5f5",
                border: 0,
                borderBottom: "1px solid",
                borderColor: "divider",
                fontWeight: 600,
                fontSize: "12px",
                textAlign: "center",
                position: "sticky",
                top: 0,
                zIndex: 130,
                height: 40,
                padding: 0,
                lineHeight: "40px",
                backgroundClip: "padding-box",
                borderRight: "1px solid",
              }}
            >
              Term2
            </TableCell>

            {/* Books Group Header */}
            <TableCell
              colSpan={3}
              sx={{
                backgroundColor: "#f5f5f5",
                border: 0,
                borderBottom: "1px solid",
                borderColor: "divider",
                fontWeight: 600,
                fontSize: "12px",
                textAlign: "center",
                position: "sticky",
                top: 0,
                zIndex: 130,
                height: 40,
                padding: 0,
                lineHeight: "40px",
                backgroundClip: "padding-box",
                borderRight: "1px solid",
              }}
            >
              Books
            </TableCell>
          </TableRow>

          {/* Sub Headers Row */}
          <TableRow ref={subHeaderRef}>
            {/* Term1 Sub Headers */}
            {term1Columns.map((column) => (
              <TableCell
                key={column.field}
                sx={{
                  backgroundColor: "#f5f5f5",
                  border: 0,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  fontWeight: 600,
                  fontSize: "12px",
                  textAlign: "center",
                  width: 90,
                  position: "sticky",
                  top: `${groupH}px`,
                  zIndex: 110,
                  padding: 0,
                  height: 30,
                  lineHeight: "30px",
                  backgroundClip: "padding-box",
                  borderRight: "1px solid",
                }}
              >
                {column.headerName}
              </TableCell>
            ))}

            {/* Term2 Sub Headers */}
            {term2Columns.map((column) => (
              <TableCell
                key={column.field}
                sx={{
                  backgroundColor: "#f5f5f5",
                  border: 0,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  fontWeight: 600,
                  fontSize: "12px",
                  textAlign: "center",
                  width: 100,
                  position: "sticky",
                  top: `${groupH}px`,
                  zIndex: 110,
                  height: 30,
                  padding: 0,
                  lineHeight: "30px",
                  backgroundClip: "padding-box",
                  borderRight: "1px solid",
                }}
              >
                {column.headerName}
              </TableCell>
            ))}

            {/* Books Sub Headers */}
            {booksColumns.map((column) => (
              <TableCell
                key={column.field}
                sx={{
                  backgroundColor: "#f5f5f5",
                  border: 0,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  fontWeight: 600,
                  fontSize: "12px",
                  textAlign: "center",
                  width: 100,
                  position: "sticky",
                  top: `${groupH}px`,
                  zIndex: 110,
                  height: 30,
                  padding: 0,
                  lineHeight: "30px",
                  backgroundClip: "padding-box",
                  borderRight: "1px solid",
                }}
              >
                {column.headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className={getRowClassName ? getRowClassName({ row }) : ""}
              sx={{
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                "&.grand-total-row": {
                  backgroundColor: "#f5f5f5",
                  fontWeight: "bold",
                  borderTop: "2px solid",
                  borderColor: "divider",
                  "& .MuiTableCell-root": {
                    fontWeight: "bold",
                    fontSize: "14px",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  },
                },
              }}
            >
              {/* Sr. No. */}
              <TableCell
                sx={{
                  border: 0,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  borderRight: "1px solid",
                  textAlign: "center",
                  width: 60,
                  height: 30,
                  padding: "0 6px",
                }}
              >
                {row.srNo}
              </TableCell>

              {/* Student Name */}
              <TableCell
                sx={{
                  border: 0,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  borderRight: "1px solid",
                  textAlign: "center",
                  width: 280,
                  height: 30,
                  padding: "0 6px",
                }}
              >
                {row.roll_number
                  ? `${row.name} (${row.roll_number})`
                  : row.name}
              </TableCell>

              {/* Term1 Columns */}
              {term1Columns.map((column) => (
                <TableCell
                  key={column.field}
                  sx={{
                    border: 0,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    borderRight: "1px solid",
                    textAlign: "center",
                    width: 90,
                    height: 30,
                    padding: "0 6px",
                  }}
                >
                  {column.renderCell
                    ? column.renderCell({ value: row[column.field], row })
                    : row[column.field]}
                </TableCell>
              ))}

              {/* Term2 Columns */}
              {term2Columns.map((column) => (
                <TableCell
                  key={column.field}
                  sx={{
                    border: 0,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    borderRight: "1px solid",
                    textAlign: "center",
                    width: 100,
                    height: 30,
                    padding: "0 6px",
                  }}
                >
                  {column.renderCell
                    ? column.renderCell({ value: row[column.field], row })
                    : row[column.field]}
                </TableCell>
              ))}

              {/* Books Columns */}
              {booksColumns.map((column) => (
                <TableCell
                  key={column.field}
                  sx={{
                    border: 0,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    borderRight: "1px solid",
                    textAlign: "center",
                    width: 100,
                    height: 30,
                    padding: "0 6px",
                  }}
                >
                  {column.renderCell
                    ? column.renderCell({ value: row[column.field], row })
                    : row[column.field]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FeesReportTable;
