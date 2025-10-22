'use client';

import React, { useMemo, useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
} from "@mui/material";
import {
  Home as HomeIcon,
  People as UsersIcon,
  DirectionsBus as BusFrontIcon,
  Receipt as BookIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  LibraryBooks as LibraryBooksIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import YearSwitcher from "./YearSwitcher";
import BranchSwitcher from "./BranchSwitcher";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const menuItems = [
  { label: "Dashboard", icon: HomeIcon, path: "/dashboard" },
  { label: "Students", icon: UsersIcon, path: "/students" },
  { label: "Classes", icon: LibraryBooksIcon, path: "/classes" },
  { label: "Staff", icon: SettingsIcon, path: "/staff" },
  { label: "Transport", icon: BusFrontIcon, path: "/transport" },
  { label: "Fees", icon: BookIcon, path: "/fees" },
];

const drawerWidth = 250;
const collapsedDrawerWidth = 80;

export default function Sidebar({ username }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const activePath = useMemo(() => {
    if (!pathname) return "";
    const match = menuItems.find((item) => pathname.startsWith(item.path));
    return match?.path || "";
  }, [pathname]);

  const displayName = useMemo(() => {
    if (!username) return "Administrator";
    return username.charAt(0).toUpperCase() + username.slice(1);
  }, [username]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Failed to log out", error);
    } finally {
      router.push("/login");
      router.refresh();
      setIsLoggingOut(false);
    }
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
            Humpty Dumpty Admin Next
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
          <BranchSwitcher inverted />
          <Box sx={{ mt: 2 }}>
            <YearSwitcher compact inverted />
          </Box>
        </Box>
      )}

      <List>
        {menuItems.map(({ label, icon, path }) => {
          const IconComponent = icon;
          return (
            <ListItem key={label} disablePadding sx={{ display: "block" }}>
              <Link href={path} style={{ textDecoration: "none", color: "inherit" }}>
                <ListItemButton
                  selected={activePath === path}
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
                    <IconComponent />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    sx={{ opacity: collapsed ? 0 : 1 }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.12)" }} />
      <Box
        sx={{
          px: collapsed ? 1 : 2,
          pb: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0.5 : 1.5,
        }}
      >
        {collapsed ? null : (
          <Box>
            <Typography variant="body2" sx={{ color: "#f4f4f5" }}>
              {displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: "#a1a1aa" }}>
              Signed in
            </Typography>
          </Box>
        )}
        {collapsed ? (
          <IconButton
            onClick={handleLogout}
            sx={{
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              "&:hover": {
                backgroundColor: "rgba(59, 130, 246, 0.3)",
              },
            }}
            disabled={isLoggingOut}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        ) : (
          <Button
            variant="outlined"
            onClick={handleLogout}
            startIcon={<LogoutIcon fontSize="small" />}
            sx={{
              borderColor: "rgba(255, 255, 255, 0.32)",
              color: "white",
              textTransform: "none",
              "&:hover": {
                borderColor: "rgba(96, 165, 250, 0.85)",
                backgroundColor: "rgba(59, 130, 246, 0.2)",
              },
            }}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </Button>
        )}
      </Box>
      {!collapsed && (
        <Typography
          variant="caption"
          sx={{ px: 2, pb: 2, color: "#a1a1aa", textAlign: "left" }}
        >
          &copy; 2025 Humpty Dumpty Admin Next
        </Typography>
      )}
    </Drawer>
  );
}
