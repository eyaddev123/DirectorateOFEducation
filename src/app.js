const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./routes');
const errorHandler = require('./middleware/errorMiddleware');
const { setupSwagger } = require('./swagger');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

setupSwagger(app);

app.use('/api', routes);

app.use(errorHandler);
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const typeProcessRoutes = require('./routes/typeProcess');
app.use('/api/typeProcess', typeProcessRoutes);
const stageConfigRoutes = require('./routes/stageConfig');
app.use('/api/stage_config', stageConfigRoutes);
const process_definitionsRoutes = require('./routes/processDefinition');
app.use('/api/process_definitions', process_definitionsRoutes);
const process_instancesRoutes = require('./routes/processInstance');
app.use('/api/process-instances', process_instancesRoutes);
const documentTemplateRoutes = require('./routes/DocTem')
app.use( '/api/document-templates',documentTemplateRoutes)
const fieldRoutes = require('./routes/field')
app.use( '/api/fields',fieldRoutes)
const fileRoutes = require('./routes/file')
app.use( '/api/files',fileRoutes)
const organizationRoutes = require('./routes/organization');
app.use('/api/organization', organizationRoutes);
const departmentRoutes = require('./routes/department');
app.use('/api/department', departmentRoutes);
const roleRoutes = require('./routes/role');
app.use('/api/role', roleRoutes);
module.exports = app;