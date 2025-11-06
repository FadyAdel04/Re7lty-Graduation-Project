import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import tripsRouter from "./routes/trips";
import profilesRouter from "./routes/profiles";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend', timestamp: new Date().toISOString() });
});

app.use('/api/trips', tripsRouter);
app.use('/api/profiles', profilesRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});


