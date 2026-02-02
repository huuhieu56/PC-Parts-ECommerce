import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import AccountLayout from '../../components/layout/AccountLayout';
import type { AccountSection } from '../../components/layout/AccountLayout';
import UserInfoPanel from '../../components/profile/UserInfoPanel';
import ChangePasswordPanel from '../../components/profile/ChangePasswordPanel';
import OrderHistoryPanel from '../../components/profile/OrderHistoryPanel';
import { useAuth } from '../../hooks/useAuth';

const sections: AccountSection[] = [
  { id: 'profile', title: 'Thông tin cá nhân' },
  { id: 'password', title: 'Đổi mật khẩu' },
  { id: 'orders', title: 'Lịch sử đơn hàng' },
];

const ProfilePage: React.FC = () => {
  const [active, setActive] = useState<string>('profile');
  const { getProfile, loading } = useAuth();

  useEffect(() => {
    // Ensure current user profile is loaded when opening /profile
    getProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <AccountLayout sections={sections} activeId={active} onSelect={setActive}>
      {active === 'profile' && <UserInfoPanel />}
      {active === 'password' && <ChangePasswordPanel />}
      {active === 'orders' && <OrderHistoryPanel />}
    </AccountLayout>
  );
};

export default ProfilePage;
