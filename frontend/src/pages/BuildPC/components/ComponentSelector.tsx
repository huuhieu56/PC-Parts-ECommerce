import React, { useMemo, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Stack } from '@mui/material';
import type { SelectedParts } from '../types';
import type { Product } from '../../../types/product.types';
import { useCategories } from '../../../hooks/useQueryHooks';
import { resolveCategoryIdByKey } from '../utils/categoryMap';
import { PartPickerDialog } from './PartPickerDialog';

interface ComponentSelectorProps {
    selectedParts: SelectedParts;
    onSelect: (key: keyof SelectedParts, product: Product | null) => void;
    onRemove: (key: keyof SelectedParts) => void;
}

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({ selectedParts, onSelect, onRemove }) => {
    // Danh sách slot đầy đủ theo PartKey
    const slots: Array<{ key: keyof SelectedParts; label: string }> = [
        { key: 'cpu', label: 'CPU' },
        { key: 'mainboard', label: 'Mainboard' },
        { key: 'ram1', label: 'RAM' },
        { key: 'drive1', label: 'Ổ cứng 1 (SSD/HDD)' },
        { key: 'drive2', label: 'Ổ cứng 2 (SSD/HDD)' },
        { key: 'drive3', label: 'Ổ cứng 3 (SSD/HDD)' },
        { key: 'gpu', label: 'GPU' },
        { key: 'psu', label: 'PSU' },
        { key: 'case', label: 'Case' },
        { key: 'cpu_cooler', label: 'Tản nhiệt CPU (khí/AIO)' },
        { key: 'case_fan1', label: 'Quạt case (1)' },
        { key: 'case_fan2', label: 'Quạt case (2)' },
        { key: 'monitor', label: 'Màn hình' },
        { key: 'keyboard', label: 'Bàn phím' },
        { key: 'mouse', label: 'Chuột' },
    ];

    const { data: categories = [] } = useCategories();
    const [activeKey, setActiveKey] = useState<keyof SelectedParts | null>(null);
    const activeCategoryId = useMemo(() => (activeKey ? resolveCategoryIdByKey(activeKey as any, categories) : null), [activeKey, categories]);

    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Chọn linh kiện
                </Typography>
                <Stack spacing={1.5}>
                    {slots.map(s => {
                        const value = selectedParts[s.key];
                        return (
                            <Box
                                key={s.key}
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    justifyContent: 'space-between',
                                    gap: { xs: 1.5, sm: 0 },
                                    p: 1,
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                    borderRadius: 1
                                }}
                            >
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.label}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {value ? `${value.name} - ${value.price.toLocaleString('vi-VN')} ₫` : 'Chưa chọn'}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        width: { xs: '100%', sm: 'auto' },
                                        justifyContent: { xs: 'flex-start', sm: 'flex-end' }
                                    }}
                                >
                                    {value ? (
                                        <>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => onRemove(s.key)}
                                                sx={{ flexGrow: { xs: 1, sm: 0 } }}
                                            >
                                                Xóa
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                onClick={() => setActiveKey(s.key)}
                                                sx={{ flexGrow: { xs: 1, sm: 0 } }}
                                            >
                                                Thay
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={() => setActiveKey(s.key)}
                                            sx={{ flexGrow: { xs: 1, sm: 0 } }}
                                        >
                                            Chọn
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            </CardContent>
            <PartPickerDialog
                open={!!activeKey}
                onClose={() => setActiveKey(null)}
                categoryId={activeCategoryId}
                onSelect={(p) => {
                    if (activeKey) onSelect(activeKey, p);
                    setActiveKey(null);
                }}
            />
        </Card>
    );
};
