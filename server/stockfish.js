const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Chess } = require("chess.js");
var loadEngine = require("./loadEngine.js");

const engine = loadEngine(
    require("path").join(
        __dirname,
        "..",
        "node_modules",
        "stockfish",
        "src",
        "stockfish-nnue-16.js"
    )
);

async function getBestMove(fen, depth) {
    return getBestMoveViaEngine(fen, 24);
    // return getBestMoveViaAPI(fen, 15);
}

async function getBestMoveViaEngine(fen, depth = 24) {
    return new Promise(async (resolve, reject) => {
        try {
            engine.send(
                `uci`,
                function onDone(data) {
                    engine.send(
                        `position fen ${fen}`,
                        function onDone(data) {
                            engine.send(
                                `go depth ${depth}`,
                                function onDone(data) {
                                    resolve(data);
                                },
                                function onStream(data) {}
                            );
                        },
                        function onStream(data) {}
                    );
                },
                function onStream(data) {}
            );
        } catch (e) {
            reject(e);
        }
    });
}

// Function to interact with Stockfish and get the best move
async function getBestMoveViaAPI(fen, depth = 15) {
    var config = {
        method: "get",
        url: `https://stockfish.online/api/s/v2.php?fen=${fen}&depth=${depth}`,
        headers: {
            authority: "stockfish.online",
            accept: "*/*",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "cache-control": "no-cache",
            pragma: "no-cache",
        },
    };

    try {
        const response = await axios(config);
        const data = response.data;

        if (data.success) {
            return data.bestmove.split(/\s/)[1];
        }

        throw Error(`unexpected stockfish response : ${JSON.stringify(data)}`);
    } catch (e) {
        throw e;
    }
}

async function getBestLine(pgn, depth = 24) {
    const actualGame = new Chess();
    actualGame.loadPgn(pgn);
    let playerIndex = 0;

    const headers = actualGame.header();
    if (!headers["White"] || !headers["Black"]) {
        return res.status(400).json({ error: "PGN isn't annotated" });
    }

    playerAlias.forEach((alias) => {
        if (alias.toLowerCase() === headers["Black"].toLowerCase()) {
            playerIndex = 1;
        }
    });

    const bestLineGame = new Chess();
    for (let header in headers) {
        bestLineGame.header(header, headers[header]);
    }
    bestLineGame.header("PlayerIndex", `${playerIndex}`);

    try {
        let idx = 0;
        for (let move of actualGame.history()) {
            if (!(idx <= 6) && idx % 2 == playerIndex) {
                const bestMove = await getBestMove(bestLineGame.fen(), depth);
                bestLineGame.move(bestMove);

                const history = bestLineGame.history();
                const lastMove = history[history.length - 1];
                if (move !== lastMove) {
                    break;
                }

                bestLineGame.undo();
            }

            bestLineGame.move(move);
            idx++;
        }

        return { bestLine: bestLineGame.pgn() };
    } catch (error) {
        return { error: error.toString() };
    }
}

// API to handle PGN input and return the best move
router.post("/get-best-move", async (req, res) => {
    const { fen, depth = 15 } = req.body;

    if (!fen) {
        return res.status(400).json({ error: "FEN is required" });
    }

    try {
        const bestMove = await getBestMove(fen, depth);
        res.json({ bestMove });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

const playerAlias = ["aniruddhpandya", "Jetpackinabackpack"];

router.post("/get-best-line", async (req, res) => {
    const { pgn, depth } = req.body;

    if (!pgn) {
        return res.status(400).json({ error: "PGN is required" });
    }

    const response = await getBestLine(pgn, depth);

    if ("error" in response) {
        res.status(500).json(response);
        return;
    }

    res.json(response);
});

module.exports = {
    stockfish: router,
    getBestLine,
};
