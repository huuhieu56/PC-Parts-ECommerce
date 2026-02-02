import type { CompatibilityIssue, IssueSeverity, PartKey, SelectedParts } from '../types';

const REQUIRED_PARTS: Array<{ key: PartKey; message: string }> = [
    { key: 'cpu', message: 'Cấu hình chưa có CPU.' },
    { key: 'mainboard', message: 'Cần chọn Mainboard tương thích với CPU.' },
    { key: 'ram1', message: 'Nên bổ sung ít nhất một thanh RAM.' },
    { key: 'psu', message: 'Cần có PSU để cấp nguồn cho hệ thống.' },
    { key: 'case', message: 'Chưa chọn vỏ case cho dàn máy.' },
];

const SEVERITY_ORDER: Record<IssueSeverity, number> = {
    error: 3,
    warning: 2,
    info: 1,
};

const normalise = (value?: string | number | null): string => {
    if (value == null) return '';
    if (typeof value === 'number') return value.toString();
    return value.toString().trim().toLowerCase();
};

const pickValue = (product: NonNullable<SelectedParts[keyof SelectedParts]>, keys: string[]): string | number | null => {
    const source: Record<string, unknown> = {
        ...(product.specifications || {}),
        ...(product.attributes || {}),
    };
    for (const key of keys) {
        const target = Object.keys(source).find(k => k.toLowerCase() === key.toLowerCase());
        if (target) {
            const raw = source[target];
            if (raw === undefined || raw === null) continue;
            if (typeof raw === 'number') return raw;
            if (typeof raw === 'string') return raw;
            if (typeof raw === 'object') {
                const maybeValue = (raw as { value?: unknown })?.value;
                if (typeof maybeValue === 'number' || typeof maybeValue === 'string') {
                    return maybeValue as string | number;
                }
            }
        }
    }
    return null;
};

const parseNumber = (value: string | number | null): number | null => {
    if (value == null) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
        const base = typeof value === 'string' ? value : value.toString();
        const sanitized = base.replace(/,/g, '.');
    const match = sanitized.match(/-?\d+(\.\d+)?/);
    if (!match) return null;
    return Number(match[0]);
};

const parseWatt = (value: string | number | null): number | null => {
    const parsed = parseNumber(value);
    if (parsed == null) return null;
    return parsed;
};

const parseFrequencyGHz = (value: string | number | null): number | null => {
    const parsed = parseNumber(value);
    if (parsed == null) return null;
    if (typeof value === 'string' && /mhz/i.test(value)) {
        return parsed / 1000;
    }
    return parsed;
};

const appendIssue = (
    list: CompatibilityIssue[],
    issue: CompatibilityIssue,
) => {
    const exists = list.find(item => item.code === issue.code);
    if (!exists) list.push(issue);
};

export const aggregateCompatibility = (parts: SelectedParts): CompatibilityIssue[] => {
    const issues: CompatibilityIssue[] = [];

    REQUIRED_PARTS.forEach(({ key, message }) => {
        if (!parts[key]) {
            appendIssue(issues, {
                code: `missing_${key}`,
                message,
                severity: key === 'cpu' || key === 'mainboard' ? 'error' : 'warning',
                related: [key],
            });
        }
    });

    if (!parts.drive1 && !parts.drive2 && !parts.drive3) {
        appendIssue(issues, {
            code: 'missing_storage',
            message: 'Bạn chưa chọn ổ lưu trữ (SSD/HDD).',
            severity: 'warning',
            related: ['drive1', 'drive2', 'drive3'],
        });
    }

    const cpu = parts.cpu;
    const mainboard = parts.mainboard;
    const ram = parts.ram1;
    const gpu = parts.gpu;
    const psu = parts.psu;
    const cooler = parts.cpu_cooler;
    const pcCase = parts.case;

    if (cpu && mainboard) {
        const cpuSocket = normalise(pickValue(cpu, ['socket', 'cpu_socket', 'cpu-socket']));
        const boardSocket = normalise(pickValue(mainboard, ['socket', 'cpu_socket', 'socket_type']));
        if (cpuSocket && boardSocket && cpuSocket !== boardSocket) {
            appendIssue(issues, {
                code: 'socket_mismatch',
                message: `Socket CPU (${cpuSocket}) không khớp với socket mainboard (${boardSocket}).`,
                severity: 'error',
                related: ['cpu', 'mainboard'],
            });
        }

        const cpuGen = normalise(pickValue(cpu, ['chipset', 'generation', 'series']));
        const boardChipset = normalise(pickValue(mainboard, ['chipset', 'compatible_chipsets']));
        if (cpuGen && boardChipset && !boardChipset.includes(cpuGen)) {
            appendIssue(issues, {
                code: 'chipset_warning',
                message: 'Chipset mainboard có thể không tương thích hoàn toàn với CPU, vui lòng kiểm tra lại.',
                severity: 'warning',
                related: ['cpu', 'mainboard'],
            });
        }
    }

    if (ram && mainboard) {
        const ramType = normalise(pickValue(ram, ['memory_type', 'ram_type', 'type'])).toUpperCase();
        const boardType = normalise(pickValue(mainboard, ['memory_type', 'supported_memory', 'ram_type'])).toUpperCase();
        if (ramType && boardType && !boardType.includes(ramType)) {
            appendIssue(issues, {
                code: 'ram_type_mismatch',
                message: `Mainboard hỗ trợ ${boardType}, trong khi RAM đang là ${ramType}.`,
                severity: 'error',
                related: ['ram1', 'mainboard'],
            });
        }

        const boardMaxSpeed = parseNumber(pickValue(mainboard, ['max_memory_speed', 'memory_speed_max', 'memory_speed']));
        const ramSpeed = parseNumber(pickValue(ram, ['speed', 'memory_speed', 'frequency']));
        if (boardMaxSpeed && ramSpeed && ramSpeed > boardMaxSpeed + 100) {
            appendIssue(issues, {
                code: 'ram_speed_warning',
                message: `Xung RAM (${ramSpeed} MHz) cao hơn mức hỗ trợ của mainboard (${boardMaxSpeed} MHz).`,
                severity: 'warning',
                related: ['ram1', 'mainboard'],
            });
        }
    }

    if (cpu && !cooler) {
        const cpuTdp = parseWatt(pickValue(cpu, ['tdp', 'power', 'max_tdp']));
        if (cpuTdp && cpuTdp >= 95) {
            appendIssue(issues, {
                code: 'missing_cooler',
                message: 'CPU công suất cao, nên bổ sung tản nhiệt phù hợp.',
                severity: 'warning',
                related: ['cpu_cooler', 'cpu'],
            });
        }
    }

    if (cpu && cooler) {
        const cpuTdp = parseWatt(pickValue(cpu, ['tdp', 'power', 'max_tdp']));
        const coolerTdp = parseWatt(pickValue(cooler, ['tdp', 'cooling_capacity', 'max_tdp']));
        if (cpuTdp && coolerTdp && coolerTdp < cpuTdp) {
            appendIssue(issues, {
                code: 'cooler_capacity_low',
                message: `Tản nhiệt có công suất ${coolerTdp}W, thấp hơn mức CPU yêu cầu (${cpuTdp}W).`,
                severity: 'warning',
                related: ['cpu_cooler', 'cpu'],
            });
        }
    }

    if (gpu && psu) {
        const gpuRecommended = parseWatt(pickValue(gpu, ['recommended_psu', 'recommended_power', 'psu_recommendation']));
        const psuWatt = parseWatt(pickValue(psu, ['wattage', 'power', 'output_power']));
        if (gpuRecommended && psuWatt && psuWatt < gpuRecommended) {
            appendIssue(issues, {
                code: 'psu_under_requirement',
                message: `PSU ${psuWatt}W thấp hơn mức khuyến nghị cho GPU (${gpuRecommended}W).`,
                severity: 'error',
                related: ['psu', 'gpu'],
            });
        } else if (psuWatt) {
            const cpuTdp = cpu ? (parseWatt(pickValue(cpu, ['tdp', 'power', 'max_tdp'])) || 0) : 0;
            const gpuTdp = parseWatt(pickValue(gpu, ['tdp', 'board_power', 'power_draw'])) || 0;
            const estimated = cpuTdp + gpuTdp + 150; // buffer for các linh kiện khác
            if (estimated > 0 && psuWatt < estimated) {
                appendIssue(issues, {
                    code: 'psu_margin_low',
                    message: `PSU ${psuWatt}W có thể thiếu công suất (ước tính cần ~${estimated}W).`,
                    severity: 'warning',
                    related: ['psu', 'gpu', 'cpu'],
                });
            }
        }
    }

    if (gpu && cpu) {
        const cpuCores = parseNumber(pickValue(cpu, ['cores', 'core_count', 'num_cores'])) || 0;
        const cpuThreads = parseNumber(pickValue(cpu, ['threads', 'thread_count'])) || 0;
        const cpuBoost = parseFrequencyGHz(pickValue(cpu, ['boost_clock', 'max_clock', 'base_clock']));
        const cpuScore = (cpuThreads || cpuCores * 2 || 0) * (cpuBoost || 3.5);
        const gpuVram = parseNumber(pickValue(gpu, ['memory_size', 'vram', 'memory'])) || 0;
        const gpuPower = parseWatt(pickValue(gpu, ['tdp', 'board_power', 'power_draw'])) || 0;
        if (gpuVram >= 12 && cpuScore < 50) {
            appendIssue(issues, {
                code: 'cpu_gpu_bottleneck_warning',
                message: 'GPU mạnh có thể bị giới hạn bởi CPU hiện tại. Cân nhắc nâng cấp CPU.',
                severity: 'info',
                related: ['cpu', 'gpu'],
            });
        } else if (gpuPower >= 300 && cpuCores <= 6) {
            appendIssue(issues, {
                code: 'cpu_gpu_balance',
                message: 'Hệ thống có thể gặp bottleneck ở các tựa game CPU-bound. Kiểm tra lại cân bằng CPU/GPU.',
                severity: 'info',
                related: ['cpu', 'gpu'],
            });
        }
    }

    if (pcCase && gpu) {
        const caseLimit = parseNumber(pickValue(pcCase, ['gpu_max_length', 'max_gpu_length', 'gpu_length_limit']));
        const gpuLength = parseNumber(pickValue(gpu, ['length', 'gpu_length', 'card_length']));
        if (caseLimit && gpuLength && gpuLength > caseLimit) {
            appendIssue(issues, {
                code: 'gpu_case_fit',
                message: `Chiều dài GPU (${gpuLength}mm) vượt quá giới hạn của case (${caseLimit}mm).`,
                severity: 'error',
                related: ['case', 'gpu'],
            });
        }
    }

    if (pcCase && parts.cpu_cooler) {
        const caseCoolerLimit = parseNumber(pickValue(pcCase, ['cpu_cooler_clearance', 'max_cooler_height']));
        const activeCooler = parts.cpu_cooler;
        const coolerHeight = activeCooler ? parseNumber(pickValue(activeCooler, ['height', 'cooler_height'])) : null;
        if (caseCoolerLimit && coolerHeight && coolerHeight > caseCoolerLimit) {
            appendIssue(issues, {
                code: 'cooler_case_fit',
                message: `Tản nhiệt cao ${coolerHeight}mm, có thể không vừa với case (giới hạn ${caseCoolerLimit}mm).`,
                severity: 'warning',
                related: ['case', 'cpu_cooler'],
            });
        }
    }

    issues.sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
    return issues;
};
