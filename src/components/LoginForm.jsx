'use client';

import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = useMemo(() => {
    const redirectParam = searchParams?.get("next");
    if (!redirectParam) return "/dashboard";
    try {
      const decoded = decodeURIComponent(redirectParam);
      return decoded.startsWith("/") ? decoded : "/dashboard";
    } catch (error) {
      return "/dashboard";
    }
  }, [searchParams]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");
      setIsSubmitting(true);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data?.success) {
          setError(data?.message || "Unable to log in with those credentials.");
          return;
        }

        router.push(nextPath);
        router.refresh();
      } catch (error) {
        console.error("Login request failed", error);
        setError("Network error. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [username, password, router, nextPath]
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, rgba(37, 99, 235, 0.15), transparent 55%), radial-gradient(circle at bottom, rgba(14, 165, 233, 0.12), transparent 45%)",
        padding: 2,
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Paper
          elevation={8}
          sx={{
            padding: 4,
            borderRadius: 4,
            backdropFilter: "blur(20px)",
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            color: "white",
          }}
        >
          <Typography variant="h5" component="h1" fontWeight={600} mb={1}>
            Humpty Dumpty Admin
          </Typography>
          <Typography variant="body2" color="rgba(226, 232, 240, 0.7)" mb={4}>
            Sign in to continue to the admin console.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Username"
              placeholder="admin"
              margin="normal"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={isSubmitting}
              InputLabelProps={{ sx: { color: "rgba(226, 232, 240, 0.8)" } }}
              InputProps={{
                sx: {
                  color: "white",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(226, 232, 240, 0.25)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(59, 130, 246, 0.6)",
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              placeholder="••••••••"
              type="password"
              margin="normal"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              InputLabelProps={{ sx: { color: "rgba(226, 232, 240, 0.8)" } }}
              InputProps={{
                sx: {
                  color: "white",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(226, 232, 240, 0.25)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(59, 130, 246, 0.6)",
                  },
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              sx={{ mt: 3, py: 1.2 }}
              disabled={isSubmitting || !username || !password}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Log In"
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
