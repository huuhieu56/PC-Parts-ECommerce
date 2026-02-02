import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import commentService from '../../../services/comment.service';

const CommentsList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res: any = await commentService.getComments({ page: 0, size: 50 });
      // handle possible wrapped page or raw array
      if (Array.isArray(res)) setComments(res);
      else if (res.content) setComments(res.content);
      else setComments([]);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa bình luận này?')) return;
    try {
      await commentService.deleteComment(id);
      setComments((c) => c.filter((x) => x.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleReply = async (id: number) => {
    const content = prompt('Nội dung trả lời:');
    if (!content) return;
    try {
      // using system/staff user id 1 for admin reply; backend should map admin user automatically if token present
      await commentService.replyToComment(id, { content, user_id: 1 });
      fetchComments();
    } catch (err) {
      console.error('Reply failed', err);
    }
  };

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Quản lý bình luận</Typography>
        <Button variant="contained" onClick={fetchComments}>Làm mới</Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Sản phẩm</TableCell>
                <TableCell>Người dùng</TableCell>
                <TableCell>Nội dung</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comments.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.id}</TableCell>
                  <TableCell>{c.product_id ?? c.productId ?? '-'}</TableCell>
                  <TableCell>{c.user_full_name ?? c.user_fullName ?? c.user?.full_name ?? c.user?.fullName ?? c.user_id ?? '-'}</TableCell>
                  <TableCell style={{ maxWidth: 400, whiteSpace: 'pre-wrap' }}>{c.content}</TableCell>
                  <TableCell>{c.created_at ?? c.createdAt ?? '-'}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary" onClick={() => handleReply(c.id)} title="Trả lời"><ReplyIcon /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default CommentsList;
