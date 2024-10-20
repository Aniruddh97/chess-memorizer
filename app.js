const express = require("express");
const path = require("path");
const api = require("./server/api");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets (CSS, JS, images) from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", api);

app.get("/:file", (req, res) => {
    let { file } = req.params;
    if (file === "") file = "index";

    res.sendFile(path.join(__dirname, "public", `${file}.html`));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
