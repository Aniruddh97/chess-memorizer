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

function normalizeMove(move, game) {
    game.move(move);
    const history = game.history();
    game.undo();

    return history[history.length - 1];
}

async function getTop3Moves(fen, depth) {
    return getBestMoveViaEngine(fen, 24);
    // return getBestMoveViaAPI(fen, 15);
}

async function getTop3MoveViaEngine(fen, depth = 24) {
    const outputStream = [];

    function sendCommand(command) {
        return new Promise((resolve, reject) => {
            engine.send(command, resolve, (data) => outputStream.push(data));
        });
    }

    try {
        await sendCommand("uci");
        await sendCommand(`position fen ${fen}`);
        await sendCommand("setoption name MultiPV value 3");
        await sendCommand(`go depth ${depth}`);

        const top3Moves = outputStream
            .filter((line) => line.includes("multipv"))
            .slice(-3)
            .map((line) => line.split(/\spv\s/)[1].split(/\s/)[0]);

        console.log(top3Moves);
        return top3Moves;
    } catch (e) {
        throw new Error(`Engine error: ${e}`);
    }
}

async function getBestMoveViaEngine(fen, depth = 24) {
    const outputStream = [];

    function sendCommand(command) {
        return new Promise((resolve, reject) => {
            engine.send(command, resolve, (data) => outputStream.push(data));
        });
    }

    try {
        await sendCommand("uci");
        await sendCommand(`position fen ${fen}`);
        let topMove = await sendCommand(`go depth ${depth}`);

        topMove = topMove.split(/\s/)[1];

        console.log(topMove);
        return [topMove];
    } catch (e) {
        throw new Error(`Engine error: ${e}`);
    }
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
            if (idx % 2 == playerIndex) {
                let best3Moves = await getTop3Moves(bestLineGame.fen(), depth);

                best3Moves = best3Moves.map((move) =>
                    normalizeMove(move, bestLineGame)
                );

                if (!best3Moves.includes(move)) {
                    bestLineGame.move(best3Moves[0]);
                    break;
                }
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
router.post("/get-best-moves", async (req, res) => {
    const { fen, depth = 15 } = req.body;

    if (!fen) {
        return res.status(400).json({ error: "FEN is required" });
    }

    try {
        const top3Moves = await getTop3Moves(fen, depth);
        res.json({ top3Moves });
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
