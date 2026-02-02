import React from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Divider,
    Chip,
} from '@mui/material';
import PolicyIcon from '@mui/icons-material/Policy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceIcon from '@mui/icons-material/Place';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

export const WarrantyPolicyPage: React.FC = () => {
    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Chip icon={<PolicyIcon />} color="primary" label="Chính sách bảo hành" sx={{ mb: 1 }} />
                <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                    Chính sách bảo hành
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Chính sách bảo hành giúp khách hàng yên tâm khi mua sắm tại Computer Shop. Chúng tôi cam kết chỉ bán sản phẩm
                    chính hãng và hỗ trợ bảo hành nhanh chóng, minh bạch.
                </Typography>
            </Box>

            {/* 2. Điều kiện bảo hành */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    1. Điều kiện bảo hành
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            <ListItem><ListItemText primary="Còn trong thời hạn bảo hành ghi trên tem hoặc hóa đơn mua hàng." /></ListItem>
                            <Divider component="li" />
                            <ListItem><ListItemText primary="Tem, mã serial còn nguyên vẹn, không bị rách hoặc sửa đổi." /></ListItem>
                            <Divider component="li" />
                            <ListItem><ListItemText primary="Sản phẩm bị lỗi kỹ thuật do nhà sản xuất." /></ListItem>
                            <Divider component="li" />
                            <ListItem><ListItemText primary="Có đầy đủ phụ kiện đi kèm (nếu có)." /></ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>

            {/* 3. Trường hợp không được bảo hành */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    2. Trường hợp không được bảo hành
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            <ListItem><ListItemText primary="Hư hỏng do sử dụng sai hướng dẫn, va đập, rơi vỡ, hoặc ngấm nước." /></ListItem>
                            <Divider component="li" />
                            <ListItem><ListItemText primary="Sản phẩm bị can thiệp, sửa chữa bởi bên thứ ba không được ủy quyền." /></ListItem>
                            <Divider component="li" />
                            <ListItem><ListItemText primary="Hư hỏng do thiên tai, cháy nổ hoặc điện áp không ổn định." /></ListItem>
                            <Divider component="li" />
                            <ListItem><ListItemText primary="Không có tem hoặc chứng từ chứng minh nguồn gốc sản phẩm." /></ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>

            {/* 4. Thời gian & địa điểm */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    3. Thời gian và địa điểm bảo hành
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AccessTimeIcon color="action" />
                            <Typography>Thời gian xử lý bảo hành: 7 – 15 ngày làm việc (tùy sản phẩm).</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PlaceIcon color="action" />
                            <Typography>
                                Địa điểm bảo hành: Trung tâm bảo hành Computer Shop — 123 Đường ABC, Quận XYZ, TP. HCM
                            </Typography>
                        </Box>
                        <Typography sx={{ ml: 4 }}>
                            Hoặc gửi qua đường bưu điện (vui lòng liên hệ trước khi gửi).
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <SupportAgentIcon color="action" />
                            <Typography>Hotline hỗ trợ: 1900-1234 (giờ hành chính).</Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* 5. Quy trình bảo hành */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    4. Quy trình bảo hành
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <ol style={{ paddingLeft: 20, margin: 0 }}>
                            <li>Liên hệ với bộ phận hỗ trợ qua hotline hoặc email để xác nhận lỗi.</li>
                            <li>Gửi sản phẩm đến trung tâm bảo hành hoặc chi nhánh gần nhất.</li>
                            <li>Kỹ thuật viên kiểm tra và thông báo kết quả trong vòng 1–3 ngày.</li>
                            <li>Sản phẩm sẽ được sửa chữa hoặc đổi mới (nếu đủ điều kiện).</li>
                            <li>Thông báo cho khách hàng khi hoàn tất.</li>
                        </ol>
                    </CardContent>
                </Card>
            </Box>

            {/* 6. Lưu ý thêm */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    5. Lưu ý thêm
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <ul style={{ paddingLeft: 20, margin: 0 }}>
                            <li>Trong trường hợp sản phẩm cần gửi về hãng, thời gian bảo hành có thể kéo dài hơn.</li>
                            <li>Computer Shop không chịu trách nhiệm với dữ liệu lưu trữ trong sản phẩm (ổ cứng, SSD, USB...).</li>
                            <li>Mọi thắc mắc vui lòng liên hệ: support@computershop.com</li>
                        </ul>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default WarrantyPolicyPage;
