-- AstraCloud VPS Panel Database Schema
-- Run this script to initialize the database

CREATE DATABASE IF NOT EXISTS astracloud;
USE astracloud;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- VPS Instances table
CREATE TABLE IF NOT EXISTS vps_instances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vmid INT UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    user_id INT NULL,
    ram_mb INT NOT NULL,
    cpu_cores INT NOT NULL,
    disk_gb INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    is_private_ip BOOLEAN DEFAULT FALSE,
    ssh_port INT NULL,
    proxmox_node VARCHAR(50) NOT NULL,
    status ENUM('running', 'stopped', 'suspended', 'expired') DEFAULT 'stopped',
    expiry_date DATE NULL,
    override_suspension BOOLEAN DEFAULT FALSE,
    suspension_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_vmid (vmid),
    INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- VPS Monitoring table
CREATE TABLE IF NOT EXISTS vps_monitoring (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vps_id INT NOT NULL,
    cpu_usage_percent DECIMAL(5,2) DEFAULT 0,
    ram_usage_percent DECIMAL(5,2) DEFAULT 0,
    disk_usage_percent DECIMAL(5,2) DEFAULT 0,
    network_in_bytes BIGINT DEFAULT 0,
    network_out_bytes BIGINT DEFAULT 0,
    overload_count INT DEFAULT 0,
    last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vps_id) REFERENCES vps_instances(id) ON DELETE CASCADE,
    INDEX idx_vps_id (vps_id),
    INDEX idx_last_check (last_check)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SSH Ports table for private IP allocation
CREATE TABLE IF NOT EXISTS ssh_ports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    port INT UNIQUE NOT NULL,
    vps_id INT NULL,
    is_allocated BOOLEAN DEFAULT FALSE,
    allocated_at TIMESTAMP NULL,
    FOREIGN KEY (vps_id) REFERENCES vps_instances(id) ON DELETE SET NULL,
    INDEX idx_port (port),
    INDEX idx_is_allocated (is_allocated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Branding table (single row)
CREATE TABLE IF NOT EXISTS branding (
    id INT PRIMARY KEY DEFAULT 1,
    panel_name VARCHAR(100) DEFAULT 'AstraCloud',
    logo_url TEXT NULL,
    primary_color VARCHAR(7) DEFAULT '#6366f1',
    secondary_color VARCHAR(7) DEFAULT '#8b5cf6',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Token blacklist for logout
CREATE TABLE IF NOT EXISTS token_blacklist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log for tracking admin actions
CREATE TABLE IF NOT EXISTS audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NULL,
    target_id INT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default branding
INSERT INTO branding (id, panel_name, primary_color, secondary_color) 
VALUES (1, 'AstraCloud', '#6366f1', '#8b5cf6')
ON DUPLICATE KEY UPDATE id=id;

-- Pre-populate SSH ports (10000-10500 initially)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS populate_ssh_ports()
BEGIN
    DECLARE i INT DEFAULT 10000;
    WHILE i <= 10500 DO
        INSERT IGNORE INTO ssh_ports (port, is_allocated) VALUES (i, FALSE);
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

CALL populate_ssh_ports();
DROP PROCEDURE IF EXISTS populate_ssh_ports;
