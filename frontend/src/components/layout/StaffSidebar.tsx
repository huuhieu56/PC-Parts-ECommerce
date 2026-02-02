import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CommentIcon from "@mui/icons-material/Comment";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { logoutUser } from "../../store/slices/authSlice";
import type { AuthState } from "../../types/auth.types";

interface StaffSidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: "temporary" | "permanent" | "persistent";
  anchor?: "left" | "right";
}

interface SidebarItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  roles?: string[];
}

const SIDEBAR_WIDTH = 280;

export const StaffSidebar: React.FC<StaffSidebarProps> = ({
  open,
  onClose,
  variant = "temporary",
  anchor = "left",
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth) as AuthState;
  const userRoles = user?.role ? [user.role] : [];
  const hasRole = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return roles.some((role) => userRoles.includes(role));
  };

  const items: SidebarItem[] = [
    {
      text: "Bảng điều khiển",
      icon: <DashboardIcon />,
      path: "/staff",
      roles: ["STAFF", "ADMIN"],
    },
    {
      text: "Kho hàng",
      icon: <InventoryIcon />,
      path: "/staff/inventory",
      roles: ["STAFF", "ADMIN"],
    },
    {
      text: "Đơn hàng",
      icon: <ShoppingCartIcon />,
      path: "/staff/orders",
      roles: ["STAFF", "ADMIN"],
    },
    {
      text: "Bình luận",
      icon: <CommentIcon />,
      path: "/staff/comments",
      roles: ["STAFF", "ADMIN"],
    },
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
    if (variant === "temporary") onClose();
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
    onClose();
  };

  const isItemActive = (path: string) => {
    if (path === "/staff") {
      // Dashboard should only be active on exact '/staff'
      return location.pathname === "/staff" || location.pathname === "/staff/";
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const drawerContent = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          p: 2,
          backgroundImage: `linear-gradient(135deg, ${alpha(
            theme.palette.secondary.main,
            0.92
          )}, ${alpha(theme.palette.secondary.dark, 0.92)})`,
          color: theme.palette.secondary.contrastText,
          minHeight: 64,
          display: "flex",
          alignItems: "center",
          fontWeight: 700,
          letterSpacing: 0.4,
        }}
      >
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ fontWeight: 800 }}
        >
          Nhân viên
        </Typography>
      </Box>

      <Divider />

      {user && (
        <Box sx={{ p: 2, bgcolor: theme.palette.grey[50] }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Xin chào,
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {user.full_name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {String(user.role).toUpperCase()}
          </Typography>
        </Box>
      )}

      <Divider />

      <List sx={{ pt: 1, flexGrow: 1 }}>
        {items
          .filter((i) => hasRole(i.roles))
          .map((item) => {
            const active = isItemActive(item.path);
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  onClick={() => handleItemClick(item.path)}
                  selected={active}
                  sx={{
                    "&.Mui-selected": {
                      bgcolor: theme.palette.secondary.main + "20",
                      borderLeft:
                        anchor === "left"
                          ? `3px solid ${theme.palette.secondary.main}`
                          : undefined,
                      borderRight:
                        anchor === "right"
                          ? `3px solid ${theme.palette.secondary.main}`
                          : undefined,
                      "& .MuiListItemIcon-root": {
                        color: theme.palette.secondary.main,
                      },
                      "& .MuiListItemText-primary": {
                        color: theme.palette.secondary.main,
                        fontWeight: 600,
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: active
                        ? theme.palette.secondary.main
                        : theme.palette.text.secondary,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          })}
      </List>

      <Divider />

      <List sx={{ mt: "auto" }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.08) },
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.error.main }}>
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText
              primary="Đăng xuất"
              primaryTypographyProps={{ fontWeight: 600 }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      anchor={anchor}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        "& .MuiDrawer-paper": {
          width: SIDEBAR_WIDTH,
          boxSizing: "border-box",
          borderLeft:
            anchor === "right"
              ? `1px solid ${theme.palette.divider}`
              : undefined,
          borderRight:
            anchor === "left"
              ? `1px solid ${theme.palette.divider}`
              : undefined,
          background: theme.palette.background.paper,
          backdropFilter: "blur(8px)",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default StaffSidebar;
