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
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export const ShippingPolicyPage: React.FC = () => {
    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Chip icon={<LocalShippingIcon />} color="primary" label="Chính sách vận chuyển" sx={{ mb: 1 }} />
                <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                    🚚 Chính sách vận chuyển
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Chúng tôi hợp tác với các đơn vị vận chuyển uy tín để đảm bảo hàng hóa đến tay khách hàng nhanh chóng và an toàn.
                </Typography>
            </Box>

            {/* 1. Phạm vi giao hàng */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    1. Phạm vi giao hàng
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <Typography>
                            Computer Shop cung cấp dịch vụ giao hàng toàn quốc, bao gồm tất cả các tỉnh thành Việt Nam. Chúng tôi hợp tác với
                            GHN, GHTK, Viettel Post để tối ưu tốc độ và chất lượng giao nhận.
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* 2. Thời gian giao hàng */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    2. Thời gian giao hàng
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            <ListItem>
                                <AccessTimeIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="Nội thành TP.HCM, Hà Nội: 1 – 2 ngày làm việc." />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <AccessTimeIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="Ngoại thành và tỉnh khác: 3 – 5 ngày làm việc (tùy vị trí)." />
                            </ListItem>
                        </List>
                        <Typography sx={{ mt: 1 }}>
                            Trường hợp đặc biệt (thiên tai, dịch bệnh, hết hàng tạm thời...), thời gian giao hàng có thể kéo dài hơn. Computer Shop
                            sẽ thông báo cụ thể nếu có thay đổi.
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* 3. Phí vận chuyển */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    3. Phí vận chuyển
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            <ListItem>
                                <PriceCheckIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="Miễn phí vận chuyển cho đơn từ 2.000.000đ trở lên." />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <PriceCheckIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="Đơn dưới 2.000.000đ: tính theo biểu phí của đơn vị giao hàng (tùy khu vực)." />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <PriceCheckIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="Có thể chọn nhận tại cửa hàng để tiết kiệm chi phí." />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>

            {/* 4. Kiểm tra hàng hóa khi nhận */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    4. Kiểm tra hàng hóa khi nhận
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            <ListItem>
                                <ListItemText primary="Vui lòng kiểm tra vỏ hộp, niêm phong và sản phẩm trước khi ký nhận." />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <ListItemText primary="Nếu phát hiện móp méo, sai sản phẩm hoặc thiếu phụ kiện, hãy từ chối nhận và liên hệ ngay 1900-1234 hoặc support@computershop.com." />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>

            {/* 5. Trách nhiệm vận chuyển */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    5. Trách nhiệm vận chuyển
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <Typography>
                            Computer Shop chịu trách nhiệm đối với hàng hóa cho đến khi giao tận tay khách hàng. Sau khi đã ký nhận, mọi hư hỏng
                            phát sinh được xem là do quá trình sử dụng hoặc bảo quản không đúng cách.
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* 6. Liên hệ hỗ trợ */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SupportAgentIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>6. Liên hệ hỗ trợ</Typography>
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
                        </List>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default ShippingPolicyPage;
