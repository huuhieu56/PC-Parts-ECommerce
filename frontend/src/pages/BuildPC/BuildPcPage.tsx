import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Container, Typography, Paper, Button, Tabs, Tab, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ComponentSelector } from './components/ComponentSelector.tsx';
import { PCBuilderSummary } from './components/PCBuilderSummary.tsx';
import { CompatibilityChecker } from './components/CompatibilityChecker.tsx';
// import { usePcBuilderState } from './state/usePcBuilderState';
import { usePcBuilderMultiState } from './state/usePcBuilderMultiState';
import type { Product } from '../../types/product.types';
import { useNavigate } from 'react-router-dom';
import { aggregateCompatibility } from './utils/compatibility';
import { aiAdvisorService, buildAdvisorPayload } from '../../services/aiAdvisor.service';

// page title constant removed

const BuildPcPage: React.FC = () => {
    const multi = usePcBuilderMultiState();
    const selectedParts = multi.selectedParts;
    const totals = multi.totals;

    const actions = multi.actions;
    const navigate = useNavigate();

    const compatibilityIssues = useMemo(() => aggregateCompatibility(selectedParts), [selectedParts]);
    const advisorEnabled = aiAdvisorService.isConfigured();
    const [advisorLoading, setAdvisorLoading] = useState(false);
    const [advisorError, setAdvisorError] = useState<string | null>(null);
    const [advisorSuggestions, setAdvisorSuggestions] = useState<string[]>([]);

    const hasAnyPart = useMemo(() => Object.values(selectedParts).some(Boolean), [selectedParts]);

    // Rename dialog state
    const [renameOpen, setRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState<string>('');

    const openRename = () => {
        const current = multi.configs.find(c => c.id === multi.activeId);
        setRenameValue(current?.name || '');
        setRenameOpen(true);
    };
    const closeRename = () => setRenameOpen(false);
    const confirmRename = () => {
        const val = renameValue.trim();
        if (val) multi.renameConfig(multi.activeId, val);
        setRenameOpen(false);
    };

    const handleDeleteConfig = () => {
        if (multi.configs.length <= 1) return;
        const current = multi.configs.find(c => c.id === multi.activeId);
        const ok = window.confirm(`Xóa "${current?.name || 'cấu hình hiện tại'}"?`);
        if (ok) multi.removeConfig(multi.activeId);
    };

    const handleCheckout = async () => {
        // Package selected parts as build-pc checkout items and pass to order page
        const keys = Object.keys(selectedParts) as Array<keyof typeof selectedParts>;
        const products = keys.map(k => ({ key: k, product: selectedParts[k] })).filter(x => x.product) as { key: keyof typeof selectedParts; product: Product }[];
        if (products.length === 0) return;
        const buildItems = products.map(({ key, product }) => {
            const previewImage = product.image_url
                || product.images?.find((img) => img.is_primary)?.file_path
                || (product.images && product.images.length > 0 ? product.images[0].file_path : null);

            return {
                product_id: product.id,
                product,
                product_name: product.name,
                name: product.name,
                category_name: product.category?.name,
                quantity: multi.quantities?.[key] ?? 1,
                unit_price: product.price,
                total_price: product.price * (multi.quantities?.[key] ?? 1),
                image_url: previewImage,
                thumbnail: previewImage,
            };
        });
        const payload = {
            source: 'buildpc' as const,
            created_at: Date.now(),
            items: buildItems,
        };
        try { sessionStorage.setItem('build_pc_checkout', JSON.stringify(payload)); } catch (_) { /* ignore */ }
        navigate('/order/build-pc', { state: { source: 'buildpc', items: buildItems } });
    };

    useEffect(() => {
        setAdvisorError(null);
        setAdvisorSuggestions([]);
    }, [compatibilityIssues]);

    const handleAdvisorRequest = useCallback(async () => {
        if (!advisorEnabled) {
            setAdvisorError('Chức năng AI chưa được cấu hình. Vui lòng kiểm tra các biến môi trường Gemini/custom advisor.');
            return;
        }
        setAdvisorLoading(true);
        setAdvisorError(null);
        try {
            const payload = buildAdvisorPayload(selectedParts, compatibilityIssues);
            const response = await aiAdvisorService.analyzeBuild(payload);
            const items = Array.isArray(response.advice) ? response.advice.filter(Boolean) : [];
            const suggestions: string[] = [];
            if (typeof response.compatibility_score === 'number' && !Number.isNaN(response.compatibility_score)) {
                suggestions.push(`Điểm tương thích: ${response.compatibility_score.toFixed(1)}/10`);
            }
            if (response.bottleneck_analysis) {
                suggestions.push(`Bottleneck: ${response.bottleneck_analysis}`);
            }
            if (response.summary) {
                suggestions.push(response.summary);
            }
            suggestions.push(...items);
            setAdvisorSuggestions(suggestions);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể lấy gợi ý từ AI';
            setAdvisorError(message);
        } finally {
            setAdvisorLoading(false);
        }
    }, [advisorEnabled, compatibilityIssues, selectedParts]);

    return (
        <>
            {/* Page title removed - meta description removed with Helmet */}

            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box />
                    <Box>
                        <Tooltip title="Đổi tên cấu hình">
                            <span>
                                <IconButton size="small" onClick={openRename} aria-label="Đổi tên cấu hình" sx={{ mr: 0.5 }}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title={multi.configs.length <= 1 ? 'Phải giữ ít nhất 1 cấu hình' : 'Xóa cấu hình hiện tại'}>
                            <span>
                                <IconButton size="small" onClick={handleDeleteConfig} aria-label="Xóa cấu hình" disabled={multi.configs.length <= 1} sx={{ mr: 0.5 }}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Thêm cấu hình mới">
                            <IconButton size="small" onClick={() => multi.addConfig()} aria-label="Thêm cấu hình mới">
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Tabs
                    value={multi.configs.findIndex(c => c.id === multi.activeId)}
                    onChange={(_, idx) => { const id = multi.configs[idx]?.id; if (id) multi.setActive(id); }}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ mb: 2 }}
                    aria-label="Danh sách cấu hình"
                >
                    {multi.configs.map((cfg) => (
                        <Tab key={cfg.id} label={cfg.name} aria-label={`Chọn ${cfg.name}`} />
                    ))}
                </Tabs>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                    <Box>
                        <ComponentSelector selectedParts={selectedParts} onSelect={actions.selectPart} onRemove={actions.removePart} />
                        {/* Compatibility check removed as requested */}
                    </Box>

                    <Box sx={{ position: { md: 'sticky' }, top: { md: 88 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <CompatibilityChecker
                            selectedParts={selectedParts}
                            warnings={compatibilityIssues}
                            onRequestAdvice={handleAdvisorRequest}
                            advisorEnabled={advisorEnabled}
                            advisorLoading={advisorLoading}
                            advisorError={advisorError}
                            advisorSuggestions={advisorSuggestions}
                        />
                        <PCBuilderSummary selectedParts={selectedParts} quantities={multi.quantities} totals={totals} onRemove={actions.removePart} onUpdateQuantity={actions.updateQuantity} onReset={actions.reset} canExport={hasAnyPart} onCheckout={handleCheckout} />
                    </Box>
                </Box>

                {/* Mobile sticky summary bar */}
                <Paper elevation={3} sx={{
                    display: { xs: 'flex', md: 'none' },
                    position: 'sticky',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 1.5,
                    mt: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backdropFilter: 'saturate(180%) blur(8px)'
                }} aria-label="Tổng tiền cấu hình">
                    <Box>
                        <Typography variant="caption" color="text.secondary">Tổng ước tính</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{totals.total.toLocaleString('vi-VN')} ₫</Typography>
                    </Box>
                    <Button variant="contained" disabled={!hasAnyPart} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Xem chi tiết cấu hình">
                        Xem chi tiết
                    </Button>
                </Paper>
            </Container>

            <Dialog open={renameOpen} onClose={closeRename} aria-labelledby="rename-config-title">
                <DialogTitle id="rename-config-title">Đổi tên cấu hình</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        fullWidth
                        label="Tên cấu hình"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeRename}>Hủy</Button>
                    <Button variant="contained" onClick={confirmRename} disabled={!renameValue.trim()}>Lưu</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default BuildPcPage;
