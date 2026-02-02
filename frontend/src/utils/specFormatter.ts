const SPEC_LABEL_DICTIONARY: Record<string, string> = {
  airflow: 'Lưu lượng gió (CFM)',
  amount: 'Số lượng thành phần',
  architecture: 'Kiến trúc',
  aspect_ratio: 'Tỷ lệ khung hình',
  backlit: 'Đèn nền',
  base_clock: 'Xung nhịp cơ bản',
  bd: 'Hỗ trợ Blu-ray',
  bd_write: 'Ghi Blu-ray',
  boost_clock: 'Xung nhịp boost',
  brand: 'Thương hiệu',
  cache: 'Bộ nhớ đệm',
  cache_type: 'Loại bộ nhớ đệm',
  capacity: 'Dung lượng',
  capacity_va: 'Công suất (VA)',
  capacity_w: 'Công suất (W)',
  cas_latency: 'Độ trễ CAS',
  cd: 'Hỗ trợ CD',
  cd_write: 'Ghi CD',
  channel_wattage: 'Công suất mỗi kênh',
  channels: 'Số kênh',
  chipset: 'Chipset',
  clock_speed: 'Tốc độ xung nhịp',
  color: 'Màu sắc',
  configuration: 'Cấu hình',
  connection: 'Kết nối',
  connection_type: 'Loại kết nối',
  connector: 'Chuẩn kết nối',
  controller: 'Bộ điều khiển',
  cooling: 'Giải pháp tản nhiệt',
  core_clock: 'Xung nhịp lõi',
  core_count: 'Số nhân',
  cores: 'Số nhân',
  digital_audio: 'Âm thanh số',
  dvd: 'Hỗ trợ DVD',
  dvd_write: 'Ghi DVD',
  efficiency: 'Hiệu suất',
  efficiency_cores: 'Nhân tiết kiệm điện',
  enclosure_type: 'Loại vỏ',
  external_volume: 'Thể tích ngoài (L)',
  fan_size: 'Kích thước quạt',
  fan_speed: 'Tốc độ quạt',
  first_word_latency: 'Độ trễ truy cập đầu tiên',
  focus_type: 'Kiểu lấy nét',
  form_factor: 'Chuẩn kích thước',
  fov: 'Góc nhìn (FOV)',
  frequency_response: 'Dải tần',
  game_clock: 'Xung nhịp chơi game',
  graphics: 'Đồ họa tích hợp',
  graphics_chipset: 'Chip đồ họa',
  graphics_model: 'Model đồ họa',
  graphics_memory: 'Bộ nhớ đồ họa',
  hand_orientation: 'Tay thuận',
  height: 'Chiều cao',
  interface: 'Giao tiếp',
  internal_35_bays: 'Khay 3.5" bên trong',
  io_ports: 'Cổng kết nối',
  launch_date: 'Ngày ra mắt',
  length: 'Chiều dài',
  l1_cache: 'Bộ nhớ đệm L1',
  l2_cache: 'Bộ nhớ đệm L2',
  l3_cache: 'Bộ nhớ đệm L3',
  manufacturer: 'Nhà sản xuất',
  max_capacity: 'Dung lượng tối đa',
  max_dpi: 'Độ nhạy tối đa (DPI)',
  max_memory: 'Dung lượng RAM tối đa',
  max_memory_size: 'Dung lượng RAM tối đa',
  max_threads: 'Số luồng tối đa',
  memory: 'Bộ nhớ',
  memory_channels: 'Số kênh bộ nhớ',
  memory_clock: 'Xung nhịp bộ nhớ',
  memory_frequency: 'Tần số bộ nhớ',
  memory_slots: 'Số khe RAM',
  memory_speed: 'Tốc độ bộ nhớ',
  memory_support: 'Hỗ trợ bộ nhớ',
  memory_type: 'Loại bộ nhớ',
  micro_architecture: 'Vi kiến trúc',
  microarchitecture: 'Vi kiến trúc',
  microphone: 'Micro tích hợp',
  mode: 'Chế độ hoạt động',
  modular: 'Cáp rời (Modular)',
  model: 'Mẫu sản phẩm',
  modules: 'Số thanh/Module',
  name: 'Tên sản phẩm',
  noise_level: 'Độ ồn (dBA)',
  origin: 'Xuất xứ',
  os: 'Hệ điều hành',
  panel_type: 'Loại tấm nền',
  performance_cores: 'Nhân hiệu năng',
  power: 'Công suất',
  price_per_gb: 'Giá trên mỗi GB',
  process: 'Tiến trình sản xuất',
  process_size: 'Tiến trình sản xuất',
  protocol: 'Giao thức',
  psu: 'Nguồn đi kèm',
  pwm: 'Hỗ trợ PWM',
  random_read: 'Tốc độ đọc ngẫu nhiên',
  random_write: 'Tốc độ ghi ngẫu nhiên',
  read_speed: 'Tốc độ đọc',
  refresh_rate: 'Tần số quét',
  release_date: 'Ngày ra mắt',
  release_year: 'Năm ra mắt',
  resolution: 'Độ phân giải',
  resolutions: 'Độ phân giải hỗ trợ',
  response_time: 'Thời gian phản hồi',
  rpm: 'Tốc độ quạt (RPM)',
  sample_rate: 'Tần số lấy mẫu',
  screen_size: 'Kích thước màn hình',
  sequential_read: 'Tốc độ đọc tuần tự',
  sequential_write: 'Tốc độ ghi tuần tự',
  series: 'Dòng sản phẩm',
  side_panel: 'Panel hông',
  size: 'Kích thước',
  snr: 'Tỷ lệ tín hiệu/nhiễu (SNR)',
  socket: 'Socket',
  source_category: 'Danh mục nguồn',
  source_file: 'Nguồn dữ liệu',
  speed: 'Tốc độ',
  style: 'Kiểu dáng',
  switches: 'Loại switch',
  tdp: 'TDP',
  tenkeyless: 'Bố cục Tenkeyless',
  thread_count: 'Số luồng',
  threads: 'Số luồng',
  tracking_method: 'Công nghệ theo dõi',
  type: 'Loại sản phẩm',
  voltage: 'Điện áp',
  warranty: 'Bảo hành',
  wattage: 'Công suất',
  weight: 'Khối lượng',
  width: 'Chiều rộng',
  wireless: 'Kết nối không dây',
  write_speed: 'Tốc độ ghi',
};

const normalizeSpecKey = (key: string) => key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

const prettifyLabel = (key: string) => {
  const spaced = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return spaced.replace(/\b(\w)/g, (match) => match.toUpperCase());
};

const formatNumber = (value: number) => {
  const hasDecimal = !Number.isInteger(value);
  return value.toLocaleString('vi-VN', {
    minimumFractionDigits: hasDecimal ? 2 : 0,
    maximumFractionDigits: hasDecimal ? 2 : 0,
  });
};

export const formatSpecLabel = (key: string) => {
  const normalized = normalizeSpecKey(key);
  return SPEC_LABEL_DICTIONARY[normalized] ?? prettifyLabel(key);
};

export const formatSpecValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return 'Đang cập nhật';
  }
  if (typeof value === 'boolean') {
    return value ? 'Có' : 'Không';
  }
  if (typeof value === 'number') {
    return formatNumber(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatSpecValue(item)).join(', ');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return 'Đang cập nhật';
  }
  const lower = trimmed.toLowerCase();
  if (lower === 'true' || lower === 'false') {
    return lower === 'true' ? 'Có' : 'Không';
  }
  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    return formatNumber(numeric);
  }
  return trimmed;
};
