const express = require('express');
const dotenv = require('dotenv');
const schoolRoutes = require('./routes/addSchool');
const listRoute = require('./routes/listSchools ')

dotenv.config();
const app = express();
app.use(express.json());

app.use('/', schoolRoutes);
app.use('/', listRoute);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
