require('dotenv').config();

// ── Env validation ─────────────────────────────────────────────
['MONGO_URI', 'JWT_SECRET'].forEach((k) => {
  if (!process.env[k]?.trim()) throw new Error(`Missing env var: ${k}`);
});

const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');

// ── Models ─────────────────────────────────────────────────────
const User    = require('./models/User');
const Project = require('./models/Project');
const Task    = require('./models/Task');

// ── Helpers ────────────────────────────────────────────────────
const trim      = (v)  => (typeof v === 'string' ? v.trim() : '');
const normEmail = (e)  => trim(e).toLowerCase();
const notEmpty  = (s)  => trim(s).length > 0;
const paginate  = (q)  => {
  const page  = Math.max(1, parseInt(q.page,  10) || 1);
  const limit = Math.max(1, parseInt(q.limit, 10) || 10);
  return { page, limit, skip: (page - 1) * limit };
};
const genToken      = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const isValidObjId  = (id) => mongoose.Types.ObjectId.isValid(id);

// ── Middleware ─────────────────────────────────────────────────
const protect = async (req, res, next) => {
  const raw = req.headers.authorization;
  if (!raw?.trim().toLowerCase().startsWith('bearer'))
    return res.status(401).json({ message: 'Not authorized: no Bearer token' });

  const token = raw.trim().split(/\s+/).slice(1).join(' ').trim();
  if (!token) return res.status(401).json({ message: 'Not authorized: empty token' });

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    if (!id) return res.status(401).json({ message: 'Not authorized: invalid payload' });
    req.user = await User.findById(id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'Not authorized: user not found' });
    next();
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'token expired' : 'invalid token';
    res.status(401).json({ message: `Not authorized: ${msg}` });
  }
};

const adminOnly = (req, res, next) =>
  req.user?.role === 'Admin'
    ? next()
    : res.status(403).json({ message: 'Access denied: Admins only' });

// ── Auth handlers ──────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    let { name, email, password, role } = req.body;
    name = trim(name); email = normEmail(email); password = trim(password);
    if (!notEmpty(name) || !notEmpty(email) || !notEmpty(password))
      return res.status(400).json({ message: 'All fields are required' });
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ name, email, password, role: trim(String(role || '')) || 'Member' });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: genToken(user._id) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const login = async (req, res) => {
  try {
    const email = normEmail(req.body.email), password = trim(req.body.password);
    if (!notEmpty(email) || !notEmpty(password))
      return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: genToken(user._id) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getMe = (req, res) =>
  res.json({ _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role });

// ── Project handlers ───────────────────────────────────────────
const createProject = async (req, res) => {
  try {
    let { name, description, members = [] } = req.body;
    name = trim(name); description = trim(description);
    if (!notEmpty(name) || !notEmpty(description))
      return res.status(400).json({ message: 'Name and description are required' });
    if (members.length) {
      const invalidIds = members.filter((id) => !isValidObjId(id));
      if (invalidIds.length)
        return res.status(400).json({ message: `Invalid member ID format: ${invalidIds.join(', ')}` });
      const valid = await User.find({ _id: { $in: members } });
      if (valid.length !== members.length)
        return res.status(400).json({ message: 'One or more member IDs were not found' });
    }
    const project = await Project.create({ name, description, createdBy: req.user._id, members });
    res.status(201).json(await project.populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'members',   select: 'name email role' },
    ]));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getProjects = async (req, res) => {
  try {
    const { skip, limit, page } = paginate(req.query);
    const filter = req.user.role === 'Admin' ? {} : { members: req.user._id };
    const total  = await Project.countDocuments(filter);
    const data   = await Project.find(filter)
      .populate('createdBy', 'name email role').populate('members', 'name email role')
      .sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const updateProject = async (req, res) => {
  try {
    if (!isValidObjId(req.params.id))
      return res.status(400).json({ message: 'Invalid project ID format' });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    let { name, description, members } = req.body;
    if (name !== undefined)        { name = trim(name); if (!notEmpty(name)) return res.status(400).json({ message: 'Name cannot be empty' }); project.name = name; }
    if (description !== undefined) { description = trim(description); if (!notEmpty(description)) return res.status(400).json({ message: 'Description cannot be empty' }); project.description = description; }
    if (members !== undefined) {
      const list = Array.isArray(members) ? members : [];
      if (list.length) {
        const invalidIds = list.filter((id) => !isValidObjId(id));
        if (invalidIds.length)
          return res.status(400).json({ message: `Invalid member ID format: ${invalidIds.join(', ')}` });
        const v = await User.find({ _id: { $in: list } });
        if (v.length !== list.length)
          return res.status(400).json({ message: 'One or more member IDs were not found' });
      }
      project.members = list;
    }
    const updated = await project.save();
    res.json(await updated.populate([{ path: 'createdBy', select: 'name email role' }, { path: 'members', select: 'name email role' }]));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── Task handlers ──────────────────────────────────────────────
const STATUSES = ['Todo', 'In Progress', 'Done'];
const canAccess    = (p, uid) => p.createdBy?.toString() === uid.toString() || (p.members || []).some(m => m.toString() === uid.toString());
const isMember     = (p, uid) => (p.members || []).some(m => m.toString() === uid.toString());
const populateTask = (t)      => t.populate([{ path: 'projectId', select: 'name' }, { path: 'assignedTo', select: 'name email' }, { path: 'createdBy', select: 'name email' }]);

const createTask = async (req, res) => {
  try {
    let { title, description, projectId, assignedTo, status, dueDate } = req.body;
    title = trim(title); description = trim(description); projectId = trim(projectId);
    if (!notEmpty(title) || !notEmpty(description) || !notEmpty(projectId) || !trim(String(dueDate || '')))
      return res.status(400).json({ message: 'Title, description, project, and due date are required' });
    const s = trim(String(status || 'Todo'));
    if (!STATUSES.includes(s)) return res.status(400).json({ message: 'Invalid status' });
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canAccess(project, req.user._id)) return res.status(403).json({ message: 'Forbidden: not a project member' });
    if (assignedTo && !isMember(project, assignedTo)) return res.status(400).json({ message: 'Assigned user must be a project member' });
    const task = await Task.create({ title, description, projectId, assignedTo: assignedTo || null, status: s, dueDate, createdBy: req.user._id });
    res.status(201).json(await populateTask(task));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getTasks = async (req, res) => {
  try {
    const { skip, limit, page } = paginate(req.query);
    const filter = {};
    const pid = trim(String(req.query.projectId || ''));
    if (pid) filter.projectId = pid;
    if (req.user.role !== 'Admin') filter.assignedTo = req.user._id;
    const total = await Task.countDocuments(filter);
    const data  = await Task.find(filter)
      .populate('projectId', 'name').populate('assignedTo', 'name email role').populate('createdBy', 'name email')
      .sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (req.user.role === 'Member') {
      if (task.assignedTo?.toString() !== req.user._id.toString())
        return res.status(403).json({ message: 'You can only update tasks assigned to you' });
      const s = trim(req.body.status || '');
      if (!STATUSES.includes(s)) return res.status(400).json({ message: 'Invalid status' });
      task.status = s;
    } else {
      let { title, description, projectId, assignedTo, status, dueDate } = req.body;
      const pid = projectId ? trim(String(projectId)) : task.projectId;
      const proj = await Project.findById(pid);
      if (!proj) return res.status(404).json({ message: 'Project not found' });
      const eff = assignedTo !== undefined ? assignedTo || null : task.assignedTo;
      if (eff && !isMember(proj, eff)) return res.status(400).json({ message: 'Assigned user must be a project member' });
      if (title !== undefined)       { const t = trim(title);       if (!notEmpty(t)) return res.status(400).json({ message: 'Title cannot be empty' });       task.title = t; }
      if (description !== undefined) { const d = trim(description); if (!notEmpty(d)) return res.status(400).json({ message: 'Description cannot be empty' }); task.description = d; }
      if (projectId !== undefined)   task.projectId  = pid;
      if (assignedTo !== undefined)  task.assignedTo = assignedTo || null;
      if (status !== undefined)      { const s = trim(String(status)); if (!STATUSES.includes(s)) return res.status(400).json({ message: 'Invalid status' }); task.status = s; }
      if (dueDate !== undefined)     task.dueDate    = dueDate;
    }
    res.json(await populateTask(await task.save()));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getDashboardStats = async (req, res) => {
  try {
    const filter = req.user.role === 'Member' ? { assignedTo: req.user._id } : {};
    const now = new Date();
    const [total, completed, pending, overdue] = await Promise.all([
      Task.countDocuments(filter),
      Task.countDocuments({ ...filter, status: 'Done' }),
      Task.countDocuments({ ...filter, status: { $in: ['Todo', 'In Progress'] } }),
      Task.countDocuments({ ...filter, status: { $ne: 'Done' }, dueDate: { $lt: now } }),
    ]);
    res.json({ total, completed, pending, overdue });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── Express app ────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth routes
app.post('/api/auth/signup', signup);
app.post('/api/auth/login',  login);
app.get( '/api/auth/me',     protect, getMe);

// Project routes
app.post(  '/api/projects',     protect, adminOnly, createProject);
app.get(   '/api/projects',     protect,            getProjects);
app.put(   '/api/projects/:id', protect, adminOnly, updateProject);
app.delete('/api/projects/:id', protect, adminOnly, deleteProject);

// Task routes
app.get(   '/api/tasks/dashboard', protect,            getDashboardStats);
app.post(  '/api/tasks',           protect, adminOnly, createTask);
app.get(   '/api/tasks',           protect,            getTasks);
app.put(   '/api/tasks/:id',       protect,            updateTask);
app.delete('/api/tasks/:id',       protect, adminOnly, deleteTask);

// Health check
app.get('/health', (_, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// ── Serve React frontend ───────────────────────────────────────
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// React catch-all: any non-API route returns index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API 404 & error handlers (only reached by /api routes that didn't match)
app.use((_, res)        => res.status(404).json({ message: 'Route not found' }));
app.use((e, _, res, _2) => res.status(e.status || 500).json({ message: e.message || 'Internal Server Error' }));

// ── Auto-seed default admins ───────────────────────────────────
const seedAdmins = async () => {
  const defaults = [
    { name: 'Admin',   email: 'admin@test.com',  password: '123456',     role: 'Admin' },
    { name: 'Admin 2', email: 'admin2@test.com', password: 'admin@1234', role: 'Admin' },
  ];
  for (const data of defaults) {
    const exists = await User.findOne({ email: data.email });
    if (!exists) {
      await User.create(data); // password auto-hashed by pre-save hook
      console.log(`[seed] Admin created: ${data.email}`);
    }
  }
};

// ── Start ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    await seedAdmins();
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`));
  })
  .catch((e) => { console.error('DB connection failed:', e.message); process.exit(1); });

module.exports = app;
