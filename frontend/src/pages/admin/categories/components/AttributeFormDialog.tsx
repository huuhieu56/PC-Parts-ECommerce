import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Button,
} from '@mui/material';
import { LoadingButton } from '../../../../components/common/LoadingButton';
import type { AttributeDefinition, AttributeDefinitionPayload } from '../../../../types/product.types';

interface AttributeFormDialogProps {
  open: boolean;
  categoryName?: string;
  initialValue?: AttributeDefinition;
  onClose: () => void;
  onSubmit: (payload: AttributeDefinitionPayload) => Promise<void>;
}

type InputTypeOption = {
  label: string;
  value: string;
  supportedDataTypes: string[];
};

const DATA_TYPE_OPTIONS = [
  { label: 'Chuỗi ký tự', value: 'string' },
  { label: 'Số', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Enum (danh sách cố định)', value: 'enum' },
];

const INPUT_TYPE_OPTIONS: InputTypeOption[] = [
  { label: 'Select (chọn 1)', value: 'select', supportedDataTypes: ['string', 'number', 'enum', 'boolean'] },
  { label: 'Multi Select (chọn nhiều)', value: 'multi_select', supportedDataTypes: ['string', 'enum'] },
  { label: 'Range (khoảng số)', value: 'range', supportedDataTypes: ['number'] },
  { label: 'Checkbox', value: 'checkbox', supportedDataTypes: ['boolean'] },
];

const DEFAULT_PAYLOAD: AttributeDefinitionPayload = {
  code: '',
  display_name: '',
  data_type: 'string',
  input_type: 'select',
  unit: undefined,
  sort_order: null,
  options: null,
  is_active: true,
};

const AttributeFormDialog: React.FC<AttributeFormDialogProps> = ({
  open,
  categoryName,
  initialValue,
  onClose,
  onSubmit,
}) => {
  const [formValue, setFormValue] = useState<AttributeDefinitionPayload>(DEFAULT_PAYLOAD);
  const [optionsText, setOptionsText] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);

  const isListInputType = useMemo(
    () => ['select', 'multi_select', 'checkbox'].includes((formValue.input_type || '').toLowerCase()),
    [formValue.input_type]
  );

  useEffect(() => {
    if (!open) return;

    if (initialValue) {
      setFormValue({
        code: initialValue.code,
        display_name: initialValue.display_name,
        data_type: initialValue.data_type,
        input_type: initialValue.input_type,
        unit: initialValue.unit ?? undefined,
        sort_order: initialValue.sort_order ?? null,
        options: initialValue.options ?? null,
        is_active: initialValue.is_active ?? true,
      });

      if (Array.isArray(initialValue.options)) {
        setOptionsText(initialValue.options.join('\n'));
      } else if (initialValue.options && typeof initialValue.options === 'object') {
        setOptionsText(JSON.stringify(initialValue.options, null, 2));
      } else if (initialValue.options) {
        setOptionsText(String(initialValue.options));
      } else {
        setOptionsText('');
      }
    } else {
      setFormValue(DEFAULT_PAYLOAD);
      setOptionsText('');
    }
    setErrors({});
  }, [open, initialValue]);

  const filteredInputTypeOptions = useMemo(() => {
    const activeType = formValue.data_type ?? 'string';
    return INPUT_TYPE_OPTIONS.filter((opt) => opt.supportedDataTypes.includes(activeType));
  }, [formValue.data_type]);

  const handleChange = (field: keyof AttributeDefinitionPayload) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setFormValue((prev) => ({
      ...prev,
      [field]: field === 'sort_order' ? (value ? Number(value) : null) : value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string | undefined> = {};

    if (!formValue.code?.trim()) nextErrors.code = 'Mã thuộc tính không được để trống';
    if (!formValue.display_name?.trim()) nextErrors.display_name = 'Tên hiển thị không được để trống';
    if (!formValue.data_type) nextErrors.data_type = 'Chọn loại dữ liệu';
    if (!formValue.input_type) nextErrors.input_type = 'Chọn kiểu nhập liệu';

    if (formValue.code && !/^[a-z0-9_-]+$/i.test(formValue.code)) {
      nextErrors.code = 'Mã chỉ chứa chữ cái, số, gạch ngang hoặc gạch dưới';
    }

    if (formValue.sort_order != null && Number.isNaN(Number(formValue.sort_order))) {
      nextErrors.sort_order = 'Thứ tự phải là số hợp lệ';
    }

    if (isListInputType) {
      const optionValues = optionsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (!optionValues.length) {
        nextErrors.options = 'Vui lòng nhập ít nhất một giá trị (mỗi dòng một giá trị)';
      }
    } else if (optionsText.trim()) {
      try {
        JSON.parse(optionsText);
      } catch (error) {
        nextErrors.options = 'Tùy chọn phải là JSON hợp lệ';
      }
    }

    setErrors(nextErrors);
    return Object.values(nextErrors).every((v) => !v);
  };

  const buildPayload = (): AttributeDefinitionPayload => {
    let options: any = null;
    if (optionsText.trim()) {
      if (isListInputType) {
        options = Array.from(
          new Set(
            optionsText
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
          )
        );
      } else {
        try {
          options = JSON.parse(optionsText);
        } catch (error) {
          options = null;
        }
      }
    }

    return {
      code: formValue.code.trim(),
      display_name: formValue.display_name.trim(),
      data_type: formValue.data_type,
      input_type: formValue.input_type,
      unit: formValue.unit?.trim() || undefined,
      sort_order: formValue.sort_order ?? undefined,
      options,
      is_active: formValue.is_active,
    };
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit(buildPayload());
      onClose();
    } catch (error) {
      console.error('AttributeFormDialog submit error', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {initialValue ? 'Chỉnh sửa thuộc tính' : 'Thêm thuộc tính mới'}
        {categoryName ? ` • ${categoryName}` : ''}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          label="Mã thuộc tính"
          value={formValue.code}
          onChange={handleChange('code')}
          inputProps={{ maxLength: 100 }}
          error={Boolean(errors.code)}
          helperText={errors.code || 'Ví dụ: brand, chipset, socket'}
          required
          disabled={Boolean(initialValue)}
        />

        <TextField
          label="Tên hiển thị"
          value={formValue.display_name}
          onChange={handleChange('display_name')}
          inputProps={{ maxLength: 200 }}
          error={Boolean(errors.display_name)}
          helperText={errors.display_name}
          required
        />

        <TextField
          label="Loại dữ liệu"
          select
          value={formValue.data_type}
          onChange={handleChange('data_type')}
          error={Boolean(errors.data_type)}
          helperText={errors.data_type || 'Chọn kiểu dữ liệu tương ứng với thuộc tính'}
          required
        >
          {DATA_TYPE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Kiểu nhập liệu"
          select
          value={formValue.input_type}
          onChange={handleChange('input_type')}
          error={Boolean(errors.input_type)}
          helperText={errors.input_type || 'Kiểu hiển thị trong bộ lọc/biểu mẫu'}
          required
        >
          {filteredInputTypeOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Đơn vị (nếu có)"
            value={formValue.unit ?? ''}
            onChange={handleChange('unit')}
            inputProps={{ maxLength: 50 }}
            fullWidth
          />
          <TextField
            label="Thứ tự"
            type="number"
            value={formValue.sort_order ?? ''}
            onChange={handleChange('sort_order')}
            error={Boolean(errors.sort_order)}
            helperText={errors.sort_order || 'Sắp xếp tăng dần'}
            sx={{ width: 160 }}
          />
        </Box>

        <TextField
          label={isListInputType ? 'Danh sách giá trị (mỗi dòng một giá trị)' : 'Tùy chọn nâng cao (JSON)'}
          value={optionsText}
          onChange={(e) => setOptionsText(e.target.value)}
          multiline
          minRows={3}
          error={Boolean(errors.options)}
          helperText={errors.options}
        />

        <FormControlLabel
          control={(
            <Checkbox
              checked={formValue.is_active !== false}
              onChange={(event) => setFormValue((prev) => ({
                ...prev,
                is_active: event.target.checked,
              }))}
            />
          )}
          label="Kích hoạt thuộc tính"
        />
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <LoadingButton onClick={handleSubmit} loading={submitting} variant="contained">
          {initialValue ? 'Cập nhật' : 'Thêm mới'}
        </LoadingButton>
        <Button onClick={onClose} variant="outlined" color="inherit" disabled={submitting}>
          Hủy
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttributeFormDialog;
