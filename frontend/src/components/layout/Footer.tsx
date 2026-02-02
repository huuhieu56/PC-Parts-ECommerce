import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CopyrightIcon from '@mui/icons-material/Copyright';

interface FooterProps {
  variant?: 'default' | 'minimal';
}

export const Footer: React.FC<FooterProps> = ({ variant = 'default' }) => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <Box
        component="footer"
        sx={{
          bgcolor: theme.palette.grey[100],
          py: 2,
          mt: 'auto',
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © {currentYear} Computer Shop. Bảo lưu mọi quyền.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Link href="/privacy" color="text.secondary" variant="body2">
                Chính sách bảo mật
              </Link>
              <Typography variant="body2" color="text.secondary">
                |
              </Typography>
              <Link href="/terms" color="text.secondary" variant="body2">
                Điều khoản sử dụng
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: theme.palette.grey[900],
        color: theme.palette.common.white,
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 4,
          }}
        >
          {/* Company Info */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Computer Shop
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'grey.300' }}>
              Chuyên cung cấp linh kiện máy tính chính hãng với giá tốt nhất thị trường.
              Cam kết chất lượng và dịch vụ khách hàng tốt nhất.
            </Typography>
            
            {/* Social Media */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                sx={{ color: 'grey.300', '&:hover': { color: '#1877f2' } }}
                aria-label="Facebook"
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                size="small"
                sx={{ color: 'grey.300', '&:hover': { color: '#ff0000' } }}
                aria-label="YouTube"
              >
                <YouTubeIcon />
              </IconButton>
              <IconButton
                size="small"
                sx={{ color: 'grey.300', '&:hover': { color: '#E4405F' } }}
                aria-label="Instagram"
              >
                <InstagramIcon />
              </IconButton>
              <IconButton
                size="small"
                sx={{ color: 'grey.300', '&:hover': { color: '#1DA1F2' } }}
                aria-label="Twitter"
              >
                <TwitterIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Product Categories */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Danh mục sản phẩm
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/products/cpu" color="grey.300" variant="body2" underline="hover">
                CPU - Bộ vi xử lý
              </Link>
              <Link href="/products/vga" color="grey.300" variant="body2" underline="hover">
                VGA - Card đồ họa
              </Link>
              <Link href="/products/ram" color="grey.300" variant="body2" underline="hover">
                RAM - Bộ nhớ
              </Link>
              <Link href="/products/mainboard" color="grey.300" variant="body2" underline="hover">
                Mainboard - Bo mạch chủ
              </Link>
              <Link href="/products/psu" color="grey.300" variant="body2" underline="hover">
                PSU - Nguồn máy tính
              </Link>
              <Link href="/products/storage" color="grey.300" variant="body2" underline="hover">
                SSD/HDD - Ổ cứng
              </Link>
            </Box>
          </Box>

          {/* Customer Service */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Hỗ trợ khách hàng
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/support" color="grey.300" variant="body2" underline="hover">
                Trung tâm hỗ trợ
              </Link>
              <Link href="/warranty" color="grey.300" variant="body2" underline="hover">
                Chính sách bảo hành
              </Link>
              <Link href="/return-policy" color="grey.300" variant="body2" underline="hover">
                Chính sách đổi trả
              </Link>
              <Link href="/shipping" color="grey.300" variant="body2" underline="hover">
                Chính sách vận chuyển
              </Link>
              <Link href="/payment" color="grey.300" variant="body2" underline="hover">
                Hướng dẫn thanh toán
              </Link>
              <Link href="/build-pc-guide" color="grey.300" variant="body2" underline="hover">
                Hướng dẫn Build PC
              </Link>
            </Box>
          </Box>

          {/* Contact Info */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Thông tin liên hệ
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnIcon sx={{ fontSize: 20, color: 'grey.400' }} />
                <Typography variant="body2" color="grey.300">
                  96A Đ. Trần Phú, P. Mộ Lao, Hà Đông, Hà Nội
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon sx={{ fontSize: 20, color: 'grey.400' }} />
                <Typography variant="body2" color="grey.300">
                  Hotline: 1900-1234
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon sx={{ fontSize: 20, color: 'grey.400' }} />
                <Typography variant="body2" color="grey.300">
                  support@computershop.com
                </Typography>
              </Box>
              
              {/* Working Hours */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'grey.300' }}>
                  Giờ làm việc:
                </Typography>
                <Typography variant="body2" color="grey.400">
                  T2 - T6: 8:00 - 20:00
                </Typography>
                <Typography variant="body2" color="grey.400">
                  T7 - CN: 9:00 - 18:00
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 4, borderColor: 'grey.700' }} />

        {/* Bottom Bar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CopyrightIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2" color="grey.300">
              {currentYear} Computer Shop. Bảo lưu mọi quyền.
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link href="/privacy" color="grey.300" variant="body2" underline="hover">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" color="grey.300" variant="body2" underline="hover">
              Điều khoản sử dụng
            </Link>
            <Link href="/cookies" color="grey.300" variant="body2" underline="hover">
              Chính sách Cookie
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
