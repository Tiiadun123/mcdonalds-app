-- Cấu trúc thư mục Supabase Schema & Seed Data

-- Bật extension để sinh UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Bảng Danh mục
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng Sản phẩm
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    stock_count INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng Đơn hàng (Cho phép khách hàng)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng Chi tiết đơn hàng
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_at_time DECIMAL(10, 2) NOT NULL
);

-- Bảng Đánh giá đơn hàng
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (order_id, product_id, user_id)
);

-- Bảng Voucher
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Bảng cấu hình thanh toán (MoMo/ZaloPay...)
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider VARCHAR(50) NOT NULL UNIQUE,
    account_name TEXT,
    account_phone TEXT,
    qr_image_url TEXT,
    deeplink_template TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Bảng giao dịch thanh toán
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    payment_code TEXT NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    qr_payload TEXT,
    raw_response JSONB,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunded'))
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_count INTEGER NOT NULL DEFAULT 100;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_ref TEXT;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'reviews_order_id_user_id_key'
    ) THEN
        ALTER TABLE public.reviews
            DROP CONSTRAINT reviews_order_id_user_id_key;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'reviews_order_product_user_key'
    ) THEN
        ALTER TABLE public.reviews
            ADD CONSTRAINT reviews_order_product_user_key
            UNIQUE (order_id, product_id, user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check'
    ) THEN
        ALTER TABLE public.orders
            ADD CONSTRAINT orders_status_check
            CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_method_check'
    ) THEN
        ALTER TABLE public.orders
            ADD CONSTRAINT orders_payment_method_check
            CHECK (payment_method IN ('cash', 'momo', 'zalopay'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_check'
    ) THEN
        ALTER TABLE public.orders
            ADD CONSTRAINT orders_payment_status_check
            CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired', 'refunded'));
    END IF;
END $$;

DROP INDEX IF EXISTS idx_reviews_order_user_unique;
DROP INDEX IF EXISTS idx_reviews_order_product_user_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_product_user_unique
    ON public.reviews(product_id, user_id)
    WHERE order_id IS NULL AND product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_created_at
    ON public.orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_category_id
    ON public.products(category_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
    ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
    ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_product
    ON public.order_items(order_id, product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id
    ON public.reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id
    ON public.payment_transactions(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_created
    ON public.payment_transactions(user_id, created_at DESC);

-- =======================================================
-- RLS & Policies (phù hợp luồng app hiện tại)
-- =======================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Categories: public read, admin write
DROP POLICY IF EXISTS categories_public_read ON public.categories;
CREATE POLICY categories_public_read
    ON public.categories FOR SELECT
    USING (true);

DROP POLICY IF EXISTS categories_admin_write ON public.categories;
DROP POLICY IF EXISTS categories_admin_insert ON public.categories;
CREATE POLICY categories_admin_insert
    ON public.categories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS categories_admin_update ON public.categories;
CREATE POLICY categories_admin_update
    ON public.categories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS categories_admin_delete ON public.categories;
CREATE POLICY categories_admin_delete
    ON public.categories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

-- Products: public read, admin write
DROP POLICY IF EXISTS products_public_read ON public.products;
CREATE POLICY products_public_read
    ON public.products FOR SELECT
    USING (true);

DROP POLICY IF EXISTS products_admin_write ON public.products;
DROP POLICY IF EXISTS products_admin_insert ON public.products;
CREATE POLICY products_admin_insert
    ON public.products FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS products_admin_update ON public.products;
CREATE POLICY products_admin_update
    ON public.products FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS products_admin_delete ON public.products;
CREATE POLICY products_admin_delete
    ON public.products FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

-- Orders: owner access + admin full access
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

DROP POLICY IF EXISTS orders_select_own ON public.orders;
DROP POLICY IF EXISTS orders_select_visible ON public.orders;
CREATE POLICY orders_select_visible
    ON public.orders FOR SELECT
    USING (
        user_id = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS orders_insert_own ON public.orders;
CREATE POLICY orders_insert_own
    ON public.orders FOR INSERT
    WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS orders_select_admin_all ON public.orders;

DROP POLICY IF EXISTS orders_update_admin_all ON public.orders;
CREATE POLICY orders_update_admin_all
    ON public.orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    )
    WITH CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled'));

-- Order items: owner theo order + admin
DROP POLICY IF EXISTS order_items_select_own ON public.order_items;
DROP POLICY IF EXISTS order_items_select_visible ON public.order_items;
CREATE POLICY order_items_select_visible
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND o.user_id = (select auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS order_items_insert_own ON public.order_items;
DROP POLICY IF EXISTS order_items_insert_admin_all ON public.order_items;
DROP POLICY IF EXISTS order_items_insert_allowed ON public.order_items;
CREATE POLICY order_items_insert_allowed
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND o.user_id = (select auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS order_items_select_admin_all ON public.order_items;

-- Reviews: owner + admin
DROP POLICY IF EXISTS reviews_select_own ON public.reviews;
DROP POLICY IF EXISTS reviews_select_visible ON public.reviews;
CREATE POLICY reviews_select_visible
    ON public.reviews FOR SELECT
    USING (
        user_id = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
CREATE POLICY reviews_insert_own
    ON public.reviews FOR INSERT
    WITH CHECK (
        user_id = (select auth.uid())
        AND EXISTS (
            SELECT 1
            FROM public.orders o
            WHERE o.id = order_id
              AND o.user_id = (select auth.uid())
              AND o.status = 'completed'
        )
        AND EXISTS (
            SELECT 1
            FROM public.order_items oi
                        WHERE oi.order_id = reviews.order_id
                            AND oi.product_id = reviews.product_id
        )
    );

DROP POLICY IF EXISTS reviews_select_admin_all ON public.reviews;

DROP POLICY IF EXISTS reviews_update_own ON public.reviews;
CREATE POLICY reviews_update_own
    ON public.reviews FOR UPDATE
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS reviews_update_admin_all ON public.reviews;
CREATE POLICY reviews_update_admin_all
    ON public.reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

-- Payment settings: public read active, admin write
DROP POLICY IF EXISTS payment_settings_public_read ON public.payment_settings;
CREATE POLICY payment_settings_public_read
    ON public.payment_settings FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS payment_settings_admin_write ON public.payment_settings;
DROP POLICY IF EXISTS payment_settings_admin_insert ON public.payment_settings;
CREATE POLICY payment_settings_admin_insert
    ON public.payment_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS payment_settings_admin_update ON public.payment_settings;
CREATE POLICY payment_settings_admin_update
    ON public.payment_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS payment_settings_admin_delete ON public.payment_settings;
CREATE POLICY payment_settings_admin_delete
    ON public.payment_settings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

-- Payment transactions: owner + admin
DROP POLICY IF EXISTS payment_tx_select_own ON public.payment_transactions;
DROP POLICY IF EXISTS payment_tx_select_visible ON public.payment_transactions;
CREATE POLICY payment_tx_select_visible
    ON public.payment_transactions FOR SELECT
    USING (
        user_id = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS payment_tx_insert_own ON public.payment_transactions;
DROP POLICY IF EXISTS payment_tx_admin_insert ON public.payment_transactions;
DROP POLICY IF EXISTS payment_tx_insert_allowed ON public.payment_transactions;
CREATE POLICY payment_tx_insert_allowed
    ON public.payment_transactions FOR INSERT
    WITH CHECK (
        user_id = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS payment_tx_admin_all ON public.payment_transactions;

DROP POLICY IF EXISTS payment_tx_admin_update ON public.payment_transactions;
CREATE POLICY payment_tx_admin_update
    ON public.payment_transactions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS payment_tx_admin_delete ON public.payment_transactions;
CREATE POLICY payment_tx_admin_delete
    ON public.payment_transactions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

-- Vouchers: admin only
DROP POLICY IF EXISTS vouchers_active_read ON public.vouchers;
CREATE POLICY vouchers_active_read
    ON public.vouchers FOR SELECT
    USING (
        is_active = true
        AND (expiry_date IS NULL OR expiry_date > timezone('utc'::text, now()))
    );

DROP POLICY IF EXISTS vouchers_admin_all ON public.vouchers;
DROP POLICY IF EXISTS vouchers_admin_insert ON public.vouchers;
CREATE POLICY vouchers_admin_insert
    ON public.vouchers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS vouchers_admin_update ON public.vouchers;
CREATE POLICY vouchers_admin_update
    ON public.vouchers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS vouchers_admin_delete ON public.vouchers;
CREATE POLICY vouchers_admin_delete
    ON public.vouchers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid()) AND p.role = 'admin'
        )
    );

-- Reload schema cache cho PostgREST sau migration nhiều DDL
SELECT pg_notify('pgrst', 'reload schema');

-- =======================================================
-- SEED DATA (Dữ liệu mẫu)
-- =======================================================

-- Seed Danh mục
INSERT INTO categories (id, name, slug) VALUES 
('11111111-1111-1111-1111-111111111111', 'Burgers', 'burgers'),
('22222222-2222-2222-2222-222222222222', 'Drinks', 'drinks'),
('33333333-3333-3333-3333-333333333333', 'Sides', 'sides')
ON CONFLICT (id) DO NOTHING;

-- Seed Sản phẩm
INSERT INTO products (category_id, name, description, price, image_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Big Mac', 'Classic Big Mac', 5.99, 'https://s7d1.scene7.com/is/image/mcdonalds/Header_BigMac_832x472:1-4-product-tile-desktop'),
('11111111-1111-1111-1111-111111111111', 'Cheeseburger', 'Simple Cheeseburger', 2.99, 'https://s7d1.scene7.com/is/image/mcdonalds/Header_Cheeseburger_832x472:1-4-product-tile-desktop'),
('22222222-2222-2222-2222-222222222222', 'Coca Cola', 'Cold refreshing Coke', 1.99, 'https://s7d1.scene7.com/is/image/mcdonalds/Header_MediumCocaColaGlass_832x472:1-4-product-tile-desktop'),
('33333333-3333-3333-3333-333333333333', 'World Famous Fries', 'Crispy Golden Fries', 2.49, 'https://s7d1.scene7.com/is/image/mcdonalds/Header_MediumFries_832x472:1-4-product-tile-desktop');
