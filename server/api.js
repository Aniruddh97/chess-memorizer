const fs = require("fs");
const path = require("path");

const express = require("express");
const router = express.Router();

const folderStructureFilePath = path.join(__dirname, "repertoire.json");

// Helper function to read the folder structure from file
function getFolderStructure() {
    const data = fs.readFileSync(folderStructureFilePath, "utf-8");
    return JSON.parse(data);
}

// Helper function to write the folder structure to file
function saveFolderStructure(folderStructure) {
    fs.writeFileSync(
        folderStructureFilePath,
        JSON.stringify(folderStructure, null, 2),
        "utf-8"
    );
}

// Endpoint to get the folder structure
router.get("/folder-structure", (req, res) => {
    const folderStructure = getFolderStructure();
    res.json(folderStructure);
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
router.post("/folder/:folderName/pgn", (req, res) => {
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

    folderStructure[folderName][pgnFileName] = pgnContent;
    saveFolderStructure(folderStructure);
    res.status(201).json({
        message: `PGN "${pgnFileName}" added to folder "${folderName}"`,
    });
});

// Endpoint to rename a PGN file
router.put("/folder/:folderName/pgn/:pgnFileName", (req, res) => {
    const { folderName, pgnFileName } = req.params;
    const { newPgnFileName } = req.body;

    const folderStructure = getFolderStructure();
    if (
        !folderStructure[folderName] ||
        !folderStructure[folderName][pgnFileName]
    ) {
        return res.status(404).json({ message: "Folder or PGN not found" });
    }

    const pgnContent = folderStructure[folderName][pgnFileName];
    delete folderStructure[folderName][pgnFileName];
    folderStructure[folderName][newPgnFileName] = pgnContent;

    saveFolderStructure(folderStructure);
    res.status(200).json({
        message: `PGN "${pgnFileName}" renamed to "${newPgnFileName}"`,
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

module.exports = router;
