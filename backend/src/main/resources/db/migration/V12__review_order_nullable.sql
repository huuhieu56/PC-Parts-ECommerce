-- V12: Make review.order_id nullable for reviews without order
ALTER TABLE review ALTER COLUMN order_id DROP NOT NULL;
