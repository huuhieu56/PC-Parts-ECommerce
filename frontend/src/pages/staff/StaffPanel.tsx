/**
 * 🔧 STAFF PANEL - Computer Shop E-commerce
 *
 * Staff dashboard tuân thủ SYSTEM_DESIGN.md
 * - Cho phép staff theo dõi KPI, truy cập nhanh inventory / orders / comments
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
} from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import InventoryIcon from "@mui/icons-material/Inventory";
import CommentIcon from "@mui/icons-material/Comment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReplyIcon from "@mui/icons-material/Reply";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSnackbar } from "../../hooks/useSnackbar";
import { orderService } from "../../services/order.service";
import { productService } from "../../services/product.service";
import { inventoryService } from "../../services/inventory.service";
import { commentService } from "../../services/comment.service";

const COMMENT_PAGE_SIZE = 100;

type JsonRecord = Record<string, unknown>;
type OrderCounters = { pendingOrders: number; processingOrders: number };
type ProductCounters = { lowStock: number; outOfStock: number };
type CommentReplyLike = {
  is_staff_reply?: boolean;
  isStaffReply?: boolean;
} & JsonRecord;
type CommentLike = {
  replies?: CommentReplyLike[];
  is_staff_reply?: boolean;
  isStaffReply?: boolean;
} & JsonRecord;

const isRecord = (v: unknown): v is JsonRecord =>
  typeof v === "object" && v !== null;

const StaffPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showError } = useSnackbar();

  const [statsLoading, setStatsLoading] = useState(true);
  const [kpis, setKpis] = useState({
    pendingOrders: 0,
    processingOrders: 0,
    lowStock: 0,
    outOfStock: 0,
    commentsPending: 0,
  });

  const extractInventoryCount = useCallback((payload: unknown): number => {
    if (Array.isArray(payload)) return payload.length;
    const root: unknown =
      isRecord(payload) && "data" in payload
        ? (payload as JsonRecord)["data"]
        : payload;
    if (Array.isArray(root)) return root.length;
    if (isRecord(root)) {
      const r = root as JsonRecord;
      const items = r["items"];
      if (Array.isArray(items)) return items.length;
      const products = r["products"];
      if (Array.isArray(products)) return products.length;
      const numKeys = [
        "total",
        "totalElements",
        "total_elements",
        "total_products",
        "total_products_count",
        "low_stock_products",
        "low_stock_count",
        "out_of_stock_count",
        "count",
      ];
      for (const k of numKeys) {
        const v = r[k];
        if (typeof v === "number") return v;
      }
    }
    return 0;
  }, []);

  const fetchAllComments = useCallback(async (): Promise<CommentLike[]> => {
    try {
      const firstPage = await commentService
        .getComments({ page: 0, size: COMMENT_PAGE_SIZE })
        .catch(() => null);
      if (!firstPage) {
        return [];
      }

      const normalizedFirst = normalizeCommentPage(firstPage);
      let allComments = [...normalizedFirst.content];

      if (normalizedFirst.totalPages > 1) {
        const pagePromises: Promise<CommentLike[]>[] = [];
        for (let page = 1; page < normalizedFirst.totalPages; page += 1) {
          pagePromises.push(
            commentService
              .getComments({ page, size: COMMENT_PAGE_SIZE })
              .then(
                (response: unknown) =>
                  normalizeCommentPage(response).content as CommentLike[]
              )
              .catch(() => [])
          );
        }

        const remainingPages = await Promise.all(pagePromises);
        remainingPages.forEach((pageContent) => {
          allComments = allComments.concat(pageContent);
        });
      }

      return allComments;
    } catch (error) {
      console.warn("StaffPanel: failed to fetch comments for KPI", error);
      return [];
    }
  }, []);

  const deriveOrderCounters = (orders: Array<JsonRecord>): OrderCounters => {
    return orders.reduce<OrderCounters>(
      (acc, order) => {
        const status = String(
          order["status"] ?? order["status_code"] ?? ""
        ).toUpperCase();
        if (status === "PENDING") acc.pendingOrders += 1;
        else if (status === "PROCESSING" || status === "CONFIRMED")
          acc.processingOrders += 1;
        return acc;
      },
      { pendingOrders: 0, processingOrders: 0 }
    );
  };
  const getOrderCounters = useCallback(async (): Promise<OrderCounters> => {
    try {
      const statsResponse = await orderService.getOrderStats();
      const statsValues = Object.values(statsResponse ?? {});
      const hasServerStats = statsValues.some((value) => Number(value) > 0);
      if (hasServerStats) {
        const statsAny = statsResponse as JsonRecord;
        return {
          pendingOrders: Number(
            (statsAny["pending_orders"] ??
              statsAny["pendingOrders"] ??
              0) as number
          ),
          processingOrders: Number(
            (statsAny["processing_orders"] ??
              statsAny["processingOrders"] ??
              0) as number
          ),
        };
      }
    } catch (error) {
      console.warn(
        "StaffPanel: order stats endpoint unavailable, falling back to list data",
        error
      );
    }

    try {
      const fallbackOrders = await orderService.getOrders({
        page: 0,
        size: 200,
        sort: "updatedAt,desc",
      });
      return deriveOrderCounters(
        ((fallbackOrders as JsonRecord).content as JsonRecord[]) ?? []
      );
    } catch (error) {
      console.warn("StaffPanel: fallback order list failed", error);
      return { pendingOrders: 0, processingOrders: 0 };
    }
  }, []);

  const getProductCounters = useCallback(async (): Promise<ProductCounters> => {
    const fetchCount = async (stockStatus?: "low_stock" | "out_of_stock") => {
      try {
        const response = await productService.getManagementProducts({
          page: 0,
          size: 1,
          stockStatus,
        });
        return extractInventoryCount(response);
      } catch (error) {
        console.warn("StaffPanel: product management endpoint failed", error);
        return null;
      }
    };

    let [lowStockCount, outOfStockCount] = await Promise.all([
      fetchCount("low_stock"),
      fetchCount("out_of_stock"),
    ]);

    if (lowStockCount === null) {
      const summary = await inventoryService.getLowStock(10);
      lowStockCount = extractInventoryCount(summary);
    }
    if (outOfStockCount === null) {
      try {
        const outOfStock = await inventoryService.getOutOfStock();
        outOfStockCount = extractInventoryCount(outOfStock);
      } catch (error) {
        console.warn(
          "StaffPanel: failed to load out-of-stock inventory",
          error
        );
        outOfStockCount = 0;
      }
    }

    return {
      lowStock: Number(lowStockCount ?? 0),
      outOfStock: Number(outOfStockCount ?? 0),
    };
  }, [extractInventoryCount]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [orderCounters, productCounters, comments] = await Promise.all([
        getOrderCounters(),
        getProductCounters(),
        fetchAllComments(),
      ] as const);
      const safeOrderCounters: OrderCounters = orderCounters || {
        pendingOrders: 0,
        processingOrders: 0,
      };
      const safeProductCounters: ProductCounters = productCounters || {
        lowStock: 0,
        outOfStock: 0,
      };

      const commentsPending = comments.filter(
        (comment) => !hasStaffReply(comment)
      ).length;

      setKpis({
        pendingOrders: safeOrderCounters.pendingOrders,
        processingOrders: safeOrderCounters.processingOrders,
        lowStock: safeProductCounters.lowStock,
        outOfStock: safeProductCounters.outOfStock,
        commentsPending,
      });
    } catch {
      showError("Không thể tải dữ liệu dashboard nhân viên");
    } finally {
      setStatsLoading(false);
    }
  }, [fetchAllComments, getOrderCounters, getProductCounters, showError]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("StaffPanel: logout failed", error);
    }
  };

  // Đã loại bỏ khu vực "Công cụ vận hành nhanh" theo yêu cầu

  const statCards = useMemo(
    () => [
      {
        title: "Đơn hàng chờ xử lý",
        value: kpis.pendingOrders,
        description: "Chờ xác nhận hoặc phân công",
        icon: <PendingActionsIcon color="warning" sx={{ fontSize: 32 }} />,
        color: "warning.main",
        actionLabel: "Xem đơn hàng",
        action: () => navigate("/staff/orders"),
      },
      {
        title: "Đơn hàng đang xử lý",
        value: kpis.processingOrders,
        description: "Đang đóng gói / vận chuyển",
        icon: <AssignmentTurnedInIcon color="info" sx={{ fontSize: 32 }} />,
        color: "info.main",
        actionLabel: "Quản lý đơn hàng",
        action: () => navigate("/staff/orders"),
      },
      {
        title: "Sản phẩm sắp hết",
        value: kpis.lowStock,
        description: "Cảnh báo tồn kho thấp",
        icon: <InventoryIcon color="warning" sx={{ fontSize: 32 }} />,
        color: "warning.dark",
        actionLabel: "Xem kho",
        action: () => navigate("/staff/inventory"),
      },
      {
        title: "Sản phẩm đã hết hàng",
        value: kpis.outOfStock,
        description: "Cần nhập hàng gấp",
        icon: <ErrorOutlineIcon color="error" sx={{ fontSize: 32 }} />,
        color: "error.main",
        actionLabel: "Lập kế hoạch nhập",
        action: () => navigate("/staff/inventory"),
      },
      {
        title: "Bình luận chờ phản hồi",
        value: kpis.commentsPending,
        description: "Ưu tiên trả lời khách",
        icon: <CommentIcon color="primary" sx={{ fontSize: 32 }} />,
        color: "primary.main",
        actionLabel: "Trả lời ngay",
        action: () => navigate("/staff/comments"),
      },
    ],
    [kpis, navigate]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Card
        elevation={1}
        sx={{
          p: 3,
          mb: 3,
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <WorkIcon color="secondary" />
              <Typography variant="overline">Staff dashboard</Typography>
            </Stack>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              Xin chào, {user?.full_name || user?.username || "Staff"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Tổng quan nhanh cho nhân viên vận hành: kho hàng, đơn hàng và bình
              luận khách.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
              <Chip
                label="STAFF"
                size="small"
                color="secondary"
                variant="outlined"
              />
              <Chip label="Inventory" size="small" variant="outlined" />
              <Chip label="Orders" size="small" variant="outlined" />
              <Chip label="Comments" size="small" variant="outlined" />
            </Stack>
          </Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            width={{ xs: "100%", md: "auto" }}
          >
            <Button
              fullWidth
              variant="contained"
              startIcon={<StorefrontIcon />}
              component={RouterLink}
              to="/"
            >
              Về trang cửa hàng
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LogoutRoundedIcon />}
              onClick={handleLogout}
              color="error"
            >
              Đăng xuất
            </Button>
          </Stack>
        </Stack>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              elevation={1}
              sx={{
                height: "100%",
                borderRadius: 3,
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  {card.icon}
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      {card.title}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: card.color }}
                    >
                      {statsLoading ? "—" : card.value}
                    </Typography>
                  </Box>
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1.5, mb: 2 }}
                >
                  {card.description}
                </Typography>
                <Button size="small" onClick={card.action}>
                  {card.actionLabel}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Khu vực "Công cụ vận hành nhanh" đã được xóa */}

      <Card elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Quyền hạn hiện có
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Tài khoản staff có thể xem kho, xử lý đơn và hỗ trợ khách qua bình
          luận. Liên hệ quản trị nếu cần thêm quyền.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" spacing={1.5}>
              <VisibilityIcon color="success" />
              <Box>
                <Typography variant="subtitle2">Xem tồn kho</Typography>
                <Typography variant="body2" color="text.secondary">
                  Truy xuất số lượng, tình trạng sản phẩm và lịch sử nhập.
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" spacing={1.5}>
              <PendingActionsIcon color="info" />
              <Box>
                <Typography variant="subtitle2">Quản lý đơn hàng</Typography>
                <Typography variant="body2" color="text.secondary">
                  Theo dõi trạng thái đơn, cập nhật ghi chú nội bộ.
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" spacing={1.5}>
              <ReplyIcon color="primary" />
              <Box>
                <Typography variant="subtitle2">Phản hồi bình luận</Typography>
                <Typography variant="body2" color="text.secondary">
                  Trả lời khách hàng với template chuẩn hỗ trợ.
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};
const normalizeCommentPage = (
  raw: unknown
): { content: CommentLike[]; totalPages: number; totalElements: number } => {
  const data: unknown =
    isRecord(raw) && "data" in raw ? (raw as JsonRecord)["data"] : raw;
  const content: CommentLike[] = Array.isArray(
    isRecord(data) ? (data as JsonRecord)["content"] : undefined
  )
    ? ((isRecord(data)
        ? (data as JsonRecord)["content"]
        : undefined) as CommentLike[])
    : Array.isArray(data)
    ? (data as CommentLike[])
    : [];
  const totalPages =
    isRecord(data) && typeof (data as JsonRecord)["total_pages"] === "number"
      ? ((data as JsonRecord)["total_pages"] as number)
      : isRecord(data) && typeof (data as JsonRecord)["totalPages"] === "number"
      ? ((data as JsonRecord)["totalPages"] as number)
      : 1;
  const totalElements =
    isRecord(data) && typeof (data as JsonRecord)["total_elements"] === "number"
      ? ((data as JsonRecord)["total_elements"] as number)
      : isRecord(data) &&
        typeof (data as JsonRecord)["totalElements"] === "number"
      ? ((data as JsonRecord)["totalElements"] as number)
      : content.length;
  return { content, totalPages, totalElements };
};

const hasStaffReply = (comment: CommentLike): boolean => {
  const replies: CommentReplyLike[] = Array.isArray(comment?.replies)
    ? (comment.replies as CommentReplyLike[])
    : [];
  if (replies.length > 0) {
    return replies.some((reply: CommentReplyLike) =>
      Boolean(reply?.is_staff_reply ?? reply?.isStaffReply)
    );
  }
  return Boolean(comment?.is_staff_reply ?? comment?.isStaffReply ?? false);
};

export default StaffPanel;
