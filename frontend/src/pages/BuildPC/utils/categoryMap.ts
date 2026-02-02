import type { Category } from '../../../types/product.types';
import type { PartKey } from '../types';

const KEY_TO_SLUG: Record<PartKey, string[]> = {
    cpu: ['cpu', 'processor'],
    mainboard: ['mainboard', 'motherboard', 'mb'],
    ram1: ['ram', 'memory'],
    drive1: ['ssd', 'hdd', 'solid-state', 'hard-drive', 'internal-hard-drive', 'external-hard-drive', 'storage', 'drive'],
    drive2: ['ssd', 'hdd', 'solid-state', 'hard-drive', 'internal-hard-drive', 'external-hard-drive', 'storage', 'drive'],
    drive3: ['ssd', 'hdd', 'solid-state', 'hard-drive', 'internal-hard-drive', 'external-hard-drive', 'storage', 'drive'],
    gpu: ['gpu', 'vga', 'video-card', 'graphics-card', 'graphics'],
    psu: ['psu', 'power-supply', 'nguon'],
    case: ['case', 'vo-may', 'pc-case'],
    cpu_cooler: ['cpu-cooler', 'cooler', 'tan-nhiet', 'aio', 'water-cooler'],
    case_fan1: ['case-fan', 'fan', 'case-fans'],
    case_fan2: ['case-fan', 'fan', 'case-fans'],
    monitor: ['monitor', 'man-hinh', 'display'],
    keyboard: ['keyboard', 'ban-phim'],
    mouse: ['mouse', 'chuot'],
};

const KEY_TO_CATEGORY_ID: Partial<Record<PartKey, number>> = {
    cpu: 1,
    gpu: 2,
    ram1: 3,
    mainboard: 4,
    psu: 5,
    case: 6,
    monitor: 7,
    keyboard: 8,
    mouse: 9,
    case_fan1: 19,
    case_fan2: 19,
    cpu_cooler: 20,
    drive1: 22,
    drive2: 22,
    drive3: 22,
};

const normalize = (s?: string) => (s || '').toLowerCase().replace(/\s+/g, '-');

export const resolveCategoryIdByKey = (key: PartKey, categories: Category[]): number | null => {
    const desiredId = KEY_TO_CATEGORY_ID[key];
    if (desiredId) {
        const matchById = categories.find(c => c.id === desiredId);
        if (matchById) return matchById.id;
    }

    const targets = KEY_TO_SLUG[key] || [];
    // 1) exact slug match
    for (const c of categories) {
        const slug = normalize(c.slug || c.name);
        if (targets.includes(slug)) return c.id;
    }
    // 2) name contains
    for (const c of categories) {
        const slug = normalize(c.slug || c.name);
        if (targets.some(t => slug.includes(t))) return c.id;
    }
    return null;
};
