import { MigrationInterface, QueryRunner } from "typeorm";

export class init1661246249040 implements MigrationInterface {
    name = 'init1661246249040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`assets\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` varchar(32) NOT NULL, \`description\` varchar(2048) NOT NULL DEFAULT '', \`required\` tinyint NOT NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), \`repository_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_ae6aac17d442c0b8fa26a17a31\` (\`repository_id\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tokens\` (\`id\` binary(5) NOT NULL, \`name\` varchar(64) NOT NULL, \`description\` varchar(2048) NOT NULL DEFAULT '', \`hash\` binary(48) NOT NULL, \`type\` enum ('account', 'repository') NOT NULL, \`scopes\` json NOT NULL, \`expires_at\` datetime(3) NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), \`deleted_at\` datetime(3) NULL, \`account_id\` int UNSIGNED NULL, \`repository_id\` varchar(36) NULL, INDEX \`IDX_2703ec1fbf4d8eecbef80cf6c3\` (\`expires_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`release_downloads\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`ip\` varchar(45) NOT NULL, \`date\` date NOT NULL, \`time\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`attachment_id\` int UNSIGNED NULL, \`release_id\` int UNSIGNED NULL, \`repository_id\` varchar(36) NULL, \`token_id\` binary(5) NULL, INDEX \`IDX_ed6d953073ca609b4be656900a\` (\`attachment_id\`), INDEX \`IDX_5986498642216b76f65194db05\` (\`release_id\`), INDEX \`IDX_7b5462e6adb40065d3352368dd\` (\`repository_id\`), INDEX \`IDX_b6308a5acf8088b774b13f6d92\` (\`date\`), INDEX \`IDX_096278c7e008473d3e08460ade\` (\`time\`), INDEX \`IDX_d178fcf5aa76eb3e85088f5916\` (\`repository_id\`, \`date\`), INDEX \`IDX_40e336730aec2913d8c521018a\` (\`release_id\`, \`date\`), INDEX \`IDX_2a32550fe49c4ac4b4dbc7f2c1\` (\`attachment_id\`, \`date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`release_attachments\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`file_name\` varchar(256) NOT NULL, \`object_name\` varchar(256) NULL, \`mime\` varchar(64) NOT NULL, \`size\` int UNSIGNED NOT NULL, \`hash_sha1\` binary(20) NOT NULL, \`hash_md5\` binary(16) NOT NULL, \`download_count\` int UNSIGNED NOT NULL DEFAULT '0', \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), \`release_id\` int UNSIGNED NULL, \`asset_id\` int UNSIGNED NULL, UNIQUE INDEX \`IDX_d7326d6313ad6cd4f53d5b4bef\` (\`release_id\`, \`asset_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tags\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` varchar(32) NOT NULL, \`description\` varchar(2048) NOT NULL DEFAULT '', \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), \`repository_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_701e7c89bf3e2b7a743015e958\` (\`repository_id\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`releases\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`version\` varchar(255) NOT NULL, \`status\` enum ('draft', 'published', 'archived') NOT NULL DEFAULT 'draft', \`description\` longtext NOT NULL, \`download_count\` int UNSIGNED NOT NULL DEFAULT '0', \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), \`published_at\` datetime(3) NULL, \`archived_at\` datetime(3) NULL, \`purged_at\` datetime(3) NULL, \`repository_id\` varchar(36) NULL, INDEX \`IDX_28c9e3a526f9c3dccc30c10a9c\` (\`status\`, \`purged_at\`), UNIQUE INDEX \`IDX_afa31ef2d170b5d4a98d7317be\` (\`repository_id\`, \`version\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`repositories\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(64) NOT NULL, \`description\` varchar(2048) NOT NULL DEFAULT '', \`scheme\` enum ('semantic', 'microsoft', 'incremental') NOT NULL, \`access\` enum ('private', 'public') NOT NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), \`deleted_at\` datetime(3) NULL, \`settings\` json NOT NULL, INDEX \`IDX_596b2f0c14060916d893ac9a25\` (\`deleted_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`collaborations\` (\`id\` varchar(36) NOT NULL, \`role\` enum ('owner', 'manager', 'publisher', 'auditor', 'custom') NOT NULL, \`scopes\` json NOT NULL, \`notifications\` json NOT NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), \`deleted_at\` datetime(3) NULL, \`repository_id\` varchar(36) NULL, \`account_id\` int UNSIGNED NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`accounts\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` varchar(32) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`notifications\` json NOT NULL, \`verified\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`updated_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), UNIQUE INDEX \`IDX_ee66de6cdc53993296d1ceb8aa\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`account_actions\` (\`id\` binary(5) NOT NULL, \`hash\` binary(48) NOT NULL, \`type\` enum ('reset_password', 'confirm_email') NOT NULL, \`metadata\` json NOT NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`expires_at\` datetime(3) NOT NULL, \`account_id\` int UNSIGNED NULL, INDEX \`IDX_c6423976dbe0f65579de8eb50f\` (\`expires_at\`), INDEX \`IDX_4ee82d6051ea68f152946fd325\` (\`account_id\`, \`type\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`collaboration_invites\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`role\` enum ('owner', 'manager', 'publisher', 'auditor', 'custom') NOT NULL, \`scopes\` json NOT NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), \`expires_at\` datetime(3) NOT NULL, \`repository_id\` varchar(36) NULL, INDEX \`IDX_5a77f5c0e49cf6c7a90de4717c\` (\`expires_at\`), UNIQUE INDEX \`IDX_24d03dc531e7ac691ffb8c12b3\` (\`repository_id\`, \`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`queued_notifications\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`email\` varchar(256) NOT NULL, \`subject\` varchar(512) NOT NULL, \`message\` mediumtext NOT NULL, \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`releases_to_tags\` (\`release_id\` int UNSIGNED NOT NULL, \`tag_id\` int UNSIGNED NOT NULL, INDEX \`IDX_cd6aebefa1139d6f060b3f62ff\` (\`release_id\`), INDEX \`IDX_3456390d3a95b19cc750103fb7\` (\`tag_id\`), PRIMARY KEY (\`release_id\`, \`tag_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`assets\` ADD CONSTRAINT \`FK_becc8ef8e03fd6e87ffd25de869\` FOREIGN KEY (\`repository_id\`) REFERENCES \`repositories\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tokens\` ADD CONSTRAINT \`FK_530d9d8c09bf03091de293ee3fe\` FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tokens\` ADD CONSTRAINT \`FK_ce008b180b3f58936f957fe9d6a\` FOREIGN KEY (\`repository_id\`) REFERENCES \`repositories\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`release_downloads\` ADD CONSTRAINT \`FK_ed6d953073ca609b4be656900a4\` FOREIGN KEY (\`attachment_id\`) REFERENCES \`release_attachments\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`release_downloads\` ADD CONSTRAINT \`FK_5986498642216b76f65194db05e\` FOREIGN KEY (\`release_id\`) REFERENCES \`releases\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`release_downloads\` ADD CONSTRAINT \`FK_7b5462e6adb40065d3352368dd4\` FOREIGN KEY (\`repository_id\`) REFERENCES \`repositories\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`release_downloads\` ADD CONSTRAINT \`FK_11239bae556475acb50d2b3e7bf\` FOREIGN KEY (\`token_id\`) REFERENCES \`tokens\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`release_attachments\` ADD CONSTRAINT \`FK_c5f312f0feb219906d54b2cf6e5\` FOREIGN KEY (\`release_id\`) REFERENCES \`releases\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`release_attachments\` ADD CONSTRAINT \`FK_40da63bcf65d856f8b986f4a52f\` FOREIGN KEY (\`asset_id\`) REFERENCES \`assets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tags\` ADD CONSTRAINT \`FK_49f1c6e99ff5bcf6c807f389842\` FOREIGN KEY (\`repository_id\`) REFERENCES \`repositories\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`releases\` ADD CONSTRAINT \`FK_8f596dfa9b8f2bf49e7ef72acbd\` FOREIGN KEY (\`repository_id\`) REFERENCES \`repositories\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`collaborations\` ADD CONSTRAINT \`FK_f66cc38513d44fe4135969c9778\` FOREIGN KEY (\`repository_id\`) REFERENCES \`repositories\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`collaborations\` ADD CONSTRAINT \`FK_230ac3c7f86e12198372e986b0a\` FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`account_actions\` ADD CONSTRAINT \`FK_8d1b5718c6271ac24293b3e73e3\` FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`collaboration_invites\` ADD CONSTRAINT \`FK_1405d93d5340e9973c2ab06a6af\` FOREIGN KEY (\`repository_id\`) REFERENCES \`repositories\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`releases_to_tags\` ADD CONSTRAINT \`FK_cd6aebefa1139d6f060b3f62ff5\` FOREIGN KEY (\`release_id\`) REFERENCES \`releases\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`releases_to_tags\` ADD CONSTRAINT \`FK_3456390d3a95b19cc750103fb77\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tags\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`releases_to_tags\` DROP FOREIGN KEY \`FK_3456390d3a95b19cc750103fb77\``);
        await queryRunner.query(`ALTER TABLE \`releases_to_tags\` DROP FOREIGN KEY \`FK_cd6aebefa1139d6f060b3f62ff5\``);
        await queryRunner.query(`ALTER TABLE \`collaboration_invites\` DROP FOREIGN KEY \`FK_1405d93d5340e9973c2ab06a6af\``);
        await queryRunner.query(`ALTER TABLE \`account_actions\` DROP FOREIGN KEY \`FK_8d1b5718c6271ac24293b3e73e3\``);
        await queryRunner.query(`ALTER TABLE \`collaborations\` DROP FOREIGN KEY \`FK_230ac3c7f86e12198372e986b0a\``);
        await queryRunner.query(`ALTER TABLE \`collaborations\` DROP FOREIGN KEY \`FK_f66cc38513d44fe4135969c9778\``);
        await queryRunner.query(`ALTER TABLE \`releases\` DROP FOREIGN KEY \`FK_8f596dfa9b8f2bf49e7ef72acbd\``);
        await queryRunner.query(`ALTER TABLE \`tags\` DROP FOREIGN KEY \`FK_49f1c6e99ff5bcf6c807f389842\``);
        await queryRunner.query(`ALTER TABLE \`release_attachments\` DROP FOREIGN KEY \`FK_40da63bcf65d856f8b986f4a52f\``);
        await queryRunner.query(`ALTER TABLE \`release_attachments\` DROP FOREIGN KEY \`FK_c5f312f0feb219906d54b2cf6e5\``);
        await queryRunner.query(`ALTER TABLE \`release_downloads\` DROP FOREIGN KEY \`FK_11239bae556475acb50d2b3e7bf\``);
        await queryRunner.query(`ALTER TABLE \`release_downloads\` DROP FOREIGN KEY \`FK_7b5462e6adb40065d3352368dd4\``);
        await queryRunner.query(`ALTER TABLE \`release_downloads\` DROP FOREIGN KEY \`FK_5986498642216b76f65194db05e\``);
        await queryRunner.query(`ALTER TABLE \`release_downloads\` DROP FOREIGN KEY \`FK_ed6d953073ca609b4be656900a4\``);
        await queryRunner.query(`ALTER TABLE \`tokens\` DROP FOREIGN KEY \`FK_ce008b180b3f58936f957fe9d6a\``);
        await queryRunner.query(`ALTER TABLE \`tokens\` DROP FOREIGN KEY \`FK_530d9d8c09bf03091de293ee3fe\``);
        await queryRunner.query(`ALTER TABLE \`assets\` DROP FOREIGN KEY \`FK_becc8ef8e03fd6e87ffd25de869\``);
        await queryRunner.query(`DROP INDEX \`IDX_3456390d3a95b19cc750103fb7\` ON \`releases_to_tags\``);
        await queryRunner.query(`DROP INDEX \`IDX_cd6aebefa1139d6f060b3f62ff\` ON \`releases_to_tags\``);
        await queryRunner.query(`DROP TABLE \`releases_to_tags\``);
        await queryRunner.query(`DROP TABLE \`queued_notifications\``);
        await queryRunner.query(`DROP INDEX \`IDX_24d03dc531e7ac691ffb8c12b3\` ON \`collaboration_invites\``);
        await queryRunner.query(`DROP INDEX \`IDX_5a77f5c0e49cf6c7a90de4717c\` ON \`collaboration_invites\``);
        await queryRunner.query(`DROP TABLE \`collaboration_invites\``);
        await queryRunner.query(`DROP INDEX \`IDX_4ee82d6051ea68f152946fd325\` ON \`account_actions\``);
        await queryRunner.query(`DROP INDEX \`IDX_c6423976dbe0f65579de8eb50f\` ON \`account_actions\``);
        await queryRunner.query(`DROP TABLE \`account_actions\``);
        await queryRunner.query(`DROP INDEX \`IDX_ee66de6cdc53993296d1ceb8aa\` ON \`accounts\``);
        await queryRunner.query(`DROP TABLE \`accounts\``);
        await queryRunner.query(`DROP TABLE \`collaborations\``);
        await queryRunner.query(`DROP INDEX \`IDX_596b2f0c14060916d893ac9a25\` ON \`repositories\``);
        await queryRunner.query(`DROP TABLE \`repositories\``);
        await queryRunner.query(`DROP INDEX \`IDX_afa31ef2d170b5d4a98d7317be\` ON \`releases\``);
        await queryRunner.query(`DROP INDEX \`IDX_28c9e3a526f9c3dccc30c10a9c\` ON \`releases\``);
        await queryRunner.query(`DROP TABLE \`releases\``);
        await queryRunner.query(`DROP INDEX \`IDX_701e7c89bf3e2b7a743015e958\` ON \`tags\``);
        await queryRunner.query(`DROP TABLE \`tags\``);
        await queryRunner.query(`DROP INDEX \`IDX_d7326d6313ad6cd4f53d5b4bef\` ON \`release_attachments\``);
        await queryRunner.query(`DROP TABLE \`release_attachments\``);
        await queryRunner.query(`DROP INDEX \`IDX_2a32550fe49c4ac4b4dbc7f2c1\` ON \`release_downloads\``);
        await queryRunner.query(`DROP INDEX \`IDX_40e336730aec2913d8c521018a\` ON \`release_downloads\``);
        await queryRunner.query(`DROP INDEX \`IDX_d178fcf5aa76eb3e85088f5916\` ON \`release_downloads\``);
        await queryRunner.query(`DROP INDEX \`IDX_096278c7e008473d3e08460ade\` ON \`release_downloads\``);
        await queryRunner.query(`DROP INDEX \`IDX_b6308a5acf8088b774b13f6d92\` ON \`release_downloads\``);
        await queryRunner.query(`DROP INDEX \`IDX_7b5462e6adb40065d3352368dd\` ON \`release_downloads\``);
        await queryRunner.query(`DROP INDEX \`IDX_5986498642216b76f65194db05\` ON \`release_downloads\``);
        await queryRunner.query(`DROP INDEX \`IDX_ed6d953073ca609b4be656900a\` ON \`release_downloads\``);
        await queryRunner.query(`DROP TABLE \`release_downloads\``);
        await queryRunner.query(`DROP INDEX \`IDX_2703ec1fbf4d8eecbef80cf6c3\` ON \`tokens\``);
        await queryRunner.query(`DROP TABLE \`tokens\``);
        await queryRunner.query(`DROP INDEX \`IDX_ae6aac17d442c0b8fa26a17a31\` ON \`assets\``);
        await queryRunner.query(`DROP TABLE \`assets\``);
    }

}
