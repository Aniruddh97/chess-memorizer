const express = require("express");
const path = require("path");
const { getLatestRepertoireFromRedis, api } = require("./server/api");
const { stockfish } = require("./server/stockfish");
const cors = require("cors");
const { initRedis, redisGet } = require("./server/redis");
const { pullAndStudyChessDotComGames } = require("./server/chesscom");

initRedis();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets (CSS, JS, images) from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

app.get("/:file", (req, res) => {
    let { file } = req.params;
    if (file === "") file = "index";

    res.sendFile(path.join(__dirname, "public", `${file}.html`));
});

app.use("/api", api);
app.use("/stockfish", stockfish);

setInterval(pullAndStudyChessDotComGames, 300 * 1000);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    getLatestRepertoireFromRedis();
});
