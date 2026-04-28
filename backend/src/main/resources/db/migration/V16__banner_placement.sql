ALTER TABLE banner
ADD COLUMN placement VARCHAR(20) NOT NULL DEFAULT 'CUSTOM';

CREATE INDEX idx_banner_placement_status
    ON banner(placement, status, sort_order, start_date, end_date);
