-- CreateTable
CREATE TABLE `click_counters` (
    `id` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `pagina` VARCHAR(191) NOT NULL,
    `data` DATE NOT NULL,
    `total` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `click_counters_categoria_pagina_data_key`(`categoria`, `pagina`, `data`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
