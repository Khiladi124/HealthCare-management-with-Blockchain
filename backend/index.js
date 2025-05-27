import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './database/index.js';
import dotenv from 'dotenv';
import patientRouter from './routes/patientRoutes.js';
import doctorRouter from './routes/doctorRoutes.js';

dotenv.config({path: './.env'});

const app = express();
const PORT = process.env.PORT || 5000;

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors(
  {
    origin: '*',
    credentials: true,
  }
));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

app.get('/', (req, res) => {
  res.send('Welcome to the Healthcare API');
});

app.use('/api/patients', patientRouter);
app.use('/api/doctors', doctorRouter);
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
export default app;