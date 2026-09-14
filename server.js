require('dotenv').config();

const express = require('express');
const path = require('path');

const waitlist = require('./api/waitlist');
const adminSignup = require('./api/admin/signup');
const adminLogin = require('./api/admin/login');
const adminLogout = require('./api/admin/logout');
const adminMe = require('./api/admin/me');
const adminWaitlist = require('./api/admin/waitlist');

const app = express();
const root = __dirname;

app.set('query parser', 'simple');
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));

app.all('/api/waitlist', waitlist);
app.all('/api/admin/signup', adminSignup);
app.all('/api/admin/login', adminLogin);
app.all('/api/admin/logout', adminLogout);
app.all('/api/admin/me', adminMe);
app.all('/api/admin/waitlist', adminWaitlist);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
app.use('/lib', (_req, res) => res.status(404).end());

app.get('/admin', (_req, res) => res.sendFile(path.join(root, 'admin', 'index.html')));
app.get('/admin/login', (_req, res) => res.sendFile(path.join(root, 'admin', 'login.html')));
app.get('/admin/signup', (_req, res) => res.sendFile(path.join(root, 'admin', 'signup.html')));

// Match Vercel: homepage serves startups; clean URLs map /page → page.html
app.get('/', (_req, res) => res.sendFile(path.join(root, 'startups.html')));
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (!page || page.includes('.') || page.includes('/') || page === 'api' || page === 'admin' || page === 'lib') {
    return next();
  }
  const file = path.join(root, `${page}.html`);
  res.sendFile(file, (err) => {
    if (err) next();
  });
});

app.use(['/server.js', '/package.json', '/package-lock.json', '/.env'], (_req, res) => {
  res.status(404).end();
});

app.use(express.static(root));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`WeFundCo running at http://localhost:${port}`);
  console.log(`Admin: http://localhost:${port}/admin`);
});
