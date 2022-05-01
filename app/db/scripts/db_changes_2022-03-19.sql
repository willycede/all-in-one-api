ALTER TABLE `all_in_one`.`users` 
ADD COLUMN `access_token` VARCHAR(250) NOT NULL AFTER `recovery_pass`,
ADD COLUMN `token_expires_in` VARCHAR(45) NOT NULL AFTER `access_token`,
CHANGE COLUMN `recovery_pass` `recovery_pass` VARCHAR(50) NULL ;

INSERT INTO `all_in_one`.`rol` (`name`, `description`, `status`) VALUES ('Administrador', 'Rol administrador', '1');
INSERT INTO `all_in_one`.`rol` (`name`, `description`, `status`) VALUES ('Cliente', 'Rol cliente', '1');

ALTER TABLE `all_in_one`.`user_rol` 
CHANGE COLUMN `id_company_user` `id_company_user` INT NULL ;

ALTER TABLE `all_in_one`.`users` 
CHANGE COLUMN `access_token` `access_token` LONGTEXT NOT NULL ;

ALTER TABLE `all_in_one`.`users` 
CHANGE COLUMN `password` `password` VARCHAR(250) NOT NULL ;

ALTER TABLE `all_in_one`.`users` 
CHANGE COLUMN `update_at` `updated_at` DATETIME NULL DEFAULT NULL ;

ALTER TABLE `all_in_one`.`company_users` 
CHANGE COLUMN `id_company` `id_company` INT NULL ;


ALTER TABLE `all_in_one`.`user_rol` 
ADD COLUMN `id_user_rol` VARCHAR(45) NOT NULL AFTER `id_company_user`,
ADD PRIMARY KEY (`id_user_rol`);
;
ALTER TABLE `all_in_one`.`user_rol` 
CHANGE COLUMN `id_user_rol` `id_user_rol` INT NOT NULL AUTO_INCREMENT ;

ALTER TABLE `all_in_one`.`category` 
CHANGE COLUMN `updated_at` `updated_at` DATETIME NULL ;


CREATE TABLE `all_in_one`.`country` (
  `id_country` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(250) NULL,
  `iso3` VARCHAR(3) NULL,
  `iso2` VARCHAR(2) NULL,
  `phonecode` VARCHAR(45) NULL,
  `countrycol` VARCHAR(255) NULL,
  `capital` VARCHAR(255) NULL,
  `currency` DATETIME NULL,
  `currency_symbol` VARCHAR(255) NULL,
  `tld` VARCHAR(255) NULL,
  `native` VARCHAR(255) NULL,
  `subregion` VARCHAR(255) NULL,
  `timezones` VARCHAR(255) NULL,
  `translations` VARCHAR(255) NULL,
  `countrycol1` VARCHAR(255) NULL,
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(10,8) NULL,
  `emoji` VARCHAR(255) NULL,
  `emojiU` VARCHAR(255) NULL,
  `flag` INT NULL,
  `wikiDataId` VARCHAR(255) NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id_country`));

ALTER TABLE `all_in_one`.`country` 
DROP COLUMN `countrycol1`,
DROP COLUMN `countrycol`;

ALTER TABLE `all_in_one`.`country` 
CHANGE COLUMN `longitude` `longitude` DECIMAL(11,8) NULL DEFAULT NULL ;

ALTER TABLE `all_in_one`.`country` 
CHANGE COLUMN `timezones` `timezones` TEXT NULL DEFAULT NULL ,
CHANGE COLUMN `translations` `translations` TEXT NULL DEFAULT NULL ;


CREATE TABLE `state` (
  `id_state` mediumint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_id` mediumint unsigned NOT NULL,
  `country_code` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fips_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iso2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `flag` tinyint(1) NOT NULL DEFAULT '1',
  `wikiDataId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Rapid API GeoDB Cities',
  PRIMARY KEY (`id_state`)
) ENGINE=InnoDB AUTO_INCREMENT=4953 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT;



CREATE TABLE `city` (
  `id_city` mediumint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `state_id` mediumint unsigned NOT NULL,
  `state_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_id` mediumint unsigned NOT NULL,
  `country_code` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '2013-12-31 20:01:01',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `flag` tinyint(1) NOT NULL DEFAULT '1',
  `wikiDataId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Rapid API GeoDB Cities',
  PRIMARY KEY (`id_city`),
  KEY `cities_test_ibfk_1` (`state_id`),
  KEY `cities_test_ibfk_2` (`country_id`)
) ENGINE=InnoDB AUTO_INCREMENT=148554 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT;


ALTER TABLE `all_in_one`.`permissions` 
ADD COLUMN `status` INT NOT NULL AFTER `delete`,
ADD COLUMN `created_at` DATETIME NOT NULL AFTER `status`,
ADD COLUMN `updated_at` DATETIME NULL AFTER `created_at`;
