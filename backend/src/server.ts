import app from "./app";

const port = process.env.PORT ? Number(process.env.PORT) : 5000;

const startServer = () => {
  const server = app.listen(port, () => {
    console.log(`✓ Backend server listening on port ${port}`);
    console.log(`✓ Health check: http://localhost:${port}/api/health`);
    console.log(`✓ API endpoints available at http://localhost:${port}/api`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`✗ Port ${port} is already in use. Please:`);
      console.error(`  1. Stop the other process using port ${port}`);
      console.error(`  2. Or set a different PORT in your .env file`);
      console.error(`  3. Or kill the process: taskkill /PID <pid> /F`);
      process.exit(1);
    } else {
      throw err;
    }
  });
};

startServer();
