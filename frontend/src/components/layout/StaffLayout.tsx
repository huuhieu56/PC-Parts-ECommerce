import React, { useState } from "react";
import { Box, useTheme, useMediaQuery, alpha } from "@mui/material";
import { Outlet } from "react-router-dom";
const StaffSidebar = React.lazy(() =>
  import("./StaffSidebar").then((m) => ({ default: m.StaffSidebar }))
);
import { Breadcrumbs } from "./Breadcrumbs";

interface StaffLayoutProps {
  children?: React.ReactNode;
  showBreadcrumbs?: boolean;
  anchor?: "left" | "right";
}

const DRAWER_WIDTH = 280;

export const StaffLayout: React.FC<StaffLayoutProps> = ({
  children,
  showBreadcrumbs = true,
  anchor = "left",
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleSidebarToggle = () => setSidebarOpen((s) => !s);
  const handleSidebarClose = () => setSidebarOpen(false);

  const marginStyle =
    anchor === "right"
      ? { mr: { md: sidebarOpen ? `${DRAWER_WIDTH}px` : 0 } }
      : { ml: { md: sidebarOpen ? `${DRAWER_WIDTH}px` : 0 } };
  const widthStyle = {
    md: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : "100%",
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundImage: `linear-gradient(135deg, ${alpha(
            theme.palette.secondary.main,
            0.92
          )}, ${alpha(theme.palette.secondary.dark, 0.92)})`,
          color: theme.palette.common.white,
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
          boxShadow: theme.shadows[2],
          zIndex: theme.zIndex.appBar,
          display: "flex",
          alignItems: "center",
          px: 2,
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            component="button"
            onClick={handleSidebarToggle}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
            aria-label="mở/đóng sidebar"
          >
            <Box
              component="span"
              sx={{ color: "inherit", fontSize: 22, lineHeight: 1 }}
            >
              ☰
            </Box>
          </Box>
          <Box
            component="span"
            sx={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: 0.3 }}
          >
            Computer Shop - Staff
          </Box>
        </Box>
        <Box />
      </Box>

      {/* Sidebar */}
      <React.Suspense fallback={null}>
        <StaffSidebar
          open={sidebarOpen}
          onClose={handleSidebarClose}
          variant={isMobile ? "temporary" : "persistent"}
          anchor={anchor}
        />
      </React.Suspense>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          width: widthStyle,
          ...marginStyle,
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginTop: "64px",
          bgcolor: "background.default",
        }}
      >
        {showBreadcrumbs && (
          <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 1 }}>
            <Breadcrumbs />
          </Box>
        )}

        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 } }}>
          {children || <Outlet />}
        </Box>
      </Box>
    </Box>
  );
};

export default StaffLayout;
