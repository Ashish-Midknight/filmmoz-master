-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 02, 2023 at 09:13 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `filmmoz`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `userid` text NOT NULL,
  `password` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`userid`, `password`) VALUES
('Admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3');

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `Id` int(11) NOT NULL,
  `name` text NOT NULL,
  `client_contact` text NOT NULL,
  `client_email` text NOT NULL,
  `aadhar` longtext NOT NULL,
  `pan` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `favourite_movies`
--

CREATE TABLE `favourite_movies` (
  `favourite_movie_id` int(20) NOT NULL,
  `movie_id` int(20) NOT NULL,
  `user_id` int(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `history`
--

CREATE TABLE `history` (
  `hid` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `client_name` text NOT NULL,
  `total_views` int(11) NOT NULL,
  `date` text NOT NULL,
  `total_bill` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `movies`
--

CREATE TABLE `movies` (
  `movie_id` int(20) NOT NULL,
  `user_id` int(20) NOT NULL,
  `fav_movies_id` int(20) NOT NULL,
  `title` text NOT NULL,
  `director_name` text NOT NULL,
  `producer_name` text NOT NULL,
  `actor_name` text NOT NULL,
  `client_name` text NOT NULL,
  `client_id` int(11) NOT NULL,
  `story` text NOT NULL,
  `language` text NOT NULL,
  `file_name` text NOT NULL,
  `trailer` text NOT NULL,
  `category` text NOT NULL,
  `view_count` int(20) NOT NULL,
  `pre_month_views` int(11) NOT NULL,
  `price_per_view` int(11) NOT NULL,
  `thumb_file_name` text NOT NULL,
  `upload_time` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `recycle`
--

CREATE TABLE `recycle` (
  `Id` int(11) NOT NULL,
  `name` text NOT NULL,
  `client_contact` text NOT NULL,
  `client_email` text NOT NULL,
  `aadhar` text NOT NULL,
  `pan` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recycle`
--

INSERT INTO `recycle` (`Id`, `name`, `client_contact`, `client_email`, `aadhar`, `pan`) VALUES
(23, 'Niraj Trivedi', '0000000000', 'nirajt901@gmail.com', 'public/uploads/documents/Screenshot_20221215_035011.png', 'public/uploads/documents/Screenshot_20230205_104023.png');

-- --------------------------------------------------------

--
-- Table structure for table `sub_package`
--

CREATE TABLE `sub_package` (
  `id` int(11) NOT NULL,
  `p_name` text NOT NULL,
  `price` text NOT NULL,
  `dur_month` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(20) NOT NULL,
  `google_id` text NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `sub_plan` text NOT NULL,
  `sub_status` text NOT NULL,
  `sub_purch_date` text NOT NULL,
  `sub_end_date` text NOT NULL,
  `block_status` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `views`
--

CREATE TABLE `views` (
  `view_id` int(20) NOT NULL,
  `movie_id` int(20) NOT NULL,
  `user_id` int(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`Id`);

--
-- Indexes for table `favourite_movies`
--
ALTER TABLE `favourite_movies`
  ADD PRIMARY KEY (`favourite_movie_id`);

--
-- Indexes for table `history`
--
ALTER TABLE `history`
  ADD PRIMARY KEY (`hid`);

--
-- Indexes for table `movies`
--
ALTER TABLE `movies`
  ADD PRIMARY KEY (`movie_id`);

--
-- Indexes for table `sub_package`
--
ALTER TABLE `sub_package`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `views`
--
ALTER TABLE `views`
  ADD PRIMARY KEY (`view_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `favourite_movies`
--
ALTER TABLE `favourite_movies`
  MODIFY `favourite_movie_id` int(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history`
--
ALTER TABLE `history`
  MODIFY `hid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `movies`
--
ALTER TABLE `movies`
  MODIFY `movie_id` int(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sub_package`
--
ALTER TABLE `sub_package`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `views`
--
ALTER TABLE `views`
  MODIFY `view_id` int(20) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
