import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Đảm bảo mỗi lần chuyển trang thì viewport trở lại đầu trang.
 * Giúp tránh lỗi hiển thị footer trước trên mobile.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
