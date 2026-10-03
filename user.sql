CREATE DATABASE IF NOT EXISTS POSSystem;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(100) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE admin_singleton (
    id TINYINT UNSIGNED PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    CONSTRAINT chk_single_admin
        CHECK (id = 1),

    CONSTRAINT fk_admin_singleton_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);