/* Module */
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

/* ============ */
const PORT = process.env.PORT || 3000;
const general = require("./src/routes/general.routes");
const app = express();

/* app */
app.use(cors());
app.use(helmet());
app.use("/api", general);
app.use(express.static("./public"));

/* Status */
app.use("/api", async (req, res) => {
    res.send({
        status: true,
        message: "IDLIX Scrapper",
        repo: "annurdien",
    });
});

app.use("*", async (req, res) => {
    res.status(404).send({ status: false, message: "api not found" });
});

/* Listener */
app.listen(PORT, async () => {
    console.log("Listening on PORT " + PORT);
});
