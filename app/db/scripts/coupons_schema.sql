-- Ejecutar en la BD all_in_one si npm run migrate:coupons no está disponible.
-- Crea tabla coupons y columnas en shopping_car.

CREATE TABLE IF NOT EXISTS `coupons` (
  `id_coupon` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `discount_type` varchar(20) NOT NULL COMMENT 'percent | fixed',
  `discount_value` decimal(12,4) NOT NULL,
  `min_purchase` decimal(12,4) DEFAULT 0,
  `max_uses` int DEFAULT NULL,
  `used_count` int NOT NULL DEFAULT 0,
  `valid_from` timestamp NULL DEFAULT NULL,
  `valid_until` timestamp NULL DEFAULT NULL,
  `status` int NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_coupon`),
  UNIQUE KEY `coupons_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Solo si aún no existen las columnas en shopping_car:
-- ALTER TABLE `shopping_car` ADD COLUMN `coupon_code` varchar(50) DEFAULT NULL;
-- ALTER TABLE `shopping_car` ADD COLUMN `coupon_discount` decimal(12,6) DEFAULT 0;

INSERT IGNORE INTO `coupons` (`code`, `description`, `discount_type`, `discount_value`, `min_purchase`, `status`, `used_count`)
VALUES
  ('ALLINONE10', '10% de descuento en tu compra', 'percent', 10, 0, 1, 0),
  ('BIENVENIDO25', '$25 de descuento en compras mayores a $100', 'fixed', 25, 100, 1, 0);
