const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET = process.env.JWT_SECRET || 'evallo_dev_secret';
const PORT = process.env.PORT || 5000;
const LOGFILE = __dirname + '/logs.json';

app.get("/", (req, res) => {
  res.send("Backend is running ✔️");
});

// simple persistent logs file helper
function addLog(entry){
  const now = new Date().toISOString();
  const row = { id: uuidv4(), timestamp: now, ...entry };
  let arr = [];
  try { arr = JSON.parse(fs.readFileSync(LOGFILE)); } catch(e){ arr = []; }
  arr.unshift(row);
  fs.writeFileSync(LOGFILE, JSON.stringify(arr, null, 2));
}

// In-memory "DB" that mimics per-organisation data
const db = {
  organisations: [],
  users: [],
  employees: [],
  teams: [],
  employee_teams: []
};

// Helper: authenticate middleware
function authMiddleware(req,res,next){
  const auth = req.headers.authorization || '';
  const token = auth.split(' ')[1];
  if(!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch(err){
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// --- Auth endpoints ---
// Register organisation + admin
app.post('/api/auth/register', async (req,res) => {
  const { orgName, adminName, email, password } = req.body;
  if(!orgName || !email || !password) return res.status(400).json({ message:'missing fields' });
  // create org
  const org = { id: uuidv4(), name: orgName };
  db.organisations.push(org);
  // create user
  const hash = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), organisation_id: org.id, name: adminName || 'Admin', email, password_hash: hash };
  db.users.push(user);
  const token = jwt.sign({ userId: user.id, orgId: org.id }, SECRET, { expiresIn: '8h' });
  addLog({ organisation_id: org.id, user_id: user.id, action: 'organisation_created', meta: { orgName }});
  addLog({ organisation_id: org.id, user_id: user.id, action: 'user_registered', meta: { email }});
  res.json({ token, user: { id: user.id, name: user.name, email: user.email }});
});

// Login
app.post('/api/auth/login', async (req,res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);
  if(!user) return res.status(401).json({ message: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password_hash);
  if(!match) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, orgId: user.organisation_id }, SECRET, { expiresIn: '8h' });
  addLog({ organisation_id: user.organisation_id, user_id: user.id, action: 'user_logged_in', meta: { email }});
  res.json({ token, user: { id: user.id, name: user.name, email: user.email }});
});

// Logout (client can call for log entry)
app.post('/api/auth/logout', authMiddleware, (req,res) => {
  addLog({ organisation_id: req.user.orgId, user_id: req.user.userId, action: 'user_logged_out', meta: {}});
  res.json({ message: 'logged out' });
});

// --- Employees CRUD ---
app.get('/api/employees', authMiddleware, (req,res) => {
  const rows = db.employees.filter(e => e.organisation_id === req.user.orgId);
  res.json(rows);
});

app.post('/api/employees', authMiddleware, (req,res) => {
  const { first_name, last_name, email, phone } = req.body;
  const emp = { id: uuidv4(), organisation_id: req.user.orgId, first_name, last_name, email, phone, created_at: new Date().toISOString() };
  db.employees.push(emp);
  addLog({ organisation_id: req.user.orgId, user_id: req.user.userId, action: 'employee_created', meta: { employeeId: emp.id }});
  res.status(201).json(emp);
});

app.get('/api/employees/:id', authMiddleware, (req,res) => {
  const emp = db.employees.find(e => e.id === req.params.id && e.organisation_id === req.user.orgId);
  if(!emp) return res.status(404).json({ message:'not found' });
  // include teams
  const teamIds = db.employee_teams.filter(et => et.employee_id === emp.id).map(et => et.team_id);
  const teams = db.teams.filter(t => teamIds.includes(t.id));
  res.json({ ...emp, teams });
});

app.put('/api/employees/:id', authMiddleware, (req,res) => {
  const emp = db.employees.find(e => e.id === req.params.id && e.organisation_id === req.user.orgId);
  if(!emp) return res.status(404).json({ message:'not found' });
  const { first_name, last_name, email, phone } = req.body;
  emp.first_name = first_name ?? emp.first_name;
  emp.last_name = last_name ?? emp.last_name;
  emp.email = email ?? emp.email;
  emp.phone = phone ?? emp.phone;
  addLog({ organisation_id: req.user.orgId, user_id: req.user.userId, action: 'employee_updated', meta: { employeeId: emp.id }});
  res.json(emp);
});

app.delete('/api/employees/:id', authMiddleware, (req,res) => {
  const idx = db.employees.findIndex(e => e.id === req.params.id && e.organisation_id === req.user.orgId);
  if(idx === -1) return res.status(404).json({ message:'not found' });
  const [removed] = db.employees.splice(idx,1);
  // remove assignments
  db.employee_teams = db.employee_teams.filter(et => et.employee_id !== removed.id);
  addLog({ organisation_id: req.user.orgId, user_id: req.user.userId, action: 'employee_deleted', meta: { employeeId: removed.id }});
  res.json({ message: 'deleted' });
});

// --- Teams CRUD ---
app.get('/api/teams', authMiddleware, (req,res) => {
  const rows = db.teams.filter(t => t.organisation_id === req.user.orgId);
  // include counts
  const result = rows.map(t => {
    const count = db.employee_teams.filter(et => et.team_id === t.id).length;
    return { ...t, member_count: count };
  });
  res.json(result);
});

app.post('/api/teams', authMiddleware, (req,res) => {
  const { name, description } = req.body;
  const team = { id: uuidv4(), organisation_id: req.user.orgId, name, description, created_at: new Date().toISOString() };
  db.teams.push(team);
  addLog({ organisation_id: req.user.orgId, user_id: req.user.userId, action: 'team_created', meta: { teamId: team.id }});
  res.status(201).json(team);
});

app.put('/api/teams/:id', authMiddleware, (req,res) => {
  const team = db.teams.find(t => t.id === req.params.id && t.organisation_id === req.user.orgId);
  if(!team) return res.status(404).json({ message:'not found' });
  team.name = req.body.name ?? team.name;
  team.description = req.body.description ?? team.description;
  addLog({ organisation_id: req.user.orgId, user_id: req.user.userId, action: 'team_updated', meta: { teamId: team.id }});
  res.json(team);
});

app.delete('/api/teams/:id', authMiddleware, (req,res) => {
  const idx = db.teams.findIndex(t => t.id === req.params.id && t.organisation_id === req.user.orgId);
  if(idx === -1) return res.status(404).json({ message:'not found' });
  const [removed] = db.teams.splice(idx,1);
  db.employee_teams = db.employee_teams.filter(et => et.team_id !== removed.id);
  addLog({ organisation_id: req.user.orgId, user_id: req.user.userId, action: 'team_deleted', meta: { teamId: removed.id }});
  res.json({ message: 'deleted' });
});

// --- Assign / Unassign ---
app.post('/api/teams/:teamId/assign', authMiddleware, (req,res) => {
  const { employeeId } = req.body;
  const team = db.teams.find(t => t.id === req.params.teamId && t.organisation_id === req.user.orgId);
  const emp = db.employees.find(e => e.id === employeeId && e.organisation_id === req.user.orgId);
  if(!team || !emp) return res.status(404).json({ message:'team or employee not found' });
  // avoid duplicate
  if(!db.employee_teams.find(et => et.team_id === team.id && et.employee_id === emp.id)){
    db.employee_teams.push({ id: uuidv4(), team_id: team.id, employee_id: emp.id, assigned_at: new Date().toISOString() });
    addLog({ organisation_id: req.user.orgId, user_id: req.user.userId, action: 'employee_assigned', meta: { employeeId: emp.id, teamId: team.id }});
  }
  res.json({ message: 'assigned' });
});

app.post('/api/teams/:teamId/unassign', authMiddleware, (req,res) => {
  const { employeeId } = req.body;
  const before = db.employee_teams.length;
  db.employee_teams = db.employee_teams.filter(et => !(et.team_id === req.params.teamId && et.employee_id === employeeId));
  addLog({ organisation_id: req.user.orgId, user_id: req.user.userId, action: 'employee_unassigned', meta: { employeeId, teamId: req.params.teamId }});
  res.json({ message: 'unassigned' });
});

// Logs endpoint (admin)
app.get('/api/logs', authMiddleware, (req,res) => {
  try {
    const arr = JSON.parse(fs.readFileSync(LOGFILE));
    // filter by organisation
    const filtered = arr.filter(l => l.organisation_id === req.user.orgId);
    res.json(filtered);
  } catch(e){
    res.json([]);
  }
});

// seeded sample data endpoint (for convenience)
app.post('/api/_seed', (req,res) => {
  // only seed if empty
  if(db.organisations.length > 0) return res.status(400).json({ message:'already seeded' });
  const orgId = uuidv4();
  db.organisations.push({ id: orgId, name: 'Acme Tutoring' });
  const adminPass = 'Password123';
  bcrypt.hash(adminPass,10).then(hash => {
    const user = { id: uuidv4(), organisation_id: orgId, name: 'Priya', email: 'admin@acme.test', password_hash: hash };
    db.users.push(user);
    // sample employees
    const e1 = { id: uuidv4(), organisation_id: orgId, first_name: 'Amit', last_name:'K', email:'amit@acme.test', phone:'9999999991', created_at: new Date().toISOString() };
    const e2 = { id: uuidv4(), organisation_id: orgId, first_name: 'Sara', last_name:'L', email:'sara@acme.test', phone:'9999999992', created_at: new Date().toISOString() };
    db.employees.push(e1,e2);
    const t1 = { id: uuidv4(), organisation_id: orgId, name: 'Math Tutors', description:'Handles math classes', created_at: new Date().toISOString() };
    const t2 = { id: uuidv4(), organisation_id: orgId, name: 'Science Tutors', description:'Handles science classes', created_at: new Date().toISOString() };
    db.teams.push(t1,t2);
    db.employee_teams.push({ id: uuidv4(), team_id: t1.id, employee_id: e1.id, assigned_at: new Date().toISOString() });
    addLog({ organisation_id: orgId, user_id: user.id, action: 'seed_created', meta: {}});
    res.json({ message: 'seeded', email: user.email, password: adminPass });
  });
});

app.listen(PORT, ()=> console.log('Backend running on', PORT));
