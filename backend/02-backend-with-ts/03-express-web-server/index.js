const express = require("express");
const app = express();

app.use(express.json());

app.get("/menu", (req, res) => {
  res.json({ items: ["thali", "laddu"] });
});

app.post("order", (req, res) => {
  res.status(200).json({
    status: "received",
    order: req.body,
  });
});
