-- Seed de productos de Asientos con modificadores de color y ciudad Guayaquil.
-- IDs verificados en la BD all_in_one:
--   category: Cuero = 4, Eco cuero = 5, Eco cuero standard = 6
--   city Guayaquil = 31511
-- Ajusta los precios base y los recargos antes de ejecutar si hace falta.

SET @gye = '31511';
SET @price_cuero = 120.00;
SET @price_eco = 90.00;
SET @price_eco_std = 70.00;
SET @delta_negro = 10.00;
SET @delta_cafe = 15.00;
SET @delta_blanco = 20.00;

-- 1) Tapiz de asiento cuero (subcategoría Cuero)
INSERT INTO products (id_cod_catalog, cod_products, name, description, price, discount, status, allowed_cities, created_at, updated_at)
VALUES (NULL, 'TAP-CUERO-001', 'Tapiz de asiento cuero', 'Tapiz de asiento de cuero para vehículo. Disponible en varios colores.', @price_cuero, 0, 1, @gye, NOW(), NOW());
SET @p1 = LAST_INSERT_ID();
INSERT INTO features (id_products, id_category, id_catalogo, status, created_at, updated_at)
VALUES (@p1, 4, NULL, 1, NOW(), NOW());
INSERT INTO product_modifiers (id_products, type, name, price_delta, status)
VALUES (@p1, 'color', 'Negro', @delta_negro, 1),
       (@p1, 'color', 'Café', @delta_cafe, 1),
       (@p1, 'color', 'Blanco', @delta_blanco, 1);

-- 2) Tapiz de asiento eco cuero (subcategoría Eco cuero)
INSERT INTO products (id_cod_catalog, cod_products, name, description, price, discount, status, allowed_cities, created_at, updated_at)
VALUES (NULL, 'TAP-ECO-001', 'Tapiz de asiento eco cuero', 'Tapiz de asiento de eco cuero para vehículo. Disponible en varios colores.', @price_eco, 0, 1, @gye, NOW(), NOW());
SET @p2 = LAST_INSERT_ID();
INSERT INTO features (id_products, id_category, id_catalogo, status, created_at, updated_at)
VALUES (@p2, 5, NULL, 1, NOW(), NOW());
INSERT INTO product_modifiers (id_products, type, name, price_delta, status)
VALUES (@p2, 'color', 'Negro', @delta_negro, 1),
       (@p2, 'color', 'Café', @delta_cafe, 1),
       (@p2, 'color', 'Blanco', @delta_blanco, 1);

-- 3) Tapiz de asiento eco cuero standard (subcategoría Eco cuero standard)
INSERT INTO products (id_cod_catalog, cod_products, name, description, price, discount, status, allowed_cities, created_at, updated_at)
VALUES (NULL, 'TAP-ECOSTD-001', 'Tapiz de asiento eco cuero standard', 'Tapiz de asiento de eco cuero standard para vehículo. Disponible en varios colores.', @price_eco_std, 0, 1, @gye, NOW(), NOW());
SET @p3 = LAST_INSERT_ID();
INSERT INTO features (id_products, id_category, id_catalogo, status, created_at, updated_at)
VALUES (@p3, 6, NULL, 1, NOW(), NOW());
INSERT INTO product_modifiers (id_products, type, name, price_delta, status)
VALUES (@p3, 'color', 'Negro', @delta_negro, 1),
       (@p3, 'color', 'Café', @delta_cafe, 1),
       (@p3, 'color', 'Blanco', @delta_blanco, 1);

SELECT @p1 AS tapiz_cuero, @p2 AS tapiz_eco, @p3 AS tapiz_eco_std;
