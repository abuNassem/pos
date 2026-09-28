CREATE DATABASE IF NOT EXISTS POSSystem;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(100) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- admin_singleton TINYINT
    --     GENERATED ALWAYS AS (
    --         CASE
    --             WHEN role = 'admin' THEN 1
    --             ELSE NULL
    --         END
    --     ) STORED,

    -- UNIQUE KEY uq_single_admin (admin_singleton)
);


CREATE TABLE admin_profiles (
    user_id BIGINT UNSIGNED PRIMARY KEY,

    national_id VARCHAR(20) NOT NULL UNIQUE,

    birth_date DATE NOT NULL,

    CONSTRAINT fk_admin_profile_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);