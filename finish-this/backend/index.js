const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3001;

app.use(cors());

app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
