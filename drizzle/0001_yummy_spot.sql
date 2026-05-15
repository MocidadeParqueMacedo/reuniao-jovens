CREATE TABLE `atas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`data` varchar(10) NOT NULL,
	`conteudo` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `atas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eventos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`data` varchar(10) NOT NULL,
	`tipo` varchar(20) NOT NULL,
	`titulo` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `eventos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`isScheduled` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`genero` varchar(1) NOT NULL,
	`continuacao` int NOT NULL,
	`dataNascimento` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `presenca` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`memberId` int NOT NULL,
	`presente` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `presenca_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `versinhos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`livro` varchar(50) NOT NULL,
	`capitulo` int NOT NULL,
	`versiculo` int NOT NULL,
	`ordem` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `versinhos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visitas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`data` varchar(10),
	`realizada` int NOT NULL DEFAULT 0,
	`endereco` text,
	`horario` varchar(5),
	`observacoes` text,
	`tipo` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visitas_id` PRIMARY KEY(`id`)
);
