import React from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useYear } from "../context/YearProvider.jsx";

export default function YearSwitcher({ compact = false, inverted = false }) {
  const { years, selected, setActiveYear } = useYear();

  const handleChange = async (e) => {
    const id = e.target.value;
    await setActiveYear(id);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <FormControl fullWidth variant="outlined" size={compact ? "small" : "medium"}>
        <InputLabel id="year-select-label" sx={{ color: inverted ? "#a1a1aa" : undefined }}>
          Academic Year
        </InputLabel>
        <Select
          labelId="year-select-label"
          value={selected?.id || ""}
          onChange={handleChange}
          label="Academic Year"
          sx={{
            ...(inverted
              ? {
                  color: "white",
                  ".MuiOutlinedInput-notchedOutline": { borderColor: "#3f3f46" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#52525b" },
                  ".MuiSvgIcon-root": { color: "white" },
                }
              : {}),
          }}
       >
          {years.map((y) => (
            <MenuItem key={y.id} value={y.id}>
              {y.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
