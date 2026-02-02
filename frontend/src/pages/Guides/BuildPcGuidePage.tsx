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
import BuildIcon from '@mui/icons-material/Build';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import DevicesIcon from '@mui/icons-material/Devices';
import TuneIcon from '@mui/icons-material/Tune';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ScheduleIcon from '@mui/icons-material/Schedule';

export const BuildPcGuidePage: React.FC = () => {
    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Chip icon={<BuildIcon />} color="primary" label="Hướng dẫn Build PC" sx={{ mb: 1 }} />
                <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                    🧰 Hướng dẫn Build PC
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Tổng hợp các bước và lưu ý quan trọng để tự xây dựng một bộ PC phù hợp nhu cầu, tối ưu chi phí.
                </Typography>
            </Box>

            {/* 1. Xác định nhu cầu sử dụng */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    1. Xác định nhu cầu sử dụng
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            <ListItem>
                                <DevicesIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText
                                    primary="Văn phòng, học tập"
                                    secondary="Ưu tiên cấu hình nhẹ, tiết kiệm điện, giá tốt."
                                />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <DevicesIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText
                                    primary="Gaming"
                                    secondary="Cần CPU và GPU mạnh, RAM lớn, nguồn ổn định."
                                />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <DevicesIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText
                                    primary="Đồ họa, render"
                                    secondary="Chọn CPU đa nhân, RAM từ 32GB, SSD tốc độ cao."
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>

            {/* 2. Chọn linh kiện phù hợp */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    2. Chọn linh kiện phù hợp
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            <ListItem>
                                <TuneIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="CPU (Bộ vi xử lý)" secondary="Quyết định hiệu năng xử lý." />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <TuneIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="Mainboard (Bo mạch chủ)" secondary="Tương thích với CPU và các linh kiện khác." />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <TuneIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="RAM (Bộ nhớ)" secondary="Dung lượng càng cao, đa nhiệm càng mượt." />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <TuneIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="VGA (Card đồ họa)" secondary="Quan trọng khi chơi game, làm đồ họa." />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <TuneIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="SSD/HDD (Ổ cứng)" secondary="SSD giúp khởi động và mở ứng dụng nhanh hơn." />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <TuneIcon color="action" sx={{ mr: 1 }} />
                                <ListItemText primary="PSU (Nguồn)" secondary="Nên chọn loại có chứng nhận 80 Plus, đủ công suất." />
                            </ListItem>
                        </List>
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TipsAndUpdatesIcon color="primary" />
                            <Typography variant="body2">
                                Mẹo: Hãy thử công cụ <strong>“Build PC”</strong> trên website để chọn linh kiện tương thích và xem tổng chi phí nhanh chóng.
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* 3. Build PC */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    3. Build PC
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <ol style={{ paddingLeft: 20, margin: 0 }}>
                            <li>Đặt mainboard ra bàn, lắp CPU – RAM – quạt tản nhiệt trước.</li>
                            <li>Gắn mainboard vào case, kết nối nguồn và dây tín hiệu.</li>
                            <li>Lắp ổ cứng – card đồ họa, sắp xếp dây gọn gàng.</li>
                            <li>Kết nối màn hình, bàn phím, chuột → khởi động thử hệ thống.</li>
                        </ol>
                    </CardContent>
                </Card>
            </Box>

            {/* 4. Cài đặt và kiểm tra */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    4. Cài đặt và kiểm tra
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <ul style={{ paddingLeft: 20, margin: 0 }}>
                            <li>Cài Windows, driver và phần mềm cần thiết.</li>
                            <li>Kiểm tra nhiệt độ, hiệu năng bằng CPU-Z, GPU-Z, HWMonitor.</li>
                            <li>Đảm bảo quạt quay ổn định, nhiệt độ CPU không vượt quá <strong>80°C</strong> khi tải nặng.</li>
                        </ul>
                    </CardContent>
                </Card>
            </Box>

            {/* 5. Hỗ trợ kỹ thuật */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    5. Hỗ trợ kỹ thuật
                </Typography>
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
                                <ListItemText primary="Giờ làm việc" secondary="T2–T6: 8:00–20:00 | T7–CN: 9:00–18:00" />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default BuildPcGuidePage;
