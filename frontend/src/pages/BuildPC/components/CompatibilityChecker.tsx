import React from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import type { CompatibilityIssue, SelectedParts } from '../types';

interface Props {
    selectedParts: SelectedParts;
    warnings: CompatibilityIssue[];
    onRequestAdvice?: () => void;
    advisorEnabled?: boolean;
    advisorLoading?: boolean;
    advisorError?: string | null;
    advisorSuggestions?: string[];
}

export const CompatibilityChecker: React.FC<Props> = ({
    warnings,
    onRequestAdvice,
    advisorEnabled,
    advisorLoading,
    advisorError,
    advisorSuggestions,
}) => {
    const hasIssues = warnings.length > 0;
    const canTrigger = Boolean(onRequestAdvice);
    const disabled = !advisorEnabled || !canTrigger;

    return (
        <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Kiểm tra tương thích
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Đảm bảo các linh kiện phù hợp và đầy đủ trước khi xuất cấu hình.
                        </Typography>
                    </Box>

                    {hasIssues ? (
                        <Stack spacing={1.5}>
                            {warnings.map((w, idx) => (
                                <Alert key={w.code || idx} severity={w.severity === 'error' ? 'error' : w.severity === 'warning' ? 'warning' : 'info'}>
                                    {w.message}
                                </Alert>
                            ))}
                        </Stack>
                    ) : (
                        <Alert severity="success">Chưa phát hiện vấn đề nào.</Alert>
                    )}

                                <Box>
                                    <Button
                                        variant="outlined"
                                        onClick={onRequestAdvice}
                                        disabled={advisorLoading || disabled}
                                        sx={{ mr: 1 }}
                                    >
                                        {advisorLoading ? <CircularProgress size={18} /> : 'Nhờ AI (Gemini) phân tích thêm'}
                                    </Button>
                                    <Typography variant="caption" color="text.secondary">
                                        Tùy chọn: yêu cầu gợi ý chi tiết từ AI thông qua endpoint cấu hình sẵn.
                                    </Typography>
                                    {!advisorEnabled && (
                                        <Typography variant="caption" color="warning.main" display="block">
                                            Chưa cấu hình `VITE_PC_ADVISOR_ENDPOINT`, nút sẽ hoạt động sau khi thêm endpoint.
                                        </Typography>
                                    )}
                                </Box>

                                {advisorError && (
                        <Box>
                                        <Alert severity="error">{advisorError}</Alert>
                        </Box>
                    )}

                    {advisorSuggestions && advisorSuggestions.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Gợi ý từ AI:</Typography>
                            <Stack spacing={1.25}>
                                {advisorSuggestions.map((tip, idx) => (
                                    <Alert key={idx} severity="info">{tip}</Alert>
                                ))}
                            </Stack>
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};
