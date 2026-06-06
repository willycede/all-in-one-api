-- Tabla de favoritos por usuario (ejecutar si npm run migrate no está disponible)
CREATE TABLE IF NOT EXISTS `user_favorites` (
  `id_favorite` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_user` INT NOT NULL,
  `id_product` INT NOT NULL,
  `status` INT NOT NULL DEFAULT 1 COMMENT '1=active, 2=inactive',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_favorite`),
  UNIQUE KEY `uq_user_favorites_user_product` (`id_user`, `id_product`),
  KEY `idx_user_favorites_user_status` (`id_user`, `status`),
  CONSTRAINT `user_favorites_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_users`),
  CONSTRAINT `user_favorites_id_product_foreign` FOREIGN KEY (`id_product`) REFERENCES `products` (`id_products`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
