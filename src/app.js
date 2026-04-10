const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api", (req, res) => {
    res.json({
        message: "API MySQL operativa",
        docs: {
            register: "POST /api/auth/register",
            login: "POST /api/auth/login",
            profile: "GET /api/auth/profile",
            users: "GET /api/users"
        }
    });
});

app.use("/api/auth", require("./routes/auth.routes"));

app.use("/api/users", require("./routes/users.routes"));

module.exports = app;
