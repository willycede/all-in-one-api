-- Ejecutar en la BD all_in_one si npm run migrate:modifiers no está disponible.
-- Crea tabla product_modifiers, columnas en shopping_car_details y
-- la categoría general "Asientos" con sus subcategorías.

CREATE TABLE IF NOT EXISTS `product_modifiers` (
  `id_modifier` int unsigned NOT NULL AUTO_INCREMENT,
  `id_products` int NOT NULL,
  `type` varchar(30) NOT NULL DEFAULT 'color',
  `name` varchar(100) NOT NULL,
  `price_delta` decimal(12,4) NOT NULL DEFAULT 0,
  `status` int NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_modifier`),
  KEY `product_modifiers_id_products_index` (`id_products`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Solo si aún no existen las columnas en shopping_car_details:
-- ALTER TABLE `shopping_car_details` ADD COLUMN `id_modifier` int DEFAULT NULL;
-- ALTER TABLE `shopping_car_details` ADD COLUMN `modifier_name` varchar(100) DEFAULT NULL;
-- ALTER TABLE `shopping_car_details` ADD COLUMN `modifier_price` decimal(12,4) NOT NULL DEFAULT 0;
-- ALTER TABLE `shopping_car_details` ADD COLUMN `id_city` int DEFAULT NULL;

-- Categoría general "Asientos" (solo si no existe):
-- INSERT INTO `general_categories` (`name`, `description`, `status`)
-- VALUES ('Asientos', 'Tapices y asientos para vehículos', 1);

-- Subcategorías (reemplazar @id_general por el id de "Asientos"):
-- SET @id_general = (SELECT idgeneral_categories FROM general_categories WHERE name = 'Asientos');
-- INSERT INTO `category` (`id_company`, `id_general_category`, `name`, `description`, `status`, `created_at`)
-- SELECT 1, @id_general, 'Cuero', 'Asientos Cuero', 1, NOW()
--   WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Cuero' AND id_general_category = @id_general);
-- INSERT INTO `category` (`id_company`, `id_general_category`, `name`, `description`, `status`, `created_at`)
-- SELECT 1, @id_general, 'Eco cuero', 'Asientos Eco cuero', 1, NOW()
--   WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Eco cuero' AND id_general_category = @id_general);
-- INSERT INTO `category` (`id_company`, `id_general_category`, `name`, `description`, `status`, `created_at`)
-- SELECT 1, @id_general, 'Eco cuero standard', 'Asientos Eco cuero standard', 1, NOW()
--   WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Eco cuero standard' AND id_general_category = @id_general);
