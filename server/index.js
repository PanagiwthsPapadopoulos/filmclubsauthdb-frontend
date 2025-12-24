const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise'); 
const { getDB } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Maps specific "Club Roles" (from belongs_to table) to "Database Users"
const ROLE_MAP = {
  // Officers -> Club Admin (Can manage members, finances, etc.)
  'President': 'clubAdmin',
  'Vice President': 'clubAdmin',
  'Treasurer': 'clubAdmin',
  'clubAdmin': 'clubAdmin',
  
  // Content Team -> Content Manager (Can manage films, screenings, posts)
  'Program Curator': 'contentManager',
  'Secretary': 'contentManager', // Secretaries often handle comms/posts
  'contentManager': 'contentManager',
  
  // Tech Team -> Equipment Manager (Can manage inventory)
  'Equipment Head': 'equipmentManager',
  'equipmentManager': 'equipmentManager',
  
  // General -> Club Member (Read-only access to private data)
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

  // Use the 'guest' connection strictly for the initial lookup
  const db = await mysql.createConnection({
    host: 'localhost', user: 'app_admin', password: 'adminpswrd', database: 'FilmClubsAUThDB'
  });

  try {
    // 1. Fetch User + Role Name + Club ID in one go
    // We join belongs_to to see their role in their primary club
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

    // 2. PASSWORD CHECK (Simplified for this stage)
    // In a real app, you would use bcrypt.compare(password, userData.hash)
    // For now, we assume if the user exists, they are "authenticated" for the demo
    // OR checking against a hardcoded list if you implemented that.
    
    // 3. DETERMINE SYSTEM ROLE (The Refactor)
    let systemRole = 'guest';

    // SPECIAL CASE: Superuser Override
    // We explicitly grant 'dbAdministrator' to specific usernames, regardless of their club role.
    if (userData.username === 'alex') {
        systemRole = 'dbAdministrator';
    } 
    // STANDARD LOOKUP: Map the Club Role to the DB Role
    else if (userData.roleName && ROLE_MAP[userData.roleName]) {
        systemRole = ROLE_MAP[userData.roleName];
    } 
    // FALLBACK
    else {
        console.warn(`[Login Warning] Unknown role '${userData.roleName}' for user '${userData.username}'. Defaulting to 'guest'.`);
        systemRole = 'guest';
    }

    console.log(`✅ Login Success: ${userData.username} -> Role: ${userData.roleName} -> DB User: ${systemRole}`);

    // 4. Return the Profile
    res.json({
      memberID: userData.memberID,
      username: userData.username,
      name: userData.name,
      role: systemRole,
      // Create a "clubs" array format to match frontend expectation
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

    // 1. Base Query using the View
    let sql = 'SELECT * FROM full_schedule WHERE 1=1';
    const params = [];

    // 2. Dynamic Filtering
    const { q, date } = req.query;

    if (q) {
      sql += ' AND (film_title LIKE ? OR venue_name LIKE ? OR club_name LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    if (date) {
      // Compares the date part only (YYYY-MM-DD)
      sql += ' AND DATE(screening_date) = ?';
      params.push(date);
    }

    // 3. Sorting
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
  const { role } = req.query; // ADDED ROLE EXTRACTION
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

    // 1. Get Core Metadata
    // We ADDED 'f.filmID' to the SELECT list here so we can use it next.
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

    const filmID = core[0].filmID; // <--- Capture the ID safely

    // 2. Get Directors (Still raw SQL as requested)
    const [directors] = await db.query(`
      SELECT d.name, d.TMDBLink 
      FROM directed dr 
      JOIN Director d ON dr.directorID = d.directorID
      WHERE dr.filmID = ?
    `, [filmID]); // Simplified: We can just use filmID here too!

    // 3. Get Cast (Using the IMPROVED View)
    // Now we just filter by filmID. Simple, fast, no title matching.
    const [cast] = await db.query(`
      SELECT actor_name as name, characterName, TMDBLink
      FROM cast_list
      WHERE filmID = ?
    `, [filmID]);

    // 4. Get Posts
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
//  CONTENT MANAGER ENDPOINTS (CMS)
// ==========================================

// 1.1 Insert Actor
app.post('/api/add-actor', async (req, res) => {
  const { name, tmdb, role } = req.body; // ADDED ROLE EXTRACTION
  const id = Math.floor(Math.random() * 100000);
  const db = getDB(role || 'guest');
  try {
    await db.query('INSERT INTO Actor (actorID, name, TMDBLink) VALUES (?, ?, ?)', [id, name, tmdb]);
    res.json({ message: 'Actor added successfully!' });
  } catch (err) { res.status(500).send(err.message); }
});

// 1.2 Insert Director
app.post('/api/add-director', async (req, res) => {
  const { name, tmdb, role } = req.body; // ADDED ROLE EXTRACTION
  const id = Math.floor(Math.random() * 100000);
  const db = getDB(role || 'guest');
  try {
    await db.query('INSERT INTO Director (directorID, name, TMDBLink) VALUES (?, ?, ?)', [id, name, tmdb]);
    res.json({ message: 'Director added successfully!' });
  } catch (err) { res.status(500).send(err.message); }
});

// 1.3 Insert Film
app.post('/api/add-film', async (req, res) => {
  const { title, year, tmdb, languageIDs, directorIDs, actorIDs, role } = req.body; // ADDED ROLE EXTRACTION
  const db = getDB(role || 'guest');
  
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const filmID = Math.floor(Math.random() * 100000);

    // 1. Insert Core Film Data
    await connection.query(
      'INSERT INTO Film (filmID, title, year, TMDBLink) VALUES (?, ?, ?, ?)', 
      [filmID, title, year, tmdb]
    );

    // 2. Link Languages
    if (languageIDs && languageIDs.length > 0) {
      const langValues = languageIDs.map(langID => [filmID, langID]);
      await connection.query('INSERT INTO spoken_in (filmID, languageID) VALUES ?', [langValues]); // Using spoken_in table
    }

    // 3. Link Directors
    if (directorIDs && directorIDs.length > 0) {
      const directorValues = directorIDs.map(dirID => [filmID, dirID]);
      await connection.query('INSERT INTO directed (filmID, directorID) VALUES ?', [directorValues]);
    }

    // 4. Link Actors
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

// 1.3.1. Search Directors
app.get('/api/directors', async (req, res) => {
  const { q, role } = req.query; // ADDED ROLE EXTRACTION
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

// 1.3.2. Search Actors
app.get('/api/actors', async (req, res) => {
  const { q, role } = req.query; // ADDED ROLE EXTRACTION
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

// 1.3.3. Get All Languages
app.get('/api/languages', async (req, res) => {
  const { role } = req.query; // ADDED ROLE EXTRACTION
  const db = getDB(role || 'guest');
  try {
    const [rows] = await db.query('SELECT languageID, name FROM language ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).send(err.message); }
});

// 2. Create Screening (Program)
app.post('/api/add-screening', async (req, res) => {
  const { date, venueID, filmID, clubID, role } = req.body; // ADDED ROLE EXTRACTION
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

// 2.1. Get Films (With Search)
app.get('/api/films', async (req, res) => {
  try {
    const { q, role } = req.query; // ADDED ROLE EXTRACTION
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

// 2.2. Get Venues (With Search)
// --- GET VENUES (With Department Name) ---
app.get('/api/venues', async (req, res) => {
  try {
    const role = req.query.role || req.headers['x-user-role'] || 'guest';
    const db = getDB(role);
    
    // NEW QUERY: Joins Venue with Department
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

// 3. Update External Links (Socials)
app.put('/api/update-film-link', async (req, res) => {
  const { filmID, tmdb, role } = req.body; // ADDED ROLE EXTRACTION
  const db = getDB(role || 'guest');
  try {
    await db.query('UPDATE Film SET TMDBLink = ? WHERE filmID = ?', [tmdb, filmID]);
    res.json({ message: 'Film TMDB Link Updated!' });
  } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/add-social-post', async (req, res) => {
  const { screeningID, platform, link, role } = req.body; // ADDED ROLE EXTRACTION
  const id = Math.floor(Math.random() * 100000);
  const db = getDB(role || 'guest');
  try {
    await db.query('INSERT INTO Post (postID, screeningID, platform, postLink) VALUES (?, ?, ?, ?)', [id, screeningID, platform, link]);
    res.json({ message: 'Social Media Post Linked!' });
  } catch (err) { res.status(500).send(err.message); }
});

// 4. Own Schedule Feed (With Search & Club Filtering)
app.get('/api/own-schedule', async (req, res) => {
  try {
    const { q, date, role, clubIds, activeClubID } = req.query; 

    // 1. Force Single Value
    const singleClubID = clubIds || activeClubID;

    // ---------------------------------------------------------
    // SECURITY FIX: If no ID is found, STOP immediately.
    // Do not run the query. Do not return all data.
    // ---------------------------------------------------------
    if (!singleClubID) {
      console.log("Blocked request with missing Club ID");
      return res.json([]); // Return empty array -> No flash!
    }

    // 2. CONNECT
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

    // 3. APPLY FILTER (Now guaranteed to exist)
    sql += ` AND sch.clubID = ?`;
    params.push(singleClubID);

    // 4. OTHER FILTERS
    if (q) {
      sql += ` AND (f.title LIKE ? OR v.name LIKE ? OR c.name LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
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
//  EQUIPMENT MANAGER (Logistics)
// ==========================================

// 1. GET INVENTORY (Strict Ownership Only)
app.get('/api/equipment-manage', async (req, res) => {
  // 1. Get the role from the custom header we set in AuthContext
  const role = req.headers['x-user-role'] || req.query.role || 'guest';
  
  // 2. Get the clubId
  const { clubIds } = req.query;

  // console.log("Verified Role:", role);
  // console.log("Target Club:", clubIds);

  // 3. Select the correct DB pool based on the verified role
  const db = getDB(role);
  // console.log("From inside equipment-manage endpoint role = "+role);

  try {
    const ids = clubIds ? clubIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
    
    // Safety Check: If no clubs, return nothing (Fixes the 'see nothing' bug for guests)
    if (ids.length === 0) return res.json([]);

    // SQL: ONLY fetch items connected to my clubs via 'owns' table
    // We do NOT show public items here unless I own them.
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

// 2. ADD NEW EQUIPMENT
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

// 3. SHARE EQUIPMENT
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

// 4. DELETE EQUIPMENT (New Feature)
app.delete('/api/delete-equipment/:id', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // Interceptor sends this
  const db = getDB(role);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    
    // Remove from 'owns' (Permissions)
    await connection.query('DELETE FROM owns WHERE equipmentID = ?', [id]);
    // Remove from 'uses' (Reservations - optional, or let DB cascade)
    await connection.query('DELETE FROM uses WHERE equipmentID = ?', [id]);
    // Remove Item
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

// 5. RESERVE EQUIPMENT (For Reservations Tab)
app.post('/api/reserve-equipment', async (req, res) => {
  const { equipmentID, screeningID, role } = req.body;
  const db = getDB(role);

  try {
    await db.query('INSERT INTO uses (equipmentID, screeningID) VALUES (?, ?)', [equipmentID, screeningID]);
    res.json({ message: 'Equipment reserved for screening!' });
  } catch (err) { res.status(500).send(err.message); }
});

// ==========================================
//  HELPER: Get Clubs eligible for sharing (Non-Owners)
// ==========================================
app.get('/api/clubs/non-owners', async (req, res) => {
  const { equipmentID, q, role } = req.query;
  
  if (!equipmentID) {
    return res.status(400).json({ error: "equipmentID is required" });
  }

  const db = getDB(role || 'guest');
  
  try {
    // LOGIC: Select clubs that are NOT in the 'owns' table for this item
    let sql = `
      SELECT clubID, name 
      FROM filmclub 
      WHERE clubID NOT IN (
        SELECT clubID FROM owns WHERE equipmentID = ?
      )
    `;
    const params = [equipmentID];

    // Optional: Search by name
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
//  CLUB ADMIN (Management)
// ==========================================

// 1. GET MEMBERS (For Management)
// We need more data than the public team page (like IDs and current status)
app.get('/api/manage-members/:clubID', async (req, res) => {
  const { clubID } = req.params;
  const { role } = req.query; // Passed from Frontend (e.g., 'dbAdministrator')
  
  // The 'role' determines which MySQL User Pool we use.
  // 'dbAdministrator' uses the superuser pool.
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

// 2. UPDATE MEMBER (Role & Status)
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



// A. Add this NEW Endpoint (to populate the dropdown)
app.get('/api/departments', async (req, res) => {
  const { role } = req.query;
  const db = getDB(role || 'guest');
  try {
    const [rows] = await db.query('SELECT departmentID, name FROM department ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).send(err.message); }
});

// 1. GET CLUB DETAILS (MUST include departmentID)
app.get('/api/club-details/:clubID', async (req, res) => {
  const { clubID } = req.params;
  const { role } = req.query;
  const db = getDB(role);


  try {
    // FIX: Make sure 'departmentID' is in this list!
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

// 2. UPDATE CLUB PROFILE
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
//  SYSTEM ADMIN (DB Administrator)
// ==========================================

// 1. MANAGE VENUES
app.post('/api/admin/venue', async (req, res) => {
  const { name, details, departmentID, role } = req.body;
  const db = getDB(role); // Must be 'dbAdministrator'
  try {
    const venueID = Math.floor(Math.random() * 100000);
    await db.query('INSERT INTO Venue (venueID, name, details, departmentID) VALUES (?, ?, ?, ?)', 
      [venueID, name, details, departmentID]);
    res.json({ message: 'Venue created' });
  } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/admin/venue/:id', async (req, res) => {
  const { role } = req.body; 
  const db = getDB(role);
  try {
    await db.query('DELETE FROM Venue WHERE venueID = ?', [req.params.id]);
    res.json({ message: 'Venue deleted' });
  } catch (err) { res.status(500).send(err.message); } // Fails if used in screenings
});

// 2. MANAGE CLUBS
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

app.delete('/api/admin/club/:id', async (req, res) => {
  const { role } = req.body;
  const db = getDB(role);
  try {
    await db.query('DELETE FROM FilmClub WHERE clubID = ?', [req.params.id]);
    res.json({ message: 'Club deleted' });
  } catch (err) { res.status(500).send(err.message); }
});


// CREATE A NEW FILM CLUB (DB Admin Only)
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





app.get('/api/admin/search-clubs', async (req, res) => {
  const { searchTerm } = req.query;
  const db = getDB('dbAdministrator'); // Use the high-privilege pool

  try {
    // If searchTerm is empty, returns all clubs. Otherwise, filters by name.
    const sql = searchTerm 
      ? "SELECT clubID, name FROM filmclub WHERE name LIKE ? LIMIT 10"
      : "SELECT clubID, name FROM filmclub LIMIT 20";
    
    const [rows] = await db.query(sql, [`%${searchTerm}%`]);
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// GET ALL CLUBS (Admin Only)
app.get('/api/clubs', async (req, res) => {
  try {
    // Basic role check (optional, remove if you want it public)
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

// GET GLOBAL MEMBER DIRECTORY (Admin Only)
app.get('/api/admin/members-global', async (req, res) => {
  try {
    const role = req.query.role || req.headers['x-user-role'] || 'guest';
    // Only admins should usually see the full member list
    if (role !== 'dbAdministrator' && role !== 'clubAdmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const db = getDB(role);

    // This query grabs the member info AND combines their clubs/roles into one string
    // Example Output for 'clubs': "CineF.Hl (President), Nyxterides (Member)"
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

// 5. DELETE MEMBER (System Admin Only)
// ==================================================================
app.delete('/api/admin/member/:id', async (req, res) => {
  try {
    const role = req.body.role || req.headers['x-user-role'];
    
    // Strict Security Check
    if (role !== 'dbAdministrator') {
      return res.status(403).json({ error: 'Access denied. Superuser only.' });
    }

    const db = getDB(role);
    const memberID = req.params.id;

    // Delete the member (DB triggers will handle cleanup of memberships)
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