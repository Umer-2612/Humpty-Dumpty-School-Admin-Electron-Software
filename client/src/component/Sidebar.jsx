import React, { useState } from "react";
import { useBranch } from "../context/useBranch";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Home as HomeIcon,
  People as UsersIcon,
  School as SchoolIcon,
  DirectionsBus as BusFrontIcon,
  Receipt as BookIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  LibraryBooks as LibraryBooksIcon,
} from "@mui/icons-material";
import YearSwitcher from "./YearSwitcher";

const menuItems = [
  { label: "Dashboard", icon: HomeIcon },
  { label: "Students", icon: UsersIcon },
  { label: "Academic Settings", icon: LibraryBooksIcon },
  { label: "Staff", icon: SettingsIcon },
  { label: "Transport", icon: BusFrontIcon },
  { label: "Fees", icon: BookIcon },
];

const drawerWidth = 250;
const collapsedDrawerWidth = 80;

export default function Sidebar({ activePage, setActivePage }) {
  const { branches, selected, setSelected } = useBranch();
  const [collapsed, setCollapsed] = useState(false);

  const handleBranchChange = (event) => {
    const branchId = event.target.value;
    const branch = branches.find((b) => b.id === branchId);
    setSelected(branch);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? collapsedDrawerWidth : drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: collapsed ? collapsedDrawerWidth : drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#18181b", // zinc-900
          color: "white",
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          overflowX: "hidden",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
        }}
      >
        {!collapsed && (
          <Typography variant="h6" noWrap component="div">
            Humpty Dumpty
          </Typography>
        )}
        <IconButton
          onClick={() => setCollapsed(!collapsed)}
          sx={{ color: "white" }}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.12)" }} />

      {!collapsed && (
        <Box sx={{ p: 2 }}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="branch-select-label" sx={{ color: "#a1a1aa" }}>
              Branch
            </InputLabel>
            <Select
              labelId="branch-select-label"
              value={selected?.id || ""}
              onChange={handleBranchChange}
              label="Branch"
              sx={{
                color: "white",
                ".MuiOutlinedInput-notchedOutline": {
                  borderColor: "#3f3f46",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#52525b",
                },
                ".MuiSvgIcon-root": { color: "white" },
              }}
            >
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <YearSwitcher compact inverted />
          </Box>
        </Box>
      )}

      <List>
        {menuItems.map(({ label, icon: Icon }) => (
          <ListItem key={label} disablePadding sx={{ display: "block" }}>
            <ListItemButton
              selected={activePage === label}
              onClick={() => setActivePage(label)}
              sx={{
                minHeight: 48,
                justifyContent: collapsed ? "center" : "initial",
                px: 2.5,
                mx: 2,
                borderRadius: 1,
                "&.Mui-selected": {
                  backgroundColor: "#2563eb", // blue-600
                  "&:hover": {
                    backgroundColor: "#1d4ed8", // blue-700
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? "auto" : 3,
                  justifyContent: "center",
                  color: "inherit",
                }}
              >
                <Icon />
              </ListItemIcon>
              <ListItemText
                primary={label}
                sx={{ opacity: collapsed ? 0 : 1 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {!collapsed && (
        <>
          <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.12)" }} />
          <Typography variant="caption" sx={{ p: 2, color: "#a1a1aa" }}>
            &copy; 2025 Humpty Dumpty School
          </Typography>
        </>
      )}
    </Drawer>
  );
}
