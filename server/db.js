const mysql = require('mysql2');

// 1. GUEST POOL (Public Read-Only)
const guestPool = mysql.createPool({
  host: 'localhost',
  user: 'app_guest',          // Matches your CREATE USER
  password: 'guestpswrd',     // Matches your IDENTIFIED BY
  database: 'FilmClubsAUThDB',
  waitForConnections: true,
  connectionLimit: 5
});

// 2. CLUB MEMBER POOL
const memberPool = mysql.createPool({
  host: 'localhost',
  user: 'app_clubMember',
  password: 'memberpswrd',
  database: 'FilmClubsAUThDB',
  waitForConnections: true,
  connectionLimit: 5
});

// 3. CONTENT MANAGER POOL (Can Insert/Update Films)
const contentManagerPool = mysql.createPool({
  host: 'localhost',
  user: 'app_contentManager',
  password: 'contentpswrd',
  database: 'FilmClubsAUThDB',
  waitForConnections: true,
  connectionLimit: 5
});

// 4. EQUIPMENT MANAGER POOL
const equipmentManagerPool = mysql.createPool({
  host: 'localhost',
  user: 'app_equipmentManager',
  password: 'equipmentpswrd',
  database: 'FilmClubsAUThDB',
  waitForConnections: true,
  connectionLimit: 5
});

// 5. CLUB ADMIN POOL (High Privileges)
const clubAdminPool = mysql.createPool({
  host: 'localhost',
  user: 'app_clubAdmin',
  password: 'clubpswrd',
  database: 'FilmClubsAUThDB',
  waitForConnections: true,
  connectionLimit: 5
});

// 6. SUPER ADMIN POOL (Can Delete/Drop)
const adminPool = mysql.createPool({
  host: 'localhost',
  user: 'app_admin',
  password: 'adminpswrd',
  database: 'FilmClubsAUThDB',
  waitForConnections: true,
  connectionLimit: 5
});

// THE SWITCHER FUNCTION
// This decides which connection to give based on the user's role
const getDB = (role) => {
  console.log(`🔌 Requesting DB Connection for Role: ${role}`);
  
  switch (role) {
    case 'contentManager':
      return contentManagerPool.promise();
    case 'equipmentManager':
      return equipmentManagerPool.promise();
    case 'clubAdmin':
      return clubAdminPool.promise();
    case 'dbAdministrator':
      return adminPool.promise();
    case 'clubMember':
      return memberPool.promise();
    case 'guest':
    default:
      return guestPool.promise();
  }
};

module.exports = { getDB };