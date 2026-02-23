const express = require('express');
const path = require('path');
const resourceRoutes = require('./routes/resources');

const app = express();
const port = process.env.PORT || 4173;

app.use(express.json({ limit: '1mb' }));
app.use('/api', resourceRoutes);
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Mission Control running at http://localhost:${port}`);
});
