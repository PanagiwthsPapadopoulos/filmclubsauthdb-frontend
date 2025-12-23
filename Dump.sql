-- ============================================================
-- 0. NUKE PROTOCOL (Wipe DB & Users)
-- ============================================================
SET NAMES utf8mb4;
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

DROP DATABASE IF EXISTS FilmClubsAUThDB;
CREATE DATABASE FilmClubsAUThDB;
USE FilmClubsAUThDB;

-- ============================================================
-- 1. SCHEMA CREATION (Tables)
-- ============================================================

CREATE TABLE `department` (
  `departmentID` int NOT NULL,
  `name` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`departmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `filmclub` (
  `clubID` int NOT NULL,
  `name` varchar(30) DEFAULT NULL,
  `foundingDate` date NOT NULL,
  `isActive` tinyint DEFAULT NULL,
  `emailAddress` varchar(32) DEFAULT NULL,
  `instagramHandle` varchar(15) DEFAULT NULL,
  `facebookHandle` varchar(32) DEFAULT NULL,
  `departmentID` int NOT NULL,
  PRIMARY KEY (`clubID`),
  KEY `fk_FilmClub_Department1_idx` (`departmentID`),
  CONSTRAINT `fk_FilmClub_Department1` FOREIGN KEY (`departmentID`) REFERENCES `department` (`departmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `member` (
  `memberID` int NOT NULL,
  `name` varchar(30) DEFAULT NULL,
  `phoneNumber` char(10) DEFAULT NULL,
  `instagramHandle` varchar(15) DEFAULT NULL,
  `facebookHandle` varchar(15) DEFAULT NULL,
  `departmentID` int NOT NULL,
  PRIMARY KEY (`memberID`),
  KEY `fk_Member_Department1_idx` (`departmentID`),
  CONSTRAINT `fk_Member_Department1` FOREIGN KEY (`departmentID`) REFERENCES `department` (`departmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `belongs_to` (
  `memberID` int NOT NULL,
  `clubID` int NOT NULL,
  `roleName` varchar(45) NOT NULL,
  `isActive` tinyint NOT NULL,
  PRIMARY KEY (`memberID`,`clubID`,`roleName`),
  KEY `fk_Member_has_FilmClub_FilmClub1_idx` (`clubID`),
  KEY `fk_Member_has_FilmClub_Member1_idx` (`memberID`),
  CONSTRAINT `fk_Member_has_FilmClub_FilmClub1` FOREIGN KEY (`clubID`) REFERENCES `filmclub` (`clubID`),
  CONSTRAINT `fk_Member_has_FilmClub_Member1` FOREIGN KEY (`memberID`) REFERENCES `member` (`memberID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `venue` (
  `venueID` int NOT NULL,
  `name` varchar(30) DEFAULT NULL,
  `details` text,
  `departmentID` int NOT NULL,
  PRIMARY KEY (`venueID`),
  KEY `fk_Venue_Department1_idx` (`departmentID`),
  CONSTRAINT `fk_Venue_Department1` FOREIGN KEY (`departmentID`) REFERENCES `department` (`departmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `film` (
  `filmID` int NOT NULL,
  `TMDBLink` varchar(100) DEFAULT NULL,
  `title` varchar(60) DEFAULT NULL,
  `year` smallint DEFAULT NULL,
  PRIMARY KEY (`filmID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `screening` (
  `screeningID` int NOT NULL,
  `date` datetime DEFAULT NULL,
  `venueID` int NOT NULL,
  PRIMARY KEY (`screeningID`),
  KEY `fk_Screening_Venue1_idx` (`venueID`),
  CONSTRAINT `fk_Screening_Venue1` FOREIGN KEY (`venueID`) REFERENCES `venue` (`venueID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `shows` (
  `screeningID` int NOT NULL,
  `filmID` int NOT NULL,
  PRIMARY KEY (`screeningID`,`filmID`),
  KEY `fk_Screening_has_Film_Film1_idx` (`filmID`),
  KEY `fk_Screening_has_Film_Screening1_idx` (`screeningID`),
  CONSTRAINT `fk_Screening_has_Film_Film1` FOREIGN KEY (`filmID`) REFERENCES `film` (`filmID`),
  CONSTRAINT `fk_Screening_has_Film_Screening1` FOREIGN KEY (`screeningID`) REFERENCES `screening` (`screeningID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `schedules` (
  `clubID` int NOT NULL,
  `screeningID` int NOT NULL,
  PRIMARY KEY (`clubID`,`screeningID`),
  KEY `fk_FilmClub_has_Screening_Screening1_idx` (`screeningID`),
  KEY `fk_FilmClub_has_Screening_FilmClub1_idx` (`clubID`),
  CONSTRAINT `fk_FilmClub_has_Screening_FilmClub1` FOREIGN KEY (`clubID`) REFERENCES `filmclub` (`clubID`),
  CONSTRAINT `fk_FilmClub_has_Screening_Screening1` FOREIGN KEY (`screeningID`) REFERENCES `screening` (`screeningID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `actor` (
  `actorID` int NOT NULL,
  `name` varchar(30) DEFAULT NULL,
  `TMDBLink` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`actorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `played_in` (
  `actorID` int NOT NULL,
  `filmID` int NOT NULL,
  `characterName` varchar(30) NOT NULL,
  PRIMARY KEY (`actorID`,`filmID`,`characterName`),
  KEY `fk_Actor_has_Film_Film1_idx` (`filmID`),
  KEY `fk_Actor_has_Film_Actor1_idx` (`actorID`),
  CONSTRAINT `fk_Actor_has_Film_Actor1` FOREIGN KEY (`actorID`) REFERENCES `actor` (`actorID`),
  CONSTRAINT `fk_Actor_has_Film_Film1` FOREIGN KEY (`filmID`) REFERENCES `film` (`filmID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `director` (
  `directorID` int NOT NULL,
  `name` varchar(30) DEFAULT NULL,
  `TMDBLink` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`directorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `directed` (
  `directorID` int NOT NULL,
  `filmID` int NOT NULL,
  PRIMARY KEY (`directorID`,`filmID`),
  KEY `fk_Director_has_Film_Film1_idx` (`filmID`),
  KEY `fk_Director_has_Film_Director1_idx` (`directorID`),
  CONSTRAINT `fk_Director_has_Film_Director1` FOREIGN KEY (`directorID`) REFERENCES `director` (`directorID`),
  CONSTRAINT `fk_Director_has_Film_Film1` FOREIGN KEY (`filmID`) REFERENCES `film` (`filmID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `equipment` (
  `equipmentID` int NOT NULL,
  `name` varchar(30) DEFAULT NULL,
  `isPrivate` tinyint DEFAULT NULL,
  PRIMARY KEY (`equipmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `owns` (
  `clubID` int NOT NULL,
  `equipmentID` int NOT NULL,
  PRIMARY KEY (`clubID`,`equipmentID`),
  KEY `fk_FilmClub_has_Equipment_Equipment1_idx` (`equipmentID`),
  KEY `fk_FilmClub_has_Equipment_FilmClub1_idx` (`clubID`),
  CONSTRAINT `fk_FilmClub_has_Equipment_Equipment1` FOREIGN KEY (`equipmentID`) REFERENCES `equipment` (`equipmentID`),
  CONSTRAINT `fk_FilmClub_has_Equipment_FilmClub1` FOREIGN KEY (`clubID`) REFERENCES `filmclub` (`clubID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `uses` (
  `equipmentID` int NOT NULL,
  `screeningID` int NOT NULL,
  PRIMARY KEY (`equipmentID`,`screeningID`),
  KEY `fk_Equipment_has_Screening_Screening1_idx` (`screeningID`),
  KEY `fk_Equipment_has_Screening_Equipment1_idx` (`equipmentID`),
  CONSTRAINT `fk_Equipment_has_Screening_Equipment1` FOREIGN KEY (`equipmentID`) REFERENCES `equipment` (`equipmentID`),
  CONSTRAINT `fk_Equipment_has_Screening_Screening1` FOREIGN KEY (`screeningID`) REFERENCES `screening` (`screeningID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `post` (
  `postID` int NOT NULL,
  `postLink` varchar(64) DEFAULT NULL,
  `platform` varchar(30) DEFAULT NULL,
  `screeningID` int NOT NULL,
  PRIMARY KEY (`postID`),
  KEY `fk_Post_Screening1_idx` (`screeningID`),
  CONSTRAINT `fk_Post_Screening1` FOREIGN KEY (`screeningID`) REFERENCES `screening` (`screeningID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `language` (
  `languageID` int NOT NULL,
  `name` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`languageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `spoken_in` (
  `languageID` int NOT NULL,
  `filmID` int NOT NULL,
  PRIMARY KEY (`languageID`,`filmID`),
  KEY `fk_Language_has_Film_Film1_idx` (`filmID`),
  KEY `fk_Language_has_Film_Language1_idx` (`languageID`),
  CONSTRAINT `fk_Language_has_Film_Film1` FOREIGN KEY (`filmID`) REFERENCES `film` (`filmID`),
  CONSTRAINT `fk_Language_has_Film_Language1` FOREIGN KEY (`languageID`) REFERENCES `language` (`languageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ============================================================
-- 2. VIEWS
-- ============================================================

CREATE VIEW `active_club_members` AS 
SELECT m.name AS member_name, b.roleName AS roleName, m.phoneNumber AS phoneNumber 
FROM member m 
JOIN belongs_to b ON m.memberID = b.memberID 
JOIN filmclub fc ON b.clubID = fc.clubID 
WHERE b.isActive = 1;

CREATE VIEW `cast_list` AS 
SELECT f.title AS film_title, a.name AS actor_name, p.characterName AS characterName 
FROM film f 
JOIN played_in p ON f.filmID = p.filmID 
JOIN actor a ON p.actorID = a.actorID;

CREATE VIEW `full_schedule` AS 
SELECT s.date AS screening_date, f.title AS film_title, v.name AS venue_name, fc.name AS club_name 
FROM screening s 
JOIN venue v ON s.venueID = v.venueID 
JOIN shows sh ON s.screeningID = sh.screeningID 
JOIN film f ON sh.filmID = f.filmID 
JOIN schedules sch ON s.screeningID = sch.screeningID 
JOIN filmclub fc ON sch.clubID = fc.clubID;


-- ============================================================
-- 3. USERS & ROLES 
-- ============================================================

DROP ROLE IF EXISTS 'guest', 'clubMember', 'contentManager', 'equipmentManager', 'clubAdmin', 'dbAdministrator';
DROP USER IF EXISTS 'app_guest'@'localhost', 'app_clubMember'@'localhost', 'app_contentManager'@'localhost', 'app_equipmentManager'@'localhost', 'app_clubAdmin'@'localhost', 'app_admin'@'localhost';


CREATE ROLE 'guest', 'clubMember', 'contentManager', 'equipmentManager', 'clubAdmin', 'dbAdministrator';

-- Permissions
GRANT SELECT ON FilmClubsAUThDB.Screening TO 'guest';
GRANT SELECT ON FilmClubsAUThDB.schedules TO 'guest';
GRANT SELECT ON FilmClubsAUThDB.FilmClub TO 'guest';
GRANT SELECT ON FilmClubsAUThDB.Department TO 'guest';
GRANT SELECT ON FilmClubsAUThDB.Venue TO 'guest';
GRANT SELECT ON FilmClubsAUThDB.Post TO 'guest';
GRANT SELECT ON FilmClubsAUThDB.shows TO 'guest';
GRANT SELECT ON FilmClubsAUThDB.Film TO 'guest';
GRANT SELECT ON FilmClubsAUThDB.spoken_in TO 'guest';
GRANT SELECT ON FilmClubsAUThDB.Language TO 'guest';
GRANT SELECT ON FilmClubsAUThDB.directed TO 'guest';
GRANT SELECT ON FilmClubsAUThDB.Director TO 'guest';
GRANT SELECT ON FilmClubsAUThDB.played_in TO 'guest';
GRANT SELECT ON FilmClubsAUThDB.Actor TO 'guest';

GRANT SELECT ON FilmClubsAUThDB.belongs_to TO 'clubMember';
GRANT SELECT ON FilmClubsAUThDB.Member TO 'clubMember';
GRANT 'guest' TO 'clubMember'; -- Inheritance

GRANT INSERT, UPDATE ON FilmClubsAUThDB.Screening TO 'contentManager';
GRANT INSERT, UPDATE ON FilmClubsAUThDB.schedules TO 'contentManager';
GRANT INSERT, UPDATE ON FilmClubsAUThDB.FilmClub TO 'contentManager';
GRANT INSERT, UPDATE ON FilmClubsAUThDB.Department TO 'contentManager';
GRANT INSERT, UPDATE ON FilmClubsAUThDB.Venue TO 'contentManager';
GRANT INSERT, UPDATE ON FilmClubsAUThDB.Post TO 'contentManager';
GRANT INSERT, UPDATE ON FilmClubsAUThDB.shows TO 'contentManager';
GRANT INSERT, UPDATE ON FilmClubsAUThDB.Film TO 'contentManager';
GRANT INSERT, UPDATE ON FilmClubsAUThDB.spoken_in TO 'contentManager';
GRANT INSERT, UPDATE ON FilmClubsAUThDB.Language TO 'contentManager';
GRANT INSERT, UPDATE ON FilmClubsAUThDB.directed TO 'contentManager';
GRANT INSERT, UPDATE ON FilmClubsAUThDB.Director TO 'contentManager';
GRANT INSERT, UPDATE ON FilmClubsAUThDB.played_in TO 'contentManager';
GRANT INSERT, UPDATE ON FilmClubsAUThDB.Actor TO 'contentManager';
GRANT 'clubMember' TO 'contentManager'; -- Inheritance

GRANT DELETE, SELECT, INSERT, UPDATE ON FilmClubsAUThDB.Equipment TO 'equipmentManager';
GRANT DELETE, SELECT, INSERT, UPDATE ON FilmClubsAUThDB.uses TO 'equipmentManager';
GRANT DELETE, SELECT, INSERT, UPDATE ON FilmClubsAUThDB.owns TO 'equipmentManager';
GRANT 'clubMember' TO 'equipmentManager'; -- Inheritance

GRANT SELECT, INSERT, UPDATE ON FilmClubsAUThDB.FilmClub TO 'clubAdmin';
GRANT SELECT, INSERT, UPDATE ON FilmClubsAUThDB.belongs_to TO 'clubAdmin';
GRANT 'equipmentManager', 'contentManager' TO 'clubAdmin'; -- Inheritance

GRANT SELECT, INSERT, DELETE, UPDATE ON FilmClubsAUThDB.* TO 'dbAdministrator';

-- Create Users
CREATE USER 'app_guest'@'localhost' IDENTIFIED BY 'guestpswrd';
GRANT 'guest' TO 'app_guest'@'localhost';

CREATE USER 'app_clubMember'@'localhost' IDENTIFIED BY 'memberpswrd';
GRANT 'clubMember' TO 'app_clubMember'@'localhost';

CREATE USER 'app_contentManager'@'localhost' IDENTIFIED BY 'contentpswrd';
GRANT 'contentManager' TO 'app_contentManager'@'localhost';

CREATE USER 'app_equipmentManager'@'localhost' IDENTIFIED BY 'equipmentpswrd';
GRANT 'equipmentManager' TO 'app_equipmentManager'@'localhost';

CREATE USER 'app_clubAdmin'@'localhost' IDENTIFIED BY 'clubpswrd';
GRANT 'clubAdmin' TO 'app_clubAdmin'@'localhost';

CREATE USER 'app_admin'@'localhost' IDENTIFIED BY 'adminpswrd';
GRANT 'dbAdministrator' TO 'app_admin'@'localhost';

-- Grant Roles upon login each time
SET DEFAULT ROLE ALL TO 'app_guest'@'localhost';
SET DEFAULT ROLE ALL TO 'app_clubMember'@'localhost';
SET DEFAULT ROLE ALL TO 'app_contentManager'@'localhost';
SET DEFAULT ROLE ALL TO 'app_equipmentManager'@'localhost';
SET DEFAULT ROLE ALL TO 'app_clubAdmin'@'localhost';
SET DEFAULT ROLE ALL TO 'app_admin'@'localhost';

FLUSH PRIVILEGES;

-- ============================================================
-- 4. DATA POPULATION (Matching Users to Members)
-- ============================================================

-- DEPARTMENTS
INSERT INTO department (departmentID, name) VALUES (1,'ECE'),(2,'MATH'),(3,'FILM'),(4,'PSY'),(5,'AGRO'),(6,'BIO'),(7,'POLSCI');

-- CLUBS
INSERT INTO filmclub VALUES 
(1,'11 kare','2011-01-01',1,'11.kare@proton.me','11ka.re','11kare Club',2),
(2,'CineF.Hl','2015-01-01',1,'cinefhl@gmail.com','cinefhl','cinefhl',1),
(3,'Nyxterides','2021-01-01',1,'cinematicbatts@gmail.com','cinematicbats','CinematicBats',3),
(4,'Kin.O.Ge','2017-01-01',1,'','kin.o.ge','kinoyeah',5),
(5,'CinePolsci','2006-01-01',1,'cinepolsci@yahoo.com','cinepolsci','CinePolsci',7);

-- MEMBERS (Syncing with LOGIN Users)
INSERT INTO member VALUES 
-- The Logins
(100, 'alex', '6911111111', 'alex_ig', 'alex_fb', 1),        -- Admin
(101, 'pepa', '6922222222', 'pepa_ig', 'pepa_fb', 2),        -- Equipment Mgr
(102, 'jodorowsky', '6933333333', 'jodo_ig', 'jodo_fb', 3),  -- Content Mgr
(103, 'SpongeBob', '6944444444', 'bob_ig', 'bob_fb', 2),     -- Member
(104, 'antonis', '6955555555', 'ant_ig', 'ant_fb', 1),       -- Admin 2
(105, 'PatrickStar', '6966666666', 'pat_ig', 'pat_fb', 2),   -- Member 2
-- Filler Members
(201, 'Maria Dimou', '6990000001', 'maria_d', NULL, 3),
(202, 'Nikos Georgiou', '6990000002', NULL, 'nikos_g', 1),
(203, 'Eleni Ioannidou', '6990000003', 'eleni_art', NULL, 2);

-- BELONGS_TO (Permissions & Teams)
INSERT INTO belongs_to VALUES 
-- Alex (Admin) -> Club 1 (11 kare)
(100, 1, 'President', 1),
-- Pepa (Equip) -> Club 2 (CineF.Hl)
(101, 2, 'Equipment Head', 1),
-- Jodorowsky (Content) -> Club 3 (Nyxterides)
(102, 3, 'Program Curator', 1),
-- SpongeBob (Member) -> Club 2 (CineF.Hl)
(103, 2, 'Casual Member', 1),
-- Patrick -> Club 2
(105, 2, 'Casual Member', 1),
-- Filler
(201, 3, 'Secretary', 1),
(202, 1, 'Treasurer', 1),
(203, 2, 'Vice President', 1);

-- EQUIPMENT & OWNERSHIP
INSERT INTO equipment VALUES (1,'Projector 4K',0),(2,'Sound System A',1),(3,'Popcorn Maker',1),(4,'Cables Box',0);
INSERT INTO owns VALUES (1,1), (2,2), (2,3), (3,4);

-- FILMS
INSERT INTO film (filmID, title, year, TMDBLink) VALUES
(1, 'Parasite', 2019, 'https://www.themoviedb.org/movie/496243'),
(2, 'Pulp Fiction', 1994, 'https://www.themoviedb.org/movie/680'),
(3, 'The Room', 2003, 'https://www.themoviedb.org/movie/17473'),
(4, 'Spirited Away', 2001, 'https://www.themoviedb.org/movie/129'),
(5, 'Blade Runner 2049', 2017, 'https://www.themoviedb.org/movie/335984'),
(6, 'La Haine', 1995, 'https://www.themoviedb.org/movie/406'),
(7, 'The Holy Mountain', 1973, 'https://www.themoviedb.org/movie/796'); -- For Jodorowsky

-- VENUES
INSERT INTO venue VALUES 
(1,'Valenti','1st Floor Engineering',1),
(2,'Amphitheatre A','Central Bldg',2),
(3,'Open Air Cinema','Rooftop',3);

-- DIRECTORS & ACTORS
INSERT INTO director VALUES (1,'Bong Joon-ho',NULL),(2,'Quentin Tarantino',NULL),(3,'Alejandro Jodorowsky',NULL);
INSERT INTO directed VALUES (1,1),(2,2),(3,7);
INSERT INTO actor VALUES (1,'Song Kang-ho',NULL),(2,'John Travolta',NULL);
INSERT INTO played_in VALUES (1,1,'Kim Ki-taek'),(2,2,'Vincent Vega');

-- SCHEDULE & SCREENINGS
INSERT INTO screening VALUES 
(10, '2023-05-20 21:00:00', 1),
(11, '2023-05-21 21:00:00', 2),
(12, '2023-05-22 21:00:00', 3),
(13, '2023-06-01 20:00:00', 1);

INSERT INTO shows VALUES (10,1), (11,2), (12,7), (13,4); -- Parasite, Pulp, Holy Mtn, Spirited Away

-- LINKING CLUBS TO SCREENINGS (Crucial for "My Club Screenings")
-- Club 1 (Alex) shows Parasite
INSERT INTO schedules VALUES (1, 10);
-- Club 2 (Pepa/SpongeBob) shows Pulp Fiction
INSERT INTO schedules VALUES (2, 11);
-- Club 3 (Jodorowsky) shows Holy Mountain
INSERT INTO schedules VALUES (3, 12);
-- Club 1 shows Spirited Away
INSERT INTO schedules VALUES (1, 13);

-- POSTS
INSERT INTO post VALUES (1, 'http://fb.com/event1', 'Facebook', 10);

-- LANGUAGES
INSERT INTO Language (languageID, name) VALUES 
(1, 'English'),
(2, 'Korean'),
(3, 'French'),
(4, 'Spanish'),
(5, 'Japanese');

-- SPOKEN_IN (Linking Films to Languages)
-- Format: (languageID, filmID)
INSERT INTO spoken_in VALUES 
(2, 1), -- Parasite is in Korean
(1, 2), -- Pulp Fiction is in English
(1, 3), -- The Room is in English
(5, 4), -- Spirited Away is in Japanese
(1, 5), -- Blade Runner 2049 is in English
(3, 6), -- La Haine is in French
(4, 7); -- The Holy Mountain is in Spanish

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;