'use client';

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Layers as LayersIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useBranch } from "@/context/useBranch";

const highlights = [
  {
    icon: BusinessIcon,
    title: "Set your foundation",
    description: "Branches help you split operations by campus or location.",
  },
  {
    icon: LayersIcon,
    title: "Tailored structure",
    description: "Classes, staff, transport, and fees are organised per branch.",
  },
  {
    icon: TrendingUpIcon,
    title: "Ready for growth",
    description: "Add more branches later without disrupting daily work.",
  },
];

export default function BranchOnboarding() {
  const router = useRouter();
  const { addBranch, loadBranches } = useBranch();

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Branch name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const branch = await addBranch({ name: trimmed });
      await loadBranches({ forceSelectId: branch?.id });
      router.push("/dashboard");
      router.refresh();
    } catch (createError) {
      console.error("Failed to create branch", createError);
      const message =
        createError?.message ||
        "We couldn't create the branch right now. Please try again.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 6, md: 10 },
        px: 3,
        display: "flex",
        alignItems: "center",
        background:
          "radial-gradient(circle at 15% 20%, rgba(37, 99, 235, 0.25), transparent 45%), radial-gradient(circle at 85% 30%, rgba(14, 165, 233, 0.22), transparent 40%), linear-gradient(135deg, #0f172a 0%, #111827 45%, #020617 100%)",
      }}
    >
      <Container maxWidth="lg" sx={{ color: "white" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 5, md: 6 }}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Stack spacing={3} maxWidth={{ xs: "100%", md: 420 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(14, 165, 233, 0.75))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SchoolIcon fontSize="medium" sx={{ color: "white" }} />
              </Box>
              <Typography variant="h5" fontWeight={600}>
                Welcome to Humpty Dumpty Admin
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={700} lineHeight={1.1}>
              Let&apos;s configure your first branch
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "rgba(226, 232, 240, 0.8)", maxWidth: 420 }}
            >
              You need at least one branch before exploring dashboards, fees,
              and transport. We&apos;ll use it everywhere to keep your data
              organised.
            </Typography>

            <Stack spacing={2.5}>
              {highlights.map(({ icon: Icon, title, description }) => (
                <Box
                  key={title}
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "flex-start",
                    backgroundColor: "rgba(30, 41, 59, 0.45)",
                    borderRadius: 3,
                    padding: 2,
                    backdropFilter: "blur(18px)",
                    border: "1px solid rgba(148, 163, 184, 0.15)",
                  }}
                >
                  <Icon sx={{ color: "rgba(96, 165, 250, 0.9)", mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(226, 232, 240, 0.7)" }}
                    >
                      {description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Stack>

          <Card
            elevation={24}
            sx={{
              backdropFilter: "blur(30px)",
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              borderRadius: 4,
              border: "1px solid rgba(148, 163, 184, 0.15)",
              flexGrow: 1,
              maxWidth: 420,
            }}
          >
            <CardContent
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              <Box>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Create your branch
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(226, 232, 240, 0.7)" }}
                >
                  Give your location a friendly, recognisable name. You can add
                  more later from the branch switcher.
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" onClose={() => setError("")}>
                  {error}
                </Alert>
              )}

              <TextField
                label="Branch name"
                placeholder="e.g. Downtown Campus"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
                disabled={isSubmitting}
                fullWidth
                InputLabelProps={{
                  sx: { color: "rgba(226, 232, 240, 0.85)" },
                }}
                InputProps={{
                  sx: {
                    color: "white",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(148, 163, 184, 0.35)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(96, 165, 250, 0.65)",
                    },
                  },
                }}
              />

              <Button
                variant="contained"
                size="large"
                type="submit"
                disabled={isSubmitting}
                sx={{
                  py: 1.4,
                  fontWeight: 600,
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #1d4ed8 65%, #0ea5e9 100%)",
                  boxShadow:
                    "0 22px 45px -20px rgba(37, 99, 235, 0.55), 0 10px 25px -15px rgba(14, 165, 233, 0.65)",
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Create branch and continue"
                )}
              </Button>

              <Divider
                sx={{
                  borderColor: "rgba(148, 163, 184, 0.15)",
                  my: 1,
                }}
              />

              <Typography
                variant="caption"
                sx={{ color: "rgba(226, 232, 240, 0.6)" }}
              >
                Need multiple branches? No problem — once this is saved you can
                duplicate settings for new locations in a few clicks.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
