-- Um prestador de servico pode pertencer a mais de um roteiro turistico.
-- Troca `roteiro` (enum unico, nullable) por `roteiros` (JSON array de enum),
-- preservando os valores ja cadastrados (vira array de 1 elemento).

-- AlterTable
ALTER TABLE `servicos_turista` ADD COLUMN `roteiros` JSON NULL;

-- Backfill: converte o valor singular existente em array de 1 elemento
UPDATE `servicos_turista`
SET `roteiros` = JSON_ARRAY(`roteiro`)
WHERE `roteiro` IS NOT NULL;

-- AlterTable
ALTER TABLE `servicos_turista` DROP COLUMN `roteiro`;
