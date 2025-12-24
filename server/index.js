const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise'); 
const { getDB } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Map application roles to database users
const ROLE_MAP = {
  // Officers: Club Admin permissions
  'President': 'clubAdmin',
  'Vice President': 'clubAdmin',
  'Treasurer': 'clubAdmin',
  'clubAdmin': 'clubAdmin',
  
  // Content Team: Content Manager permissions
  'Program Curator': 'contentManager',
  'Secretary': 'contentManager',
  'contentManager': 'contentManager',
  
  // Tech Team: Equipment Manager permissions
  'Equipment Head': 'equipmentManager',
  'equipmentManager': 'equipmentManager',
  
  // General: Standard Member permissions
  'Casual Member': 'clubMember',
  'Member': 'clubMember',
  'Club Member': 'clubMember',
  'clubMember': 'clubMember',
};

// ==========================================
//  AUTHENTICATION & LOGIN
// ==========================================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Establish temporary connection for user lookup
  const db = await mysql.createConnection({
    host: 'localhost', user: 'app_admin', password: 'adminpswrd', database: 'FilmClubsAUThDB'
  });

  try {
    // Retrieve user details and primary club role
    const sql = `
      SELECT m.memberID, m.name, b.roleName, b.clubID
      FROM member m
      LEFT JOIN belongs_to b ON m.memberID = b.memberID
      WHERE m.name = ?
    `;
    
    const [rows] = await db.execute(sql, [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const userData = rows[0];
    
    // Determine system role based on mapped permissions
    let systemRole = 'guest';

    // Override for superuser
    if (userData.username === 'alex') {
        systemRole = 'dbAdministrator';
    } 
    // Map club role to database role
    else if (userData.roleName && ROLE_MAP[userData.roleName]) {
        systemRole = ROLE_MAP[userData.roleName];
    } 
    // Fallback for unknown roles
    else {
        console.warn(`[Login Warning] Unknown role '${userData.roleName}' for user '${userData.username}'. Defaulting to 'guest'.`);
        systemRole = 'guest';
    }

    console.log(`✅ Login Success: ${userData.username} -> Role: ${userData.roleName} -> DB User: ${systemRole}`);

    // Return user profile
    res.json({
      memberID: userData.memberID,
      username: userData.username,
      name: userData.name,
      role: systemRole,
      clubs: userData.clubID ? [{ clubID: userData.clubID, role: userData.roleName }] : []
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await db.end();
  }
});

// ==========================================
//  MAIN SCHEDULE FEED
// ==========================================
app.get('/api/schedule', async (req, res) => {
  try {
    const role = req.query.role || 'guest';
    const db = getDB(role);

    let sql = 'SELECT * FROM full_schedule WHERE 1=1';
    const params = [];

    // Apply filters if provided
    const { q, date } = req.query;

    if (q) {
      sql += ' AND (film_title LIKE ? OR venue_name LIKE ? OR club_name LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    if (date) {
      sql += ' AND DATE(screening_date) = ?';
      params.push(date);
    }

    sql += ' ORDER BY screening_date ASC';

    const [rows] = await db.query(sql, params);
    res.json(rows);

  } catch (err) {
    console.error("Error fetching schedule:", err);
    res.status(500).send(err.message);
  }
});

// ==========================================
//  TEAM MEMBERS
// ==========================================
app.get('/api/team/:clubId', async (req, res) => {
  const { role } = req.query;
  const db = getDB(role || 'guest');
  try {
    const { clubId } = req.params;
    const [rows] = await db.query(`
      SELECT m.name, m.phoneNumber, m.instagramHandle, b.roleName 
      FROM member m
      JOIN belongs_to b ON m.memberID = b.memberID
      WHERE b.clubID = ? AND b.isActive = 1
    `, [clubId]);
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ==========================================
//  SINGLE SCREENING DETAILS
// ==========================================
app.get('/api/screening/:id', async (req, res) => {
  try {
    const { role } = req.query;
    const id = req.params.id;
    const db = getDB(role || 'guest');

    // Retrieve core metadata
    const [core] = await db.query(`
      SELECT s.screeningID, s.date, v.name as venue, v.details as venue_details,
             f.filmID, f.title, f.year, f.TMDBLink as filmLink, 
             c.name as club, c.emailAddress as clubEmail
      FROM Screening s
      JOIN Venue v ON s.venueID = v.venueID
      JOIN shows sh ON s.screeningID = sh.screeningID
      JOIN Film f ON sh.filmID = f.filmID
      JOIN schedules sch ON s.screeningID = sch.screeningID
      JOIN FilmClub c ON sch.clubID = c.clubID
      WHERE s.screeningID = ?
    `, [id]);

    if (core.length === 0) return res.status(404).json({ error: 'Not Found' });

    const filmID = core[0].filmID;

    // Retrieve directors
    const [directors] = await db.query(`
      SELECT d.name, d.TMDBLink 
      FROM directed dr 
      JOIN Director d ON dr.directorID = d.directorID
      WHERE dr.filmID = ?
    `, [filmID]);

    // Retrieve cast
    const [cast] = await db.query(`
      SELECT actor_name as name, characterName, TMDBLink
      FROM cast_list
      WHERE filmID = ?
    `, [filmID]);

    // Retrieve related posts
    const [posts] = await db.query(`
      SELECT platform, postLink 
      FROM Post 
      WHERE screeningID = ?
    `, [id]);

    res.json({
      ...core[0],
      directors,
      cast,
      posts
    });

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// ==========================================
//  CONTENT MANAGEMENT
// ==========================================

// Insert Actor
app.post('/api/add-actor', async (req, res) => {
  const { name, tmdb, role } = req.body;
  const id = Math.floor(Math.random() * 100000);
  const db = getDB(role || 'guest');
  try {
    await db.query('INSERT INTO Actor (actorID, name, TMDBLink) VALUES (?, ?, ?)', [id, name, tmdb]);
    res.json({ message: 'Actor added successfully!' });
  } catch (err) { res.status(500).send(err.message); }
});

// Insert Director
app.post('/api/add-director', async (req, res) => {
  const { name, tmdb, role } = req.body;
  const id = Math.floor(Math.random() * 100000);
  const db = getDB(role || 'guest');
  try {
    await db.query('INSERT INTO Director (directorID, name, TMDBLink) VALUES (?, ?, ?)', [id, name, tmdb]);
    res.json({ message: 'Director added successfully!' });
  } catch (err) { res.status(500).send(err.message); }
});

// Insert Film with Associations
app.post('/api/add-film', async (req, res) => {
  const { title, year, tmdb, languageIDs, directorIDs, actorIDs, role } = req.body;
  const db = getDB(role || 'guest');
  
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const filmID = Math.floor(Math.random() * 100000);

    // Insert core film data
    await connection.query(
      'INSERT INTO Film (filmID, title, year, TMDBLink) VALUES (?, ?, ?, ?)', 
      [filmID, title, year, tmdb]
    );

    // Link languages
    if (languageIDs && languageIDs.length > 0) {
      const langValues = languageIDs.map(langID => [filmID, langID]);
      await connection.query('INSERT INTO spoken_in (filmID, languageID) VALUES ?', [langValues]);
    }

    // Link directors
    if (directorIDs && directorIDs.length > 0) {
      const directorValues = directorIDs.map(dirID => [filmID, dirID]);
      await connection.query('INSERT INTO directed (filmID, directorID) VALUES ?', [directorValues]);
    }

    // Link actors
    if (actorIDs && actorIDs.length > 0) {
      const actorValues = actorIDs.map(actor => [filmID, actor.actorID, actor.characterName || 'Unknown']);
      await connection.query('INSERT INTO played_in (filmID, actorID, characterName) VALUES ?', [actorValues]);
    }

    await connection.commit();
    res.json({ message: 'Film created successfully with all associations!' });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Search Directors
app.get('/api/directors', async (req, res) => {
  const { q, role } = req.query;
  const db = getDB(role || 'guest');
  try {
    let sql = 'SELECT directorID, name FROM Director';
    if (q) {
      sql += ` WHERE name LIKE ${mysql.escape('%'+q+'%')}`;
    }
    sql += ' ORDER BY name LIMIT 20';
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) { res.status(500).send(err.message); }
});

// Search Actors
app.get('/api/actors', async (req, res) => {
  const { q, role } = req.query;
  const db = getDB(role || 'guest');
  try {
    let sql = 'SELECT actorID, name FROM Actor';
    if (q) {
      sql += ` WHERE name LIKE ${mysql.escape('%'+q+'%')}`;
    }
    sql += ' ORDER BY name LIMIT 20';
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) { res.status(500).send(err.message); }
});

// Get All Languages
app.get('/api/languages', async (req, res) => {
  const { role } = req.query;
  const db = getDB(role || 'guest');
  try {
    const [rows] = await db.query('SELECT languageID, name FROM language ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).send(err.message); }
});

// ==========================================
//  SCREENING MANAGEMENT
// ==========================================

// Create Screening
app.post('/api/add-screening', async (req, res) => {
  const { date, venueID, filmID, clubID, role } = req.body;
  const db = getDB(role || 'guest');
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const newScreeningID = Math.floor(Math.random() * 100000);
    
    await connection.query('INSERT INTO Screening (screeningID, date, venueID) VALUES (?, ?, ?)', [newScreeningID, date, venueID]);
    await connection.query('INSERT INTO shows (screeningID, filmID) VALUES (?, ?)', [newScreeningID, filmID]);
    await connection.query('INSERT INTO schedules (clubID, screeningID) VALUES (?, ?)', [clubID, newScreeningID]);
    
    await connection.commit();
    res.json({ message: 'Screening created successfully!' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Get Films (Searchable)
app.get('/api/films', async (req, res) => {
  try {
    const { q, role } = req.query;
    const db = getDB(role || 'guest');
    let sql = 'SELECT filmID, title FROM Film';
    let params = [];

    if (q) {
      sql += ' WHERE title LIKE ?';
      params.push(`%${q}%`);
    }

    sql += ' ORDER BY title';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).send(err.message); }
});

// Get Venues with Department
app.get('/api/venues', async (req, res) => {
  try {
    const role = req.query.role || req.headers['x-user-role'] || 'guest';
    const db = getDB(role);
    
    const sql = `
      SELECT 
        v.venueID, 
        v.name, 
        v.details, 
        v.departmentID,
        d.name AS department_name
      FROM venue v
      LEFT JOIN department d ON v.departmentID = d.departmentID
      ORDER BY v.name ASC
    `;
    
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) { res.status(500).send(err.message); }
});

// Update External Links
app.put('/api/update-film-link', async (req, res) => {
  const { filmID, tmdb, role } = req.body;
  const db = getDB(role || 'guest');
  try {
    await db.query('UPDATE Film SET TMDBLink = ? WHERE filmID = ?', [tmdb, filmID]);
    res.json({ message: 'Film TMDB Link Updated!' });
  } catch (err) { res.status(500).send(err.message); }
});

// Link Social Post
app.post('/api/add-social-post', async (req, res) => {
  const { screeningID, platform, link, role } = req.body;
  const id = Math.floor(Math.random() * 100000);
  const db = getDB(role || 'guest');
  try {
    await db.query('INSERT INTO Post (postID, screeningID, platform, postLink) VALUES (?, ?, ?, ?)', [id, screeningID, platform, link]);
    res.json({ message: 'Social Media Post Linked!' });
  } catch (err) { res.status(500).send(err.message); }
});

// ==========================================
//  CLUB SPECIFIC SCHEDULE
// ==========================================
app.get('/api/own-schedule', async (req, res) => {
  try {
    const { q, date, role, clubIds, activeClubID } = req.query; 

    // Enforce single club ID
    const singleClubID = clubIds || activeClubID;

    if (!singleClubID) {
      console.log("Blocked request with missing Club ID");
      return res.json([]);
    }

    const userRole = req.userRole || role || 'guest';
    const db = getDB(userRole);

    let sql = `
      SELECT 
        s.screeningID, s.date as screening_date,
        f.title as film_title,
        v.name as venue_name,
        c.name as club_name
      FROM Screening s
      LEFT JOIN shows sh ON s.screeningID = sh.screeningID
      LEFT JOIN Film f ON sh.filmID = f.filmID
      LEFT JOIN Venue v ON s.venueID = v.venueID
      LEFT JOIN schedules sch ON s.screeningID = sch.screeningID
      LEFT JOIN FilmClub c ON sch.clubID = c.clubID
      WHERE 1=1 
    `;

    const params = [];

    // Filter by Club ID
    sql += ` AND sch.clubID = ?`;
    params.push(singleClubID);

    // Filter by Search Query
    if (q) {
      sql += ` AND (f.title LIKE ? OR v.name LIKE ? OR c.name LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    // Filter by Date
    if (date) {
      sql += ` AND DATE(s.date) = ?`;
      params.push(date);
    }

    sql += ` GROUP BY s.screeningID, s.date, f.title, v.name, c.name ORDER BY s.date ASC`;
    
    const [rows] = await db.query(sql, params);
    res.json(rows);

  } catch (err) { 
    console.error(err);
    res.status(500).send(err.message); 
  }
});

// ==========================================
//  EQUIPMENT MANAGEMENT
// ==========================================

// Get Inventory (Strict Ownership)
app.get('/api/equipment-manage', async (req, res) => {
  const role = req.headers['x-user-role'] || req.query.role || 'guest';
  const { clubIds } = req.query;
  const db = getDB(role);

  try {
    const ids = clubIds ? clubIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
    
    if (ids.length === 0) return res.json([]);

    // Fetch items connected to user's clubs
    const sql = `
      SELECT e.equipmentID, e.name, e.isPrivate, 
             GROUP_CONCAT(fc.name SEPARATOR ', ') as owners,
             GROUP_CONCAT(fc.clubID SEPARATOR ',') as ownerIDs
      FROM equipment e
      JOIN owns o ON e.equipmentID = o.equipmentID
      JOIN filmclub fc ON o.clubID = fc.clubID
      WHERE EXISTS (
        SELECT 1 FROM owns o2 
        WHERE o2.equipmentID = e.equipmentID 
        AND o2.clubID IN (${ids.map(() => '?').join(',')})
      )
      GROUP BY e.equipmentID, e.name, e.isPrivate
      ORDER BY e.name ASC
    `;

    const [rows] = await db.query(sql, ids);
    res.json(rows);

  } catch (err) { res.status(500).send(err.message); }
});

// Add Equipment
app.post('/api/add-equipment', async (req, res) => {
  const { name, isPrivate, clubID, role } = req.body;
  const db = getDB(role); 
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const eqID = Math.floor(Math.random() * 100000);

    // Insert Item
    await connection.query('INSERT INTO equipment (equipmentID, name, isPrivate) VALUES (?, ?, ?)', [eqID, name, isPrivate ? 1 : 0]);

    // Link Ownership
    await connection.query('INSERT INTO owns (clubID, equipmentID) VALUES (?, ?)', [clubID, eqID]);

    await connection.commit();
    res.json({ message: 'Equipment added to inventory!' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Share Equipment
app.post('/api/share-equipment', async (req, res) => {
  const { equipmentID, targetClubID, role } = req.body;
  const db = getDB(role);
  
  try {
    await db.query('INSERT INTO owns (equipmentID, clubID) VALUES (?, ?)', [equipmentID, targetClubID]);
    res.json({ message: 'Equipment ownership shared!' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') res.status(400).json({ error: 'Already shared with this club.' });
    else res.status(500).send(err.message);
  }
});

// Delete Equipment
app.delete('/api/delete-equipment/:id', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const db = getDB(role);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    
    // Cleanup associations and remove item
    await connection.query('DELETE FROM owns WHERE equipmentID = ?', [id]);
    await connection.query('DELETE FROM uses WHERE equipmentID = ?', [id]);
    await connection.query('DELETE FROM equipment WHERE equipmentID = ?', [id]);

    await connection.commit();
    res.json({ message: 'Item deleted permanently.' });
  } catch (err) {
    await connection.rollback();
    res.status(500).send(err.message);
  } finally {
    connection.release();
  }
});

// Reserve Equipment
app.post('/api/reserve-equipment', async (req, res) => {
  const { equipmentID, screeningID, role } = req.body;
  const db = getDB(role);

  try {
    await db.query('INSERT INTO uses (equipmentID, screeningID) VALUES (?, ?)', [equipmentID, screeningID]);
    res.json({ message: 'Equipment reserved for screening!' });
  } catch (err) { res.status(500).send(err.message); }
});

// Get Non-Owner Clubs
app.get('/api/clubs/non-owners', async (req, res) => {
  const { equipmentID, q, role } = req.query;
  
  if (!equipmentID) {
    return res.status(400).json({ error: "equipmentID is required" });
  }

  const db = getDB(role || 'guest');
  
  try {
    let sql = `
      SELECT clubID, name 
      FROM filmclub 
      WHERE clubID NOT IN (
        SELECT clubID FROM owns WHERE equipmentID = ?
      )
    `;
    const params = [equipmentID];

    if (q) {
      sql += ` AND name LIKE ?`;
      params.push(`%${q}%`);
    }

    sql += ` ORDER BY name ASC LIMIT 20`;

    const [rows] = await db.query(sql, params);
    res.json(rows);

  } catch (err) { 
    console.error(err);
    res.status(500).send(err.message); 
  }
});

// ==========================================
//  CLUB ADMINISTRATION
// ==========================================

// Get Members for Management
app.get('/api/manage-members/:clubID', async (req, res) => {
  const { clubID } = req.params;
  const { role } = req.query;
  const db = getDB(role); 

  try {
    const sql = `
      SELECT m.memberID, m.name, b.roleName, b.isActive
      FROM member m
      JOIN belongs_to b ON m.memberID = b.memberID
      WHERE b.clubID = ?
      ORDER BY b.isActive DESC, m.name ASC
    `;
    const [rows] = await db.query(sql, [clubID]);
    res.json(rows);
  } catch (err) { 
    res.status(500).send(err.message); 
  }
});

// Update Member Status
app.put('/api/update-member', async (req, res) => {
  const { memberID, clubID, roleName, isActive, role } = req.body;
  const db = getDB(role);

  try {
    await db.query(
      'UPDATE belongs_to SET roleName = ?, isActive = ? WHERE memberID = ? AND clubID = ?',
      [roleName, isActive ? 1 : 0, memberID, clubID]
    );
    res.json({ message: 'Member updated successfully.' });
  } catch (err) { res.status(500).send(err.message); }
});

// Get Departments
app.get('/api/departments', async (req, res) => {
  const { role } = req.query;
  const db = getDB(role || 'guest');
  try {
    const [rows] = await db.query('SELECT departmentID, name FROM department ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).send(err.message); }
});

// Get Club Details
app.get('/api/club-details/:clubID', async (req, res) => {
  const { clubID } = req.params;
  const { role } = req.query;
  const db = getDB(role);


  try {
    const sql = `
      SELECT name, emailAddress, instagramHandle, facebookHandle, isActive, departmentID 
      FROM filmclub 
      WHERE clubID = ?
    `;
    
    const [rows] = await db.query(sql, [clubID]);
    
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).send('Club not found');
    }
  } catch (err) { 
    res.status(500).send(err.message); 
  }
});

// Update Club Profile
app.put('/api/update-club', async (req, res) => {
  const { clubID, email, instagram, facebook, isActive, departmentID, role } = req.body;
  const db = getDB(role);

  try {
    const finalDepID = (departmentID === '' || departmentID === 'null' || departmentID === undefined) ? null : departmentID;
    
    const sql = `
      UPDATE filmclub 
      SET emailAddress = ?, 
          instagramHandle = ?, 
          facebookHandle = ?, 
          isActive = ?, 
          departmentID = ? 
      WHERE clubID = ?
    `;

    const [result] = await db.query(sql, [email, instagram, facebook, isActive ? 1 : 0, finalDepID, clubID]);

    res.json({ message: 'Club profile updated successfully!' });
  } catch (err) { 
    res.status(500).send(err.message); 
  }
});


// ==========================================
//  SYSTEM ADMINISTRATION
// ==========================================

// Create Venue
app.post('/api/admin/venue', async (req, res) => {
  const { name, details, departmentID, role } = req.body;
  const db = getDB(role);
  try {
    const venueID = Math.floor(Math.random() * 100000);
    await db.query('INSERT INTO Venue (venueID, name, details, departmentID) VALUES (?, ?, ?, ?)', 
      [venueID, name, details, departmentID]);
    res.json({ message: 'Venue created' });
  } catch (err) { res.status(500).send(err.message); }
});

// Delete Venue
app.delete('/api/admin/venue/:id', async (req, res) => {
  const { role } = req.body; 
  const db = getDB(role);
  try {
    await db.query('DELETE FROM Venue WHERE venueID = ?', [req.params.id]);
    res.json({ message: 'Venue deleted' });
  } catch (err) { res.status(500).send(err.message); }
});

// Create Club
app.post('/api/admin/club', async (req, res) => {
  const { name, email, departmentID, role } = req.body;
  const db = getDB(role);
  try {
    const clubID = Math.floor(Math.random() * 100000);
    await db.query('INSERT INTO FilmClub (clubID, name, emailAddress, departmentID, isActive, foundingDate) VALUES (?, ?, ?, ?, 1, CURDATE())', 
      [clubID, name, email, departmentID]);
    res.json({ message: 'Club created' });
  } catch (err) { res.status(500).send(err.message); }
});

// Delete Club
app.delete('/api/admin/club/:id', async (req, res) => {
  const { role } = req.body;
  const db = getDB(role);
  try {
    await db.query('DELETE FROM FilmClub WHERE clubID = ?', [req.params.id]);
    res.json({ message: 'Club deleted' });
  } catch (err) { res.status(500).send(err.message); }
});

// Create New Club (Restricted)
app.post('/api/admin/create-club', async (req, res) => {
  const { name, email, departmentID, role } = req.body;
  if (role !== 'dbAdministrator') return res.status(403).send("Forbidden");

  const db = getDB(role);
  try {
    const [result] = await db.query(
      'INSERT INTO filmclub (name, emailAddress, departmentID, isActive) VALUES (?, ?, ?, 1)', 
      [name, email, departmentID]
    );
    res.json({ clubID: result.insertId, message: 'Club Created' });
  } catch (err) { res.status(500).send(err.message); }
});

// Search Clubs
app.get('/api/admin/search-clubs', async (req, res) => {
  const { searchTerm } = req.query;
  const db = getDB('dbAdministrator');

  try {
    const sql = searchTerm 
      ? "SELECT clubID, name FROM filmclub WHERE name LIKE ? LIMIT 10"
      : "SELECT clubID, name FROM filmclub LIMIT 20";
    
    const [rows] = await db.query(sql, [`%${searchTerm}%`]);
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// Get All Clubs
app.get('/api/clubs', async (req, res) => {
  try {
    const role = req.query.role || req.headers['x-user-role'] || 'guest';
    const db = getDB(role); 

    const sql = `
      SELECT 
        fc.clubID, 
        fc.name, 
        fc.foundingDate, 
        fc.isActive, 
        fc.emailAddress, 
        fc.instagramHandle, 
        fc.facebookHandle,
        d.name AS department_name
      FROM filmclub fc
      LEFT JOIN department d ON fc.departmentID = d.departmentID
      ORDER BY fc.name ASC
    `;

    const [rows] = await db.query(sql);
    res.json(rows);

  } catch (err) {
    console.error("Error fetching clubs:", err);
    res.status(500).send(err.message);
  }
});

// Get Global Member Directory
app.get('/api/admin/members-global', async (req, res) => {
  try {
    const role = req.query.role || req.headers['x-user-role'] || 'guest';
    
    if (role !== 'dbAdministrator' && role !== 'clubAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const db = getDB(role);

    // Concatenate all distinct club roles for each member
    const sql = `
      SELECT 
        m.memberID, 
        m.name, 
        m.phoneNumber, 
        m.instagramHandle, 
        m.facebookHandle,
        d.name AS department_name,
        GROUP_CONCAT(
            DISTINCT CONCAT(fc.name, ' (', b.roleName, ')') 
            SEPARATOR ', '
        ) as clubs
      FROM member m
      LEFT JOIN department d ON m.departmentID = d.departmentID
      LEFT JOIN belongs_to b ON m.memberID = b.memberID
      LEFT JOIN filmclub fc ON b.clubID = fc.clubID
      GROUP BY m.memberID, m.name, m.phoneNumber, m.instagramHandle, m.facebookHandle, d.name
      ORDER BY m.name ASC
    `;

    const [rows] = await db.query(sql);
    res.json(rows);

  } catch (err) {
    console.error("Error fetching global members:", err);
    res.status(500).send(err.message);
  }
});

// Delete Member
app.delete('/api/admin/member/:id', async (req, res) => {
  try {
    const role = req.body.role || req.headers['x-user-role'];
    
    // Strict privilege check
    if (role !== 'dbAdministrator') {
      return res.status(403).json({ error: 'Access denied. Superuser only.' });
    }

    const db = getDB(role);
    const memberID = req.params.id;

    await db.query('DELETE FROM member WHERE memberID = ?', [memberID]);
    
    res.json({ message: "Member permanently removed" });

  } catch (err) {
    console.error("Delete Member Error:", err);
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});