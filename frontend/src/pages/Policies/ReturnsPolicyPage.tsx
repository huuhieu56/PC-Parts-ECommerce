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
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';

export const ReturnsPolicyPage: React.FC = () => {
    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Chip icon={<ReceiptLongIcon />} color="primary" label="Chính sách đổi trả" sx={{ mb: 1 }} />
                <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                    🧾 Chính sách đổi trả
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Computer Shop cam kết mang đến sản phẩm chất lượng và dịch vụ tốt nhất. Trong trường hợp sản phẩm chưa đáp ứng kỳ vọng,
                    quý khách có thể đổi hoặc trả hàng theo chính sách bên dưới.
                </Typography>
            </Box>

            {/* 1. Điều kiện đổi trả */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    1. Điều kiện đổi trả
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            <ListItem>
                                <ListItemText primary="Thời gian đổi trả trong vòng 07 ngày kể từ ngày nhận hàng." />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <ListItemText primary="Sản phẩm còn nguyên vẹn, chưa qua sử dụng, đầy đủ hộp, phụ kiện, tem, nhãn và hóa đơn mua hàng." />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <ListItemText primary="Không áp dụng cho sản phẩm trầy xước, hư hỏng do lỗi người dùng hoặc đã qua sửa chữa." />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>

            {/* 2. Quy trình đổi trả */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    2. Quy trình đổi trả
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <ol style={{ paddingLeft: 20, margin: 0 }}>
                            <li>
                                Liên hệ bộ phận chăm sóc khách hàng qua Hotline <strong>1900-1234</strong> hoặc email:
                                <strong> support@computershop.com</strong> để thông báo yêu cầu.
                            </li>
                            <li>Gửi sản phẩm về trung tâm bảo hành hoặc cửa hàng gần nhất của Computer Shop.</li>
                            <li>Nhân viên kỹ thuật kiểm tra tình trạng và xác nhận yêu cầu đổi/trả.</li>
                            <li>Hoàn tất đổi/trả hoặc hoàn tiền theo chính sách đã thỏa thuận.</li>
                        </ol>
                    </CardContent>
                </Card>
            </Box>

            {/* 3. Thời gian xử lý */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    3. Thời gian xử lý
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AccessTimeIcon color="action" />
                            <Typography>
                                Thời gian xác nhận và xử lý yêu cầu: <strong>3–5 ngày làm việc</strong> kể từ khi nhận sản phẩm.
                            </Typography>
                        </Box>
                        <Typography>
                            Trường hợp hoàn tiền, số tiền sẽ được chuyển hoàn trong vòng <strong>03 ngày</strong> sau khi kiểm tra hoàn tất.
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* 4. Phí đổi trả */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    4. Phí đổi trả
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            <ListItem>
                                <ListItemText primary="Miễn phí đổi trả nếu lỗi do nhà sản xuất hoặc giao sai sản phẩm." />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <ListItemText primary="Đổi trả vì lý do cá nhân (không ưng ý, đặt nhầm, ...) khách hàng chịu phí vận chuyển hai chiều." />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>

            {/* 5. Liên hệ hỗ trợ */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SupportAgentIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>5. Liên hệ hỗ trợ</Typography>
                </Box>
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            <ListItem>
                                <PhoneIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="Hotline" secondary="1900-1234" />
                            </ListItem>
                            <ListItem>
                                <EmailIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="Email" secondary="support@computershop.com" />
                            </ListItem>
                            <ListItem>
                                <LocationOnIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="Địa chỉ" secondary="123 Đường ABC, Quận XYZ, TP.HCM" />
                            </ListItem>
                            <ListItem>
                                <ScheduleIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="Giờ làm việc" secondary={
                                    <>
                                        Thứ 2 – Thứ 6: 8:00 – 20:00<br />
                                        Thứ 7 – Chủ nhật: 9:00 – 18:00
                                    </>
                                } />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default ReturnsPolicyPage;
