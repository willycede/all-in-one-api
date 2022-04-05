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
