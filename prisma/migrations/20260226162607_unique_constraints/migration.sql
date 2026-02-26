/*
  Warnings:

  - A unique constraint covering the columns `[trim_id,name]` on the table `colors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[trim_id,url]` on the table `images` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `colors_trim_id_name_key` ON `colors`(`trim_id`, `name`);

-- CreateIndex
CREATE UNIQUE INDEX `images_trim_id_url_key` ON `images`(`trim_id`, `url`);
