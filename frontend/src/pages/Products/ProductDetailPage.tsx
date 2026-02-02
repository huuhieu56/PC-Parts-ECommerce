/**
 * 📱 PRODUCT DETAIL PAGE - Computer Shop E-commerce
 * Product detail page với product information, reviews, comments
 * Support role-based comment management
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  TextField,
  IconButton,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';

// Services & Types
import { productService } from '../../services/product.service';
import type { Product } from '../../types/product.types';
import { buildImageUrl } from '../../utils/urlHelpers';
import { formatSpecLabel, formatSpecValue } from '../../utils/specFormatter';

// Hooks
import { useCart } from '../../hooks/useCart';
import { useSnackbar } from '../../hooks/useSnackbar';
import { useAuth } from '../../hooks/useAuth';
import { commentService, normalizeComment } from '../../services/comment.service';
import type { CommentResponse } from '../../types/comment.types';

interface ProductDetailPageProps {}

const ProductDetailPage: React.FC<ProductDetailPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { showSuccess, showError } = useSnackbar();
  const auth = useAuth();
  const { isAuthenticated: isAuthUser, isCustomer: isCustomerRole } = auth;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Comments state
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyMap, setReplyMap] = useState<Record<number, string>>({});
  const [editMap, setEditMap] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  // Build an absolute URL for images served by the backend.
  const toImageUrl = (path?: string | null): string => buildImageUrl(path);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Thiếu mã sản phẩm');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const productData = await productService.getProductById(Number(id));
        setProduct(productData);

        // Load root comments for this product
        try {
          const roots = await commentService.getRootCommentsByProduct(productData.id);
          const normalizedArray: CommentResponse[] = (() => {
            const raw =
              Array.isArray(roots)
                ? roots
                : Array.isArray((roots as any)?.data?.content)
                ? (roots as any).data.content
                : Array.isArray((roots as any)?.data)
                ? (roots as any).data
                : Array.isArray((roots as any)?.content)
                ? (roots as any).content
                : [];
            return raw.map((it: any) => normalizeComment(it));
          })();
          setComments(normalizedArray);
        } catch {
          // im lặng nếu comment lỗi, không block trang
        }
      } catch (err: any) {
  // Thông báo lỗi tải sản phẩm
  setError(err?.message || 'Không tải được sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    // set ảnh primary nếu có
    if (product?.images?.length) {
      const primaryIndex = product.images.findIndex((i: any) => i.is_primary || i.isPrimary);
      setCurrentImageIndex(primaryIndex >= 0 ? primaryIndex : 0);
    } else {
      setCurrentImageIndex(0);
    }
  }, [product]);

  // Không đổi src khi các state khác thay đổi
  const imageSrc = useMemo(() => {
    if (product?.images?.length) {
      const filePath =
        (product.images[currentImageIndex] as any)?.file_path ??
        (product.images[currentImageIndex] as any)?.filePath ??
        null;
      return toImageUrl(filePath);
    }
    return toImageUrl(product?.image_url || (product as any)?.imageUrl || '/images/products/placeholder.jpg');
  }, [product?.images, product?.image_url, currentImageIndex]);

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  };

  const handleCreateComment = useCallback(async () => {
    if (!product || !auth.isAuthenticated || !auth.user) return;
    const content = newComment.trim();
    if (!content) return;

    try {
      const createdRaw = await commentService.createComment(product.id, { content });
      const created: CommentResponse = normalizeComment((createdRaw as any)?.data ?? createdRaw);
      setComments(prev => [created, ...prev]);
      setNewComment('');
      showSuccess('Bình luận đã được gửi');
    } catch (err: any) {
  showError(err?.message || 'Không gửi được bình luận');
    }
  }, [product, auth.isAuthenticated, auth.user, newComment, showSuccess, showError]);

  const handleReply = useCallback(
    async (parentId: number) => {
      if (!product || !auth.isAuthenticated || !auth.user) return;
      const content = (replyMap[parentId] || '').trim();
      if (!content) return;

      try {
        const createdRaw = await commentService.replyComment(parentId, { content });
        const created: CommentResponse = normalizeComment((createdRaw as any)?.data ?? createdRaw);
        const createdParentId =
          (created as any).parentCommentId ?? (created as any).parent_comment_id ?? parentId;

        setComments(prev =>
          prev.map(c =>
            c.id === createdParentId
              ? { ...c, replies: [...(c.replies || []), created] }
              : c
          )
        );
        setReplyMap(prev => ({ ...prev, [parentId]: '' }));
        showSuccess('Đã trả lời bình luận');
      } catch (err: any) {
  showError(err?.message || 'Không trả lời được bình luận');
      }
    },
    [product, auth.isAuthenticated, auth.user, replyMap, showSuccess, showError]
  );

  const handleDelete = useCallback(
    async (commentId: number) => {
      try {
        await commentService.deleteComment(commentId);
        // Loại bỏ cả top-level lẫn reply khớp id
        setComments(prev =>
          prev
            .filter(c => c.id !== commentId)
            .map(c => ({
              ...c,
              replies: c.replies?.filter(r => r.id !== commentId) || c.replies,
            }))
        );
        showSuccess('Đã xóa bình luận');
      } catch (err: any) {
  showError(err?.message || 'Không xóa được bình luận');
      }
    },
    [showSuccess, showError]
  );

  const isRestrictedUser = isAuthUser && !isCustomerRole;

  const handleAddToCart = useCallback(async () => {
    if (!product) return;

    if (isRestrictedUser) {
      showError('Tài khoản quản trị không thể thêm sản phẩm vào giỏ hàng');
      return;
    }

    try {
      const success = await addItem(product, quantity);
      if (success) {
        showSuccess(`Đã thêm ${product.name} vào giỏ`);
      } else {
        showError('Thêm vào giỏ thất bại');
      }
    } catch (err: any) {
      showError(err?.message || 'Thêm vào giỏ thất bại');
    }
  }, [product, quantity, addItem, showSuccess, showError, isRestrictedUser]);

  const handleGoBack = () => navigate('/');

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang tải dữ liệu...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleGoBack}>
          Quay lại
        </Button>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Không tìm thấy sản phẩm
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleGoBack}>
          Quay lại
        </Button>
      </Container>
    );
  }

  const imagesCount =
    (product?.images && product.images.length) || (product?.image_url || (product as any)?.imageUrl ? 1 : 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={handleGoBack}
        sx={{ mb: 3 }}
      >
        Trở về trang chủ
      </Button>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        {/* Left: Images */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ position: 'relative', width: '100%', maxWidth: 600, textAlign: 'center' }}>
            {/* Prev */}
            {imagesCount > 1 && (
              <Button
                onClick={() => setCurrentImageIndex(idx => (idx - 1 + imagesCount) % imagesCount)}
                disableElevation
                disableRipple
                aria-label="Ảnh trước"
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: { xs: '18%', sm: '12%', md: '8%' },
                  minWidth: 48,
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                  borderRadius: 0,
                  '&:hover:before': { bgcolor: 'rgba(128,128,128,0.12)' },
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'transparent',
                  },
                }}
              >
                ‹
              </Button>
            )}

            {/* Image */}
            <Box
              component="img"
              src={imageSrc}
              alt={product.name}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: 500,
                objectFit: 'contain',
                borderRadius: 2,
                bgcolor: 'grey.100',
              }}
            />

            {/* Next */}
            {imagesCount > 1 && (
              <Button
                onClick={() => setCurrentImageIndex(idx => (idx + 1) % imagesCount)}
                disableElevation
                disableRipple
                aria-label="Ảnh tiếp theo"
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  height: '100%',
                  width: { xs: '18%', sm: '12%', md: '8%' },
                  minWidth: 48,
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                  borderRadius: 0,
                  '&:hover:before': { bgcolor: 'rgba(128,128,128,0.12)' },
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'transparent',
                  },
                }}
              >
                ›
              </Button>
            )}

            {/* Dots */}
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
              {Array.from({ length: imagesCount }).map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: i === currentImageIndex ? 'primary.main' : 'grey.400',
                    cursor: 'pointer',
                  }}
                  onClick={() => setCurrentImageIndex(i)}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Right: Info */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {product.name}
          </Typography>

          <Typography variant="h5" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
            {Number(product.price).toLocaleString('vi-VN')} VND
          </Typography>

          <Box sx={{ mb: 2 }}>
            {!!product.category?.name && (
              <Chip label={product.category.name} color="primary" variant="outlined" sx={{ mr: 1 }} />
            )}
            <Chip
              label={product.quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
              color={product.quantity > 0 ? 'success' : 'error'}
            />
          </Box>

          {!!product.description && (
            <Typography variant="body1" sx={{ mb: 3 }}>
              {product.description}
            </Typography>
          )}

          {!!product.specifications && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Thông số sản phẩm
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {Object.entries(product.specifications).map(([key, value]) => (
                  <Box key={key} sx={{ mb: 1 }}>
                    <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
                      {formatSpecLabel(key)}:
                    </Typography>
                    <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                      {formatSpecValue(value)}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Typography variant="body1">Số lượng:</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              -
            </Button>
            <Typography variant="body1" sx={{ minWidth: 30, textAlign: 'center' }}>
              {quantity}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setQuantity(q => Math.min(q + 1, product.quantity))}
              disabled={quantity >= product.quantity}
            >
              +
            </Button>
          </Box>

          {isRestrictedUser && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Chỉ khách hàng mới có thể đặt mua sản phẩm.
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            startIcon={<ShoppingCartIcon />}
            onClick={handleAddToCart}
            disabled={product.quantity === 0 || isRestrictedUser}
            fullWidth
          >
            {product.quantity === 0
              ? 'Hết hàng'
              : isRestrictedUser
              ? 'Không thể thêm vào giỏ'
              : 'Thêm vào giỏ hàng'}
          </Button>
        </Box>
      </Box>

      {/* Comments */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
            Bình luận
          </Typography>

          {auth.isAuthenticated && auth.isCustomer && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                placeholder="Viết bình luận..."
                fullWidth
                value={newComment}
                size="small"
                onChange={(e) => setNewComment(e.target.value)}
              />
              <IconButton
                color="primary"
                onClick={handleCreateComment}
                aria-label="send-comment"
                disabled={!newComment.trim()}
              >
                <SendIcon />
              </IconButton>
            </Box>
          )}

          {comments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Chưa có bình luận nào.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {comments.map((c) => (
                <Box key={c.id} sx={{ p: 2, borderRadius: 1, bgcolor: 'grey.50' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">{c.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(c.createdAt)}
                        {c.updatedAt && c.updatedAt !== c.createdAt ? ' • (đã chỉnh sửa)' : ''}
                      </Typography>
                    </Box>
                    <Box>
                      {(auth.canDeleteComments || auth.user?.id === c.userId) && (
                        <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                      {auth.user?.id === c.userId && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditMap(prev => ({ ...prev, [c.id]: c.content }));
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 1 }}>
                    {editingId === c.id ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          minRows={2}
                          value={editMap[c.id] || ''}
                          onChange={(e) => setEditMap(prev => ({ ...prev, [c.id]: e.target.value }))}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          onClick={async () => {
                            const newContent = (editMap[c.id] || '').trim();
                            if (!newContent) return;
                            try {
                              const updated = await commentService.updateComment(c.id, { content: newContent });
                              const norm = normalizeComment(updated);
                              setComments(prev =>
                                prev.map(item =>
                                  item.id === c.id
                                    ? { ...item, content: norm.content, updatedAt: norm.updatedAt }
                                    : item
                                )
                              );
                              setEditingId(null);
                              showSuccess('Đã cập nhật bình luận');
                            } catch (err: any) {
                              showError(err?.message || 'Không cập nhật được bình luận');
                            }
                          }}
                        >
                          Lưu
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => setEditingId(null)}>
                          Hủy
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="body2">{c.content}</Typography>
                    )}
                  </Box>

                  {/* Replies */}
                  {!!c.replies?.length && (
                    <Box sx={{ mt: 1, pl: 3, borderLeft: '2px solid rgba(0,0,0,0.04)' }}>
                      {c.replies.map((r) => (
                        <Box key={r.id} sx={{ mb: 1, bgcolor: 'transparent', pl: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle2">{r.fullName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(r.createdAt)}
                                {r.updatedAt && r.updatedAt !== r.createdAt ? ' • (đã chỉnh sửa)' : ''}
                              </Typography>
                            </Box>
                            <Box>
                              {(auth.canDeleteComments || auth.user?.id === r.userId) && (
                                <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                              {auth.user?.id === r.userId && (
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => {
                                    setEditingId(r.id);
                                    setEditMap(prev => ({ ...prev, [r.id]: r.content }));
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </Box>

                          <Box sx={{ mt: 0.5 }}>
                            {editingId === r.id ? (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  multiline
                                  minRows={2}
                                  value={editMap[r.id] || ''}
                                  onChange={(e) => setEditMap(prev => ({ ...prev, [r.id]: e.target.value }))}
                                />
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={async () => {
                                    const newContent = (editMap[r.id] || '').trim();
                                    if (!newContent) return;
                                    try {
                                      const updated = await commentService.updateComment(r.id, { content: newContent });
                                      const norm = normalizeComment(updated);
                                      setComments(prev =>
                                        prev.map(pc => ({
                                          ...pc,
                                          replies: pc.replies
                                            ? pc.replies.map(rr =>
                                                rr.id === r.id ? { ...rr, content: norm.content, updatedAt: norm.updatedAt } : rr
                                              )
                                            : pc.replies,
                                        }))
                                      );
                                      setEditingId(null);
                                      showSuccess('Đã cập nhật trả lời');
                                    } catch (err: any) {
                                      showError(err?.message || 'Không cập nhật được trả lời');
                                    }
                                  }}
                                >
                                  Lưu
                                </Button>
                                <Button variant="outlined" size="small" onClick={() => setEditingId(null)}>
                                  Hủy
                                </Button>
                              </Box>
                            ) : (
                              <Typography variant="body2">{r.content}</Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Reply input (role-based) */}
                  {auth.canReplyComments && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <TextField
                        placeholder="Trả lời..."
                        fullWidth
                        size="small"
                        value={replyMap[c.id] || ''}
                        onChange={(e) => setReplyMap(prev => ({ ...prev, [c.id]: e.target.value }))}
                      />
                      <IconButton
                        color="primary"
                        onClick={() => handleReply(c.id)}
                        disabled={!(replyMap[c.id] || '').trim()}
                      >
                        <ReplyIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ProductDetailPage;
