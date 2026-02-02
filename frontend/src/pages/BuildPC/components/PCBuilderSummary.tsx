import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography, Button, TextField, InputAdornment } from '@mui/material';
import type { PriceTotals, SelectedParts, SelectedQuantities } from '../types';
import { exportQuotationExcel } from '../utils/excel';

interface Props {
    selectedParts: SelectedParts;
    quantities?: SelectedQuantities;
    totals: PriceTotals;
    onRemove: (key: keyof SelectedParts) => void;
    onUpdateQuantity?: (key: keyof SelectedParts, qty: number) => void;
    onReset: () => void;
    canExport?: boolean;
    onCheckout?: () => void | Promise<void>;
}

export const PCBuilderSummary: React.FC<Props> = ({ selectedParts, quantities = {} as SelectedQuantities, totals, onRemove, onUpdateQuantity, onReset, canExport, onCheckout }) => {
    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Tóm tắt cấu hình</Typography>
                <Stack spacing={1.25}>
                    {Object.entries(selectedParts).map(([key, p]) => (
                        <Box
                            key={key}
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                justifyContent: 'space-between',
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                gap: { xs: 1.5, sm: 1 }
                            }}
                        >
                            <Box sx={{ minWidth: 120 }}>
                                <Typography variant="body2" color="text.secondary">{key.toUpperCase()}</Typography>
                                <Typography variant="body2">{p ? p.name : '-'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-start', sm: 'flex-end' }, flexWrap: 'wrap' }}>
                                {p ? (
                                    <>
                                        <TextField
                                            size="small"
                                            type="number"
                                            inputProps={{ min: 1 }}
                                            value={quantities?.[key as keyof SelectedParts] ?? 1}
                                            onChange={(e) => onUpdateQuantity && onUpdateQuantity(key as keyof SelectedParts, Number(e.target.value))}
                                            sx={{ width: 100 }}
                                            InputProps={{ endAdornment: <InputAdornment position="end">cái</InputAdornment> }}
                                        />
                                        <Typography variant="body2" sx={{ minWidth: 120, textAlign: 'right' }}>{((p.price * (quantities?.[key as keyof SelectedParts] ?? 1))).toLocaleString('vi-VN')} ₫</Typography>
                                        <Button size="small" onClick={() => onRemove(key as keyof SelectedParts)}>Xóa</Button>
                                    </>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                            </Box>
                        </Box>
                    ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 0.75 }}>
                    <Typography color="text.secondary">Tạm tính</Typography>
                    <Typography>{totals.subtotal.toLocaleString('vi-VN')} ₫</Typography>
                    <Typography color="text.secondary">Thuế (VAT)</Typography>
                    <Typography>{totals.tax.toLocaleString('vi-VN')} ₫</Typography>
                    <Typography sx={{ fontWeight: 700 }}>Tổng</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>{totals.total.toLocaleString('vi-VN')} ₫</Typography>
                </Box>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    sx={{ mt: 2 }}
                >
                    <Button variant="outlined" color="inherit" onClick={onReset} sx={{ width: { xs: '100%', sm: 'auto' } }}>Làm mới</Button>
                    <Button
                        variant="outlined"
                        disabled={!canExport}
                        onClick={() => exportQuotationExcel(selectedParts, quantities, totals)}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        In đơn hàng / Xuất Excel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={!canExport}
                        onClick={() => { if (onCheckout) onCheckout(); }}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        Mua ngay
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
};
