const fs = require("fs");
const path = require("path");
const { Chess } = require("chess.js");
const ECO_MAP = require("./eco-mapping.json");

const express = require("express");
const { getBestLine } = require("./stockfish");
const { redisSet, redisGet } = require("./redis");
const router = express.Router();

const folderStructureFilePath = path.join(__dirname, "repertoire.json");

async function getLatestRepertoireFromRedis() {
    const json = await redisGet("repertoire");
    if (json) {
        saveFolderStructure(JSON.parse(json) || {});
    }
}

// Helper function to read the folder structure from file
function getFolderStructure() {
    const data = fs.readFileSync(folderStructureFilePath, "utf-8");
    return JSON.parse(data) || {};
}

// Helper function to write the folder structure to file
function saveFolderStructure(json) {
    fs.writeFileSync(
        folderStructureFilePath,
        JSON.stringify(json, null, 2),
        "utf-8"
    );
    redisSet("repertoire", JSON.stringify(json));
}

// Endpoint to get the folder structure
router.get("/folder-structure", (req, res) => {
    const folderStructure = getFolderStructure();
    res.json(folderStructure);
});

router.put("/folder-structure", async (req, res) => {
    const { json } = req.body;

    if (!json) {
        return res.status(400).json({ message: "no json provided to update" });
    }

    saveFolderStructure(json);

    res.status(201).json({
        message: `updated!`,
    });
});

// Endpoint to add a folder
router.post("/folder", (req, res) => {
    const { folderName } = req.body;
    if (!folderName) {
        return res.status(400).json({ message: "Folder name is required" });
    }

    const folderStructure = getFolderStructure();
    if (folderStructure[folderName]) {
        return res.status(400).json({ message: "Folder already exists" });
    }

    folderStructure[folderName] = {};
    saveFolderStructure(folderStructure);
    res.status(201).json({
        message: `Folder "${folderName}" created successfully`,
    });
});

// Endpoint to add a PGN file to a folder
router.post("/folder/:folderName/pgn", async (req, res) => {
    const { folderName } = req.params;
    const { pgnFileName, pgnContent } = req.body;

    if (!pgnFileName || !pgnContent) {
        return res
            .status(400)
            .json({ message: "PGN file name and content are required" });
    }

    const folderStructure = getFolderStructure();
    if (!folderStructure[folderName]) {
        return res.status(404).json({ message: "Folder not found" });
    }

    getBestLine(pgnContent, 24)
        .then((data) => {
            folderStructure[folderName][pgnFileName] = data["bestLine"];
            saveFolderStructure(folderStructure);
        })
        .catch(() => {
            folderStructure[folderName][pgnFileName] = "1. h3 h5";
            saveFolderStructure(folderStructure);
        });

    res.status(201).json({
        message: `PGN "${pgnFileName}" added to folder "${folderName}"`,
    });
});

// Endpoint to update PGN
router.put("/folder/:folderName/pgn/:pgnFileName", (req, res) => {
    const { folderName, pgnFileName } = req.params;
    const { newPgn } = req.body;

    const folderStructure = getFolderStructure();
    if (
        !folderStructure[folderName] ||
        !folderStructure[folderName][pgnFileName]
    ) {
        return res.status(404).json({ message: "Folder or PGN not found" });
    }

    getBestLine(newPgn, 24)
        .then((data) => {
            folderStructure[folderName][pgnFileName] = data["bestLine"];
            saveFolderStructure(folderStructure);
        })
        .catch(() => {
            folderStructure[folderName][pgnFileName] = "1. h3 h5";
            saveFolderStructure(folderStructure);
        });

    res.status(200).json({
        message: `PGN "${pgnFileName}" updated`,
    });
});

// Endpoint to move a PGN file to another folder
router.put("/folder/:folderName/pgn/:pgnFileName/move", (req, res) => {
    const { folderName, pgnFileName } = req.params;
    const { newFolderName } = req.body;

    const folderStructure = getFolderStructure();
    if (
        !folderStructure[folderName] ||
        !folderStructure[folderName][pgnFileName]
    ) {
        return res.status(404).json({ message: "Folder or PGN not found" });
    }

    if (!folderStructure[newFolderName]) {
        return res
            .status(404)
            .json({ message: "Destination folder not found" });
    }

    const pgnContent = folderStructure[folderName][pgnFileName];
    delete folderStructure[folderName][pgnFileName];
    folderStructure[newFolderName][pgnFileName] = pgnContent;

    saveFolderStructure(folderStructure);
    res.status(200).json({
        message: `PGN "${pgnFileName}" moved to folder "${newFolderName}"`,
    });
});

router.post("/pgn/upload", async (req, res) => {
    const { pgn } = req.body;

    if (!pgn) {
        return res.status(400).json({ message: "PGN is required required" });
    }

    const game = new Chess();
    game.loadPgn(pgn);

    const eco = game.header()["ECO"];
    if (!eco) {
        return res.status(400).json({ message: "'ECO' annotation is missing" });
    }

    const opening = ECO_MAP[eco];
    const folderStructure = getFolderStructure();

    if (!opening) {
        return res
            .status(500)
            .json({ message: `no mapping available for ECO: ${eco}` });
    }

    getBestLine(pgn, 24)
        .then((data) => {
            game.loadPgn(data["bestLine"]);
            const line = game.history().join("");

            folderStructure[opening] = {
                ...folderStructure[opening],
                [line]: data["bestLine"],
            };
            saveFolderStructure(folderStructure);
        })
        .catch((e) => {
            console.error("failed to compute best line");
            console.error(e);
        });

    res.status(201).json({
        message: `PGN (${opening}) is being processed!`,
    });
});

module.exports = {
    api: router,
    getLatestRepertoireFromRedis,
};
