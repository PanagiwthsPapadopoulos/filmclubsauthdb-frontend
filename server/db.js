const mysql = require('mysql2');

// ==========================================
//  CONNECTION POOLS
// ==========================================

// Guest Pool (Public Read-Only)
const guestPool = mysql.createPool({
  host: 'localhost',
  user: 'app_guest',
  password: 'guestpswrd',
  database: 'FilmClubsAUThDB',
  waitForConnections: true,
  connectionLimit: 5
});

// Club Member Pool
const memberPool = mysql.createPool({
  host: 'localhost',
  user: 'app_clubMember',
  password: 'memberpswrd',
  database: 'FilmClubsAUThDB',
  waitForConnections: true,
  connectionLimit: 5
});

// Content Manager Pool (Insert/Update Films)
const contentManagerPool = mysql.createPool({
  host: 'localhost',
  user: 'app_contentManager',
  password: 'contentpswrd',
  database: 'FilmClubsAUThDB',
  waitForConnections: true,
  connectionLimit: 5
});

// Equipment Manager Pool
const equipmentManagerPool = mysql.createPool({
  host: 'localhost',
  user: 'app_equipmentManager',
  password: 'equipmentpswrd',
  database: 'FilmClubsAUThDB',
  waitForConnections: true,
  connectionLimit: 5
});

// Club Admin Pool (High Privileges)
const clubAdminPool = mysql.createPool({
  host: 'localhost',
  user: 'app_clubAdmin',
  password: 'clubpswrd',
  database: 'FilmClubsAUThDB',
  waitForConnections: true,
  connectionLimit: 5
});

// Super Admin Pool (Delete/Drop)
const adminPool = mysql.createPool({
  host: 'localhost',
  user: 'app_admin',
  password: 'adminpswrd',
  database: 'FilmClubsAUThDB',
  waitForConnections: true,
  connectionLimit: 5
});

// ==========================================
//  CONNECTION SELECTOR
// ==========================================

// Select database connection based on user role
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