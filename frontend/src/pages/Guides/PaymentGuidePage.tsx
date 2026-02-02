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
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ScheduleIcon from '@mui/icons-material/Schedule';

export const PaymentGuidePage: React.FC = () => {
    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Chip icon={<CreditCardIcon />} color="primary" label="Hướng dẫn thanh toán" sx={{ mb: 1 }} />
                <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                    💳 Hướng dẫn thanh toán
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Computer Shop hỗ trợ nhiều phương thức thanh toán linh hoạt, an toàn và tiện lợi.
                </Typography>
            </Box>

            {/* 1. Các hình thức thanh toán */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    1. Các hình thức thanh toán
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            <ListItem>
                                <PaymentsIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText
                                    primary="Thanh toán khi nhận hàng (COD)"
                                    secondary="Thanh toán trực tiếp bằng tiền mặt cho nhân viên giao hàng khi nhận sản phẩm."
                                />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem alignItems="flex-start">
                                <AccountBalanceIcon color="action" sx={{ mr: 1, mt: 0.5 }} />
                                <ListItemText
                                    primary="Chuyển khoản ngân hàng"
                                    secondary={
                                        <>
                                            Quý khách chuyển khoản theo thông tin sau:
                                            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                                                <li>Ngân hàng: <strong>Vietcombank – Chi nhánh TP.HCM</strong></li>
                                                <li>Số tài khoản: <strong>0123 456 789</strong></li>
                                                <li>Chủ tài khoản: <strong>CÔNG TY TNHH COMPUTER SHOP</strong></li>
                                            </ul>
                                            Khi chuyển khoản, vui lòng ghi rõ: <em>Họ tên + Số điện thoại + Mã đơn hàng</em> để thuận tiện xác nhận.
                                        </>
                                    }
                                />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <QrCode2Icon color="action" sx={{ mr: 1 }} />
                                <ListItemText
                                    primary="Thanh toán qua ví điện tử"
                                    secondary="Hỗ trợ Momo, ZaloPay, ShopeePay, v.v. (mã QR sẽ hiển thị khi đặt hàng)."
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>

            {/* 2. Quy trình thanh toán */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    2. Quy trình thanh toán
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <ol style={{ paddingLeft: 20, margin: 0 }}>
                            <li>Chọn sản phẩm cần mua và nhấn “Thêm vào giỏ hàng”.</li>
                            <li>Vào giỏ hàng, kiểm tra lại số lượng và thông tin.</li>
                            <li>Nhấn “Thanh toán”, điền đầy đủ thông tin người nhận hàng.</li>
                            <li>Chọn phương thức thanh toán mong muốn.</li>
                            <li>Xác nhận đơn hàng và chờ hệ thống gửi email xác nhận.</li>
                        </ol>
                    </CardContent>
                </Card>
            </Box>

            {/* 3. Lưu ý khi thanh toán */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    3. Lưu ý khi thanh toán
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <ul style={{ paddingLeft: 20, margin: 0 }}>
                            <li>Với hình thức chuyển khoản, đơn hàng chỉ được xử lý sau khi Computer Shop xác nhận đã nhận được tiền.</li>
                            <li>Trường hợp giao dịch lỗi hoặc chậm trễ, vui lòng liên hệ ngay hotline <strong>1900-1234</strong> để được hỗ trợ.</li>
                            <li>Tất cả giao dịch đều được bảo mật; chúng tôi không lưu trữ thông tin thẻ/tài khoản ngân hàng của khách hàng.</li>
                        </ul>
                    </CardContent>
                </Card>
            </Box>

            {/* 4. Hỗ trợ thanh toán */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SupportAgentIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>4. Hỗ trợ thanh toán</Typography>
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

export default PaymentGuidePage;
