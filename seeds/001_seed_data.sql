-- Seed File: 001_seed_data.sql
-- Project: RetroPulse — Refurbished Vintage Electronics & Gaming Marketplace

-- 1. Insert Categories (Hierarchical Taxonomy)
INSERT INTO categories (id, name, slug, device_era, parent_category_id) VALUES
(1, 'Consoles', 'consoles', 'General', NULL),
(2, '8-Bit Home Consoles', '8-bit-home-consoles', '8-Bit Era (1983-1987)', 1),
(3, '16-Bit Home Consoles', '16-bit-home-consoles', '16-Bit Era (1988-1993)', 1),
(4, '32/64-Bit 3D Consoles', '32-64-bit-consoles', '5th Gen (1994-1999)', 1),
(5, 'Handhelds', 'handhelds', 'Portable (1989-2004)', NULL),
(6, 'Vintage Audio & CRTs', 'vintage-audio-crts', 'Retro A/V (1975-1995)', NULL),
(7, 'Replacement Parts & Mods', 'replacement-parts-mods', 'Hardware Components', NULL);

-- 2. Insert Users (password: password123)
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
(1, 'admin@retropulse.io', '$2b$10$wY9PjM2o3YjB0c7fN/6N..88r4W0uI6k47D5pOmvL5wH6d5F.4E9.', 'Elena Vance (Lead Technician)', 'admin'),
(2, 'collector@retropulse.io', '$2b$10$wY9PjM2o3YjB0c7fN/6N..88r4W0uI6k47D5pOmvL5wH6d5F.4E9.', 'Marcus Brody', 'buyer'),
(3, 'restorer@retropulse.io', '$2b$10$wY9PjM2o3YjB0c7fN/6N..88r4W0uI6k47D5pOmvL5wH6d5F.4E9.', 'Kenji Takahashi', 'restorer');

-- 3. Insert Products
INSERT INTO products (id, category_id, name, brand, description, refurbishment_notes, tested_functional, image_url) VALUES
(1, 2, 'Nintendo Entertainment System (NES-001)', 'Nintendo',
 'Front-loading 8-bit classic console. Serviced with new caps and gold-plated pins.',
 'Replaced all electrolytic capacitors with Nichicon high-temp caps. Installed OEM-spec gold-plated 72-pin connector. Disabled NES10 lockout chip for flashcart compatibility.', TRUE,
 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80'),

(2, 3, 'Sega Genesis Model 1 (High Definition Graphics)', 'Sega',
 'Iconic 16-bit console with discrete Yamaha YM2612 FM audio synthesizer.',
 'Mainboard cleaned in ultrasonic bath. Replaced power circuit capacitors. Headphone jack potentiometer cleaned and lubricated with DeoxIT.', TRUE,
 'https://images.unsplash.com/photo-1592155931584-901ac15763e3?auto=format&fit=crop&w=600&q=80'),

(3, 5, 'Nintendo Game Boy Color (CGB-001)', 'Nintendo',
 'Classic handheld console modernized with backlit IPS display and fresh components.',
 'Installed FunnyPlaying IPS V3 backlit display with 5-level touch brightness. Replaced speaker with 2W high-output component. Power switch cleaned.', TRUE,
 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?auto=format&fit=crop&w=600&q=80'),

(4, 4, 'Sony PlayStation 1 (SCPH-5501)', 'Sony',
 'Original grey PS1 with audiophile-grade DAC and brand-new optical laser pickup.',
 'Brand new KSM-440ADM optical laser mechanism installed and calibrated. Power supply board caps tested for low ESR.', TRUE,
 'https://images.unsplash.com/photo-1507457379470-08b800bebc67?auto=format&fit=crop&w=600&q=80'),

(5, 6, 'Sony Trinitron KV-13M42 13" CRT Monitor', 'Sony',
 'Curved aperture grille Trinitron CRT television with composite and mono audio inputs.',
 'Inspected flyback transformer. Yoke aligned and purity rings tuned. Internal chassis dusted.', TRUE,
 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80');

-- 4. Insert Product Variants (SKU Combination, Condition Grading & Stock Rules)
INSERT INTO product_variants (id, product_id, sku, variant_name, condition_grade, price, stock_quantity) VALUES
(1, 1, 'NES-001-MINT-01', 'Fully Recapped + Gold Pin Connector', 'Mint / Restored', 159.99, 4),
(2, 1, 'NES-001-WEAR-02', 'Working OEM Cleaned - Minor Case Yellowing', 'Working - Cosmetic Wear', 119.50, 2),
(3, 2, 'GEN-M1-HDG-MINT', 'Yamaha YM2612 Serviced Audio Edition', 'Mint / Restored', 139.00, 3),
(4, 3, 'GBC-IPS-ATOMIC', 'Atomic Purple IPS Backlit Mod', 'Refurbished - Shell Mod', 179.00, 5),
(5, 3, 'GBC-OEM-YELLOW', 'Dandelion Yellow OEM Screen Serviced', 'Working - Cosmetic Wear', 89.99, 1),
(6, 4, 'PS1-5501-LASER', 'New Laser Pickup + Recapped PSU', 'Mint / Restored', 99.00, 6),
(7, 5, 'CRT-KV13-CALIB', 'Tuned Geometry RGB / Composite Monitor', 'Working - Cosmetic Wear', 185.00, 1);

-- Reset Sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('product_variants_id_seq', (SELECT MAX(id) FROM product_variants));
