import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Drawer,
    IconButton,
    InputAdornment,
    Pagination,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    BookmarkAddOutlined as BookmarkAddIcon,
    BookmarkAdded as BookmarkAddedIcon,
    ChatBubbleOutline as ChatBubbleOutlineIcon,
    Close as CloseIcon,
    Comment as CommentIcon,
    DoneAll as DoneAllIcon,
    FilterList as FilterListIcon,
    OpenInNew as OpenInNewIcon,
    Refresh as RefreshIcon,
    Reply as ReplyIcon,
    Search as SearchIcon,
    Send as SendIcon,
    WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { useDebounce } from '../../../hooks/useDebounce';
import commentService from '../../../services/comment.service';
import { productService } from '../../../services/product.service';
import type { CommentResponse as ApiCommentResponse } from '../../../types/comment.types';
import type { Product } from '../../../types/product.types';

const PAGE_SIZE = 10;
const PIN_STORAGE_KEY = 'staff_comment_pins';
const QUICK_REPLIES: string[] = [
    'Cảm ơn bạn đã phản hồi! Đội ngũ kỹ thuật đang kiểm tra và sẽ thông báo sớm nhất.',
    'Rất tiếc về trải nghiệm chưa tốt. Bạn vui lòng cung cấp thêm ảnh/video để chúng tôi hỗ trợ nhanh hơn nhé.',
    'Sản phẩm hiện còn hàng tại kho trung tâm. Chúng tôi sẽ cập nhật thời gian giao dự kiến ngay sau khi xác nhận.',
];

type ApiComment = ApiCommentResponse & {
    user_id?: number;
    full_name?: string;
    product_id?: number;
    parent_comment_id?: number | null;
    is_staff_reply?: boolean;
    created_at?: string;
    updated_at?: string;
    replies?: ApiComment[];
};

type ModerationReply = {
    id: number;
    content: string;
    authorName: string;
    createdAt?: string;
    isStaffReply: boolean;
};

type ModerationComment = {
    id: number;
    content: string;
    customerName: string;
    customerId?: number;
    productId?: number;
    createdAt?: string;
    updatedAt?: string;
    replies: ModerationReply[];
    hasStaffReply: boolean;
    lastStaffReplyAt?: string;
};

type NormalizedPage<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
};

const normalizePage = (raw: any): NormalizedPage<ApiComment> => {
    const data = raw?.data ?? raw;
    const content = Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data)
            ? data
            : [];
    const totalElements = data?.total_elements ?? data?.totalElements ?? content.length;
    const totalPages = data?.total_pages ?? data?.totalPages ?? 1;
    const pageNumber = data?.page_number ?? data?.pageNumber ?? 0;
    const pageSize = data?.page_size ?? data?.pageSize ?? (content.length || PAGE_SIZE);
    return {
        content,
        totalElements: Number(totalElements ?? content.length ?? 0),
        totalPages: Math.max(1, Number(totalPages ?? 1)),
        pageNumber: Number(pageNumber ?? 0),
        pageSize: Number(pageSize ?? PAGE_SIZE),
    };
};

const normalizeReply = (raw: ApiComment | ModerationReply): ModerationReply => ({
    id: Number(raw?.id ?? 0),
    content: raw?.content ?? '',
    authorName: (raw as any)?.full_name ?? (raw as any)?.fullName ?? 'Người dùng',
    createdAt: (raw as any)?.created_at ?? (raw as any)?.createdAt,
    isStaffReply: Boolean((raw as any)?.is_staff_reply ?? (raw as any)?.isStaffReply ?? false),
});

const normalizeComment = (raw: ApiComment): ModerationComment => {
    const replies = Array.isArray(raw?.replies)
        ? raw.replies
            .map(normalizeReply)
            .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime())
        : [];
    const staffReplies = replies.filter((reply) => reply.isStaffReply);
    const lastStaffReplyAt = staffReplies.length > 0 ? staffReplies[staffReplies.length - 1].createdAt : undefined;
    return {
        id: Number(raw?.id ?? 0),
        content: raw?.content ?? '',
        customerName: raw?.full_name ?? (raw as any)?.fullName ?? 'Ẩn danh',
        customerId: raw?.user_id ?? (raw as any)?.userId,
        productId: raw?.product_id ?? (raw as any)?.productId,
        createdAt: raw?.created_at ?? (raw as any)?.createdAt,
        updatedAt: raw?.updated_at ?? (raw as any)?.updatedAt,
        replies,
        hasStaffReply: staffReplies.length > 0,
        lastStaffReplyAt,
    };
};

const formatDateTime = (value?: string): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('vi-VN');
};

const formatCurrency = (value?: number | null): string => {
    if (value == null) return '—';
    try {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    } catch {
        return `${value.toLocaleString('vi-VN')} ₫`;
    }
};

const StaffCommentsResponseCenter: React.FC = () => {
    const { showError, showSuccess } = useSnackbar();
    const [comments, setComments] = useState<ModerationComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'responded' | 'pinned'>('pending');
    const [search, setSearch] = useState('');
    const [selectedComment, setSelectedComment] = useState<ModerationComment | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replyLoading, setReplyLoading] = useState(false);
    const [productCache, setProductCache] = useState<Record<number, Product | null>>({});
    const [productLoading, setProductLoading] = useState(false);
    const [pinnedIds, setPinnedIds] = useState<Set<number>>(() => {
        try {
            const stored = localStorage.getItem(PIN_STORAGE_KEY);
            if (!stored) return new Set();
            const parsed: number[] = JSON.parse(stored);
            return new Set(parsed);
        } catch {
            return new Set();
        }
    });

    const debouncedKeyword = useDebounce(search.trim().toLowerCase(), 400);

    const persistPinned = (next: Set<number>) => {
        try {
            localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(Array.from(next)));
        } catch (error) {
            console.warn('Không thể lưu danh sách ưu tiên vào localStorage', error);
        }
    };

    const loadComments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await commentService.getComments({ page, size: PAGE_SIZE });
            const normalized = normalizePage(response);
            setComments(normalized.content.map(normalizeComment));
            setTotalElements(normalized.totalElements);
            setTotalPages(normalized.totalPages);
        } catch (error: any) {
            const message = error?.message || error?.data?.message || 'Không thể tải danh sách bình luận';
            showError(message);
            setComments([]);
            setTotalElements(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [page, showError]);

    useEffect(() => {
        loadComments();
    }, [loadComments]);

    useEffect(() => {
        const productId = selectedComment?.productId;
        if (!productId) return;
        if (productCache[productId] !== undefined) return;
        let active = true;
        setProductLoading(true);
        productService.getProductById(productId)
            .then((product) => {
                if (!active) return;
                setProductCache((prev) => ({ ...prev, [productId]: product }));
            })
            .catch((error: any) => {
                if (!active) return;
                const message = error?.message || error?.data?.message || 'Không thể tải thông tin sản phẩm';
                showError(message);
                setProductCache((prev) => ({ ...prev, [productId]: null }));
            })
            .finally(() => {
                if (active) setProductLoading(false);
            });
        return () => {
            active = false;
        };
    }, [productCache, selectedComment?.productId, showError]);

    const togglePinned = (id: number) => {
        setPinnedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            persistPinned(next);
            return next;
        });
    };

    const filteredComments = useMemo(() => {
        const keyword = debouncedKeyword;
        const filtered = comments.filter((comment) => {
            if (statusFilter === 'pending' && comment.hasStaffReply) return false;
            if (statusFilter === 'responded' && !comment.hasStaffReply) return false;
            if (statusFilter === 'pinned' && !pinnedIds.has(comment.id)) return false;
            if (keyword) {
                const target = `${comment.content} ${comment.customerName} ${comment.productId ?? ''}`.toLowerCase();
                if (!target.includes(keyword)) return false;
            }
            return true;
        });

        return filtered.sort((a, b) => {
            const aPinned = pinnedIds.has(a.id);
            const bPinned = pinnedIds.has(b.id);
            if (aPinned !== bPinned) return aPinned ? -1 : 1;
            const aTime = new Date(a.createdAt ?? 0).getTime();
            const bTime = new Date(b.createdAt ?? 0).getTime();
            return bTime - aTime;
        });
    }, [comments, debouncedKeyword, pinnedIds, statusFilter]);

    const stats = useMemo(() => {
        const total = comments.length;
        const pending = comments.filter((comment) => !comment.hasStaffReply).length;
        const responded = comments.filter((comment) => comment.hasStaffReply).length;
        const pinned = comments.filter((comment) => pinnedIds.has(comment.id)).length;
        return { total, pending, responded, pinned };
    }, [comments, pinnedIds]);

    const handleOpenDetail = (comment: ModerationComment) => {
        setSelectedComment(comment);
        setReplyContent('');
    };

    const handleCloseDetail = () => {
        setSelectedComment(null);
        setReplyContent('');
    };

    const refreshSingleComment = useCallback(async (commentId: number) => {
        try {
            const detail = await commentService.getCommentById(commentId);
            const payload = (detail as any)?.data ?? detail;
            const normalized = normalizeComment(payload as ApiComment);
            setSelectedComment(normalized);
        } catch (error: any) {
            const message = error?.message || 'Không thể tải chi tiết bình luận sau khi phản hồi';
            showError(message);
        }
    }, [showError]);

    const handleReplySubmit = async () => {
        if (!selectedComment) return;
        const content = replyContent.trim();
        if (!content) {
            showError('Vui lòng nhập nội dung phản hồi');
            return;
        }
        setReplyLoading(true);
        try {
            await commentService.replyComment(selectedComment.id, { content });
            showSuccess('Đã gửi phản hồi tới khách hàng');
            setReplyContent('');
            await refreshSingleComment(selectedComment.id);
            await loadComments();
        } catch (error: any) {
            const message = error?.message || error?.data?.message || 'Không thể gửi phản hồi';
            showError(message);
        } finally {
            setReplyLoading(false);
        }
    };

    const insertQuickReply = (template: string) => {
        setReplyContent((prev) => {
            if (!prev) return template;
            return `${prev}\n${template}`;
        });
    };

    const handleRefresh = () => {
        loadComments();
    };

    const currentProduct = useMemo(() => {
        if (!selectedComment?.productId) return undefined;
        return productCache[selectedComment.productId];
    }, [productCache, selectedComment?.productId]);

    return (
        <Box sx={{ py: 4, px: { xs: 1, md: 3 }, maxWidth: '1400px', mx: 'auto' }}>
            <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" fontWeight={800} gutterBottom>
                            Trả lời bình luận sản phẩm
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Theo dõi phản hồi của khách hàng và trả lời nhanh chóng để nâng cao trải nghiệm dịch vụ.
                        </Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Tìm theo tên khách, nội dung, mã sản phẩm..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
                            Làm mới
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            <GridStats stats={stats} />

            <Paper sx={{ p: 2, mt: 3, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <FilterListIcon fontSize="small" />
                        <Typography variant="subtitle2" color="text.secondary">
                            Bộ lọc nhanh
                        </Typography>
                    </Stack>
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={statusFilter}
                        onChange={(_, value) => value && setStatusFilter(value)}
                        aria-label="comment status filter"
                        sx={{ flexWrap: 'wrap' }}
                    >
                        <ToggleButton value="all">Tất cả</ToggleButton>
                        <ToggleButton value="pending">Chờ phản hồi</ToggleButton>
                        <ToggleButton value="responded">Đã phản hồi</ToggleButton>
                        <ToggleButton value="pinned">Ưu tiên</ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
            </Paper>

            <Paper sx={{ mt: 3, borderRadius: 3 }}>
                {loading && (
                    <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loading && filteredComments.length === 0 && (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Không tìm thấy bình luận phù hợp
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Thay đổi bộ lọc hoặc chuyển sang trang khác để xem thêm kết quả.
                        </Typography>
                    </Box>
                )}

                {!loading && filteredComments.length > 0 && (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell width="5%">#</TableCell>
                                    <TableCell width="18%">Khách hàng</TableCell>
                                    <TableCell>Nội dung</TableCell>
                                    <TableCell width="12%">Sản phẩm</TableCell>
                                    <TableCell width="12%">Trạng thái</TableCell>
                                    <TableCell width="12%" align="center">Phản hồi</TableCell>
                                    <TableCell width="14%">Thời gian</TableCell>
                                    <TableCell width="10%" align="right">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredComments.map((comment) => (
                                    <TableRow key={comment.id} hover>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Tooltip title={pinnedIds.has(comment.id) ? 'Bỏ ưu tiên' : 'Đánh dấu ưu tiên'}>
                                                    <IconButton size="small" onClick={() => togglePinned(comment.id)}>
                                                        {pinnedIds.has(comment.id) ? (
                                                            <BookmarkAddedIcon fontSize="small" color="warning" />
                                                        ) : (
                                                            <BookmarkAddIcon fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </Tooltip>
                                                <Typography variant="body2" fontWeight={600}>#{comment.id}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2">{comment.customerName}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ID: {comment.customerId ?? '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: 320 }}>
                                                {comment.content}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={comment.productId ? `SP #${comment.productId}` : 'Không xác định'}
                                                size="small"
                                                color="info"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                color={comment.hasStaffReply ? 'success' : 'warning'}
                                                icon={comment.hasStaffReply ? <DoneAllIcon /> : <WarningIcon />}
                                                label={comment.hasStaffReply ? 'Đã phản hồi' : 'Chờ phản hồi'}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                                <ChatBubbleOutlineIcon fontSize="small" />
                                                <Typography variant="body2">{comment.replies.length}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{formatDateTime(comment.createdAt)}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                size="small"
                                                variant="contained"
                                                startIcon={<ReplyIcon />}
                                                onClick={() => handleOpenDetail(comment)}
                                            >
                                                Trả lời
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                sx={{ mt: 3 }}
            >
                <Typography variant="body2" color="text.secondary">
                    Trang {page + 1} / {totalPages} • Hiển thị {filteredComments.length} / {totalElements} bình luận
                </Typography>
                <Pagination
                    shape="rounded"
                    color="primary"
                    page={page + 1}
                    count={totalPages}
                    onChange={(_, value) => setPage(value - 1)}
                    showFirstButton
                    showLastButton
                />
            </Stack>

            <ReplyDrawer
                comment={selectedComment}
                pinned={selectedComment ? pinnedIds.has(selectedComment.id) : false}
                product={currentProduct}
                productLoading={productLoading}
                replyContent={replyContent}
                quickReplies={QUICK_REPLIES}
                loading={replyLoading}
                onClose={handleCloseDetail}
                onReplyChange={setReplyContent}
                onSend={handleReplySubmit}
                onTogglePinned={() => selectedComment && togglePinned(selectedComment.id)}
                onSelectQuickReply={insertQuickReply}
            />
        </Box>
    );
};

const GridStats: React.FC<{ stats: { total: number; pending: number; responded: number; pinned: number; } }> = ({ stats }) => (
    <Box
        sx={{
            display: 'grid',
            gridTemplateColumns: {
                xs: 'repeat(1, minmax(0, 1fr))',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 2,
        }}
    >
        {[{
            title: 'Tổng bình luận',
            value: stats.total,
            color: 'primary',
            icon: <CommentIcon color="primary" />,
        }, {
            title: 'Chờ phản hồi',
            value: stats.pending,
            color: 'warning',
            icon: <WarningIcon color="warning" />,
        }, {
            title: 'Đã phản hồi',
            value: stats.responded,
            color: 'success',
            icon: <DoneAllIcon color="success" />,
        }, {
            title: 'Đang ưu tiên',
            value: stats.pinned,
            color: 'info',
            icon: <BookmarkAddedIcon color="info" />,
        }].map((card) => (
            <Paper key={card.title} sx={{ p: 2.5, borderRadius: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box>{card.icon}</Box>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">{card.title}</Typography>
                        <Typography variant="h5" fontWeight={700}>{card.value}</Typography>
                    </Box>
                </Stack>
            </Paper>
        ))}
    </Box>
);

interface ReplyDrawerProps {
    comment: ModerationComment | null;
    pinned: boolean;
    product?: Product | null;
    productLoading: boolean;
    replyContent: string;
    quickReplies: string[];
    loading: boolean;
    onClose: () => void;
    onReplyChange: (value: string) => void;
    onSend: () => void;
    onTogglePinned: () => void;
    onSelectQuickReply: (template: string) => void;
}

const ReplyDrawer: React.FC<ReplyDrawerProps> = ({
    comment,
    pinned,
    product,
    productLoading,
    replyContent,
    quickReplies,
    loading,
    onClose,
    onReplyChange,
    onSend,
    onTogglePinned,
    onSelectQuickReply,
}) => (
    <Drawer
        anchor="right"
        open={Boolean(comment)}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420, md: 480 } } }}
    >
        {comment && (
            <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                            Bình luận #{comment.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Khách hàng: {comment.customerName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sản phẩm: {comment.productId ? `#${comment.productId}` : 'Không xác định'}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title={pinned ? 'Bỏ ưu tiên' : 'Đánh dấu ưu tiên'}>
                            <IconButton onClick={onTogglePinned}>
                                {pinned ? <BookmarkAddedIcon color="warning" /> : <BookmarkAddIcon />}
                            </IconButton>
                        </Tooltip>
                        <IconButton onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </Stack>

                <ProductInfoCard productId={comment.productId} product={product} loading={productLoading} />

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Nội dung khách hàng
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {comment.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Đăng lúc: {formatDateTime(comment.createdAt)}
                    </Typography>
                </Paper>

                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Lịch sử phản hồi
                    </Typography>
                    {comment.replies.length === 0 ? (
                        <Alert severity="info">Chưa có phản hồi nào cho bình luận này.</Alert>
                    ) : (
                        <Stack spacing={1.5}>
                            {comment.replies.map((reply) => (
                                <Paper key={reply.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                        <Avatar sx={{ width: 28, height: 28, bgcolor: reply.isStaffReply ? 'primary.main' : 'grey.500' }}>
                                            {reply.authorName.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2">
                                                {reply.authorName}
                                                {reply.isStaffReply && (
                                                    <Chip label="STAFF" color="primary" size="small" sx={{ ml: 1 }} />
                                                )}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDateTime(reply.createdAt)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{reply.content}</Typography>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Box>

                <Divider />

                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Mẫu phản hồi nhanh
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {quickReplies.map((template) => (
                            <Chip
                                key={template}
                                size="small"
                                label={template.slice(0, 26) + (template.length > 26 ? '…' : '')}
                                onClick={() => onSelectQuickReply(template)}
                                sx={{ mb: 1 }}
                            />
                        ))}
                    </Stack>
                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Phản hồi tới khách hàng
                    </Typography>
                    <TextField
                        multiline
                        minRows={4}
                        maxRows={8}
                        value={replyContent}
                        onChange={(event) => onReplyChange(event.target.value)}
                        placeholder="Nhập nội dung phản hồi..."
                        fullWidth
                        sx={{ flexGrow: 1 }}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<SendIcon />}
                        sx={{ mt: 2 }}
                        disabled={loading}
                        onClick={onSend}
                    >
                        {loading ? 'Đang gửi...' : 'Gửi phản hồi'}
                    </Button>
                </Box>
            </Box>
        )}
    </Drawer>
);

const ProductInfoCard: React.FC<{ productId?: number; product?: Product | null; loading: boolean; }> = ({ productId, product, loading }) => {
    if (!productId) {
        return <Alert severity="info">Bình luận này không gắn với sản phẩm cụ thể.</Alert>;
    }

    if (loading && product === undefined) {
        return (
            <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'center', borderRadius: 2 }}>
                <CircularProgress size={24} />
            </Paper>
        );
    }

    if (product === null || product === undefined) {
        return <Alert severity="warning">Không tìm thấy thông tin cho sản phẩm #{productId}.</Alert>;
    }

    const primaryImage = product.image_url || product.images?.find((img) => img.is_primary)?.file_path;
    const stockMeta = product.quantity <= 0
        ? { label: 'Hết hàng', color: 'error' as const }
        : product.quantity <= product.low_stock_threshold
            ? { label: 'Sắp hết hàng', color: 'warning' as const }
            : { label: 'Còn hàng', color: 'success' as const };

    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <Box
                    sx={{
                        width: 72,
                        height: 72,
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {primaryImage ? (
                        <Box component="img" src={primaryImage} alt={product.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <CommentIcon color="disabled" />
                    )}
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Sản phẩm #{product.id}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                        {product.name}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
                        <Chip label={stockMeta.label} color={stockMeta.color} size="small" />
                        {product.category?.name && (
                            <Chip label={product.category.name} size="small" variant="outlined" />
                        )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        Giá bán: <strong>{formatCurrency(product.price)}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Tồn kho hiện tại: {product.quantity} (Ngưỡng cảnh báo: {product.low_stock_threshold})
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    size="small"
                    endIcon={<OpenInNewIcon fontSize="small" />}
                    component={RouterLink}
                    to={`/product/${product.id}`}
                    target="_blank"
                >
                    Xem
                </Button>
            </Stack>
        </Paper>
    );
};

export default StaffCommentsResponseCenter;
