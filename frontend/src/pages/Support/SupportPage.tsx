import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PolicyIcon from '@mui/icons-material/Policy';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';

const faqs: Array<{ q: string; a: React.ReactNode }> = [
    {
        q: 'Thời gian bảo hành sản phẩm là bao lâu?',
        a: (
            <>Tất cả các sản phẩm linh kiện chính hãng tại Computer Shop đều được bảo hành từ 12 đến 36 tháng, tùy theo thương hiệu và loại linh kiện.</>
        ),
    },
    {
        q: 'Làm thế nào để gửi sản phẩm bảo hành?',
        a: (
            <>Bạn có thể mang sản phẩm trực tiếp đến cửa hàng hoặc gửi qua đơn vị vận chuyển. Vui lòng liên hệ với chúng tôi trước khi gửi để được hướng dẫn chi tiết.</>
        ),
    },
    {
        q: 'Tôi có thể đổi trả sản phẩm trong trường hợp nào?',
        a: (
            <>Bạn có thể đổi trả trong 7 ngày nếu sản phẩm gặp lỗi kỹ thuật do nhà sản xuất hoặc chưa qua sử dụng. Vui lòng giữ nguyên hóa đơn và bao bì khi đổi trả.</>
        ),
    },
    {
        q: 'Thời gian giao hàng là bao lâu?',
        a: (
            <>Đơn hàng nội thành thường giao trong 1–2 ngày làm việc, còn các khu vực khác từ 3–5 ngày, tùy vị trí.</>
        ),
    },
    {
        q: 'Tôi có thể thanh toán bằng những hình thức nào?',
        a: (
            <>
                Computer Shop hỗ trợ các hình thức:
                <ul style={{ marginTop: 8 }}>
                    <li>Thanh toán khi nhận hàng (COD)</li>
                    <li>Chuyển khoản ngân hàng</li>
                    <li>Ví điện tử (Momo, ZaloPay, VNPay)</li>
                </ul>
            </>
        ),
    },
    {
        q: 'Tôi quên mật khẩu tài khoản thì phải làm sao?',
        a: (
            <>Bạn có thể chọn “Quên mật khẩu” tại trang đăng nhập, hệ thống sẽ gửi email hướng dẫn đặt lại mật khẩu mới.</>
        ),
    },
];

export const SupportPage: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ py: 5 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Chip icon={<SupportAgentIcon />} color="primary" label="Trung tâm hỗ trợ" sx={{ mb: 1 }} />
                <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                    💬 Trung tâm hỗ trợ (Support)
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                    Chào mừng bạn đến với Trung tâm hỗ trợ của Computer Shop! Tại đây, chúng tôi cung cấp thông tin cần thiết giúp bạn
                    giải đáp các thắc mắc về mua hàng, bảo hành, đổi trả và hướng dẫn sử dụng dịch vụ. Nếu bạn cần thêm hỗ trợ, hãy
                    liên hệ với chúng tôi qua hotline hoặc email bên dưới.
                </Typography>
            </Box>

            {/* FAQ */}
            <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <HelpOutlineIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>Câu hỏi thường gặp (FAQ)</Typography>
                </Box>
                <Card variant="outlined">
                    <CardContent>
                        {faqs.map((item, idx) => (
                            <Accordion key={idx} disableGutters>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography fontWeight={600}>{idx + 1}. {item.q}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" color="text.secondary">{item.a}</Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </CardContent>
                </Card>
            </Box>

            {/* Policies */}
            <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PolicyIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>Chính sách hỗ trợ</Typography>
                </Box>
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            <ListItem component={RouterLink} to="/policies/warranty" sx={{ textDecoration: 'none', color: 'inherit' }}>
                                <ListItemIcon><PolicyIcon color="action" /></ListItemIcon>
                                <ListItemText primary="Chính sách bảo hành" secondary="Điều kiện và thời gian bảo hành cho từng loại sản phẩm" />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem component={RouterLink} to="/policies/returns" sx={{ textDecoration: 'none', color: 'inherit' }}>
                                <ListItemIcon><PolicyIcon color="action" /></ListItemIcon>
                                <ListItemText primary="Chính sách đổi trả" secondary="Hướng dẫn đổi trả trong vòng 7 ngày" />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem component={RouterLink} to="/policies/shipping" sx={{ textDecoration: 'none', color: 'inherit' }}>
                                <ListItemIcon><PolicyIcon color="action" /></ListItemIcon>
                                <ListItemText primary="Chính sách vận chuyển" secondary="Thời gian và phạm vi giao hàng" />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem component={RouterLink} to="/guides/payment" sx={{ textDecoration: 'none', color: 'inherit' }}>
                                <ListItemIcon><PolicyIcon color="action" /></ListItemIcon>
                                <ListItemText primary="Hướng dẫn thanh toán" secondary="Các hình thức thanh toán được hỗ trợ" />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem component={RouterLink} to="/guides/build-pc" sx={{ textDecoration: 'none', color: 'inherit' }}>
                                <ListItemIcon><PolicyIcon color="action" /></ListItemIcon>
                                <ListItemText primary="Hướng dẫn Build PC" secondary="Các bước lựa chọn linh kiện và lắp ráp" />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>

            {/* Contact */}
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <SupportAgentIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>Liên hệ hỗ trợ</Typography>
                </Box>
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            <ListItem>
                                <ListItemIcon><PhoneIcon color="action" /></ListItemIcon>
                                <ListItemText primary="Hotline" secondary="1900-1234" />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><EmailIcon color="action" /></ListItemIcon>
                                <ListItemText primary="Email" secondary="support@computershop.com" />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><LocationOnIcon color="action" /></ListItemIcon>
                                <ListItemText primary="Địa chỉ" secondary="123 Đường ABC, Quận XYZ, TP. HCM" />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><ScheduleIcon color="action" /></ListItemIcon>
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

export default SupportPage;
