let OpeningData = {};

let activeOpening = "";
let activeOpeningLine = "";

document.addEventListener("DOMContentLoaded", () => {
    const updatePgnButton = document.getElementById("update-pgn");
    const directoryStructure = document.getElementById("directory-structure");
    const pgnContentTextarea = document.getElementById("pgn-content");

    const chessboard = ChessBoard("board", {
        draggable: true,
        position: "start",
    });

    // Fetch the folder structure from the server
    function loadFolderStructure() {
        fetch("http://127.0.0.1:3000/api/folder-structure")
            .then((response) => response.json())
            .then(renderDirectory)
            .catch((error) =>
                console.error("Error fetching folder structure:", error)
            );
    }

    // Render the directory structure
    function renderDirectory(folderStructure) {
        OpeningData = folderStructure;

        directoryStructure.innerHTML = ""; // Clear existing structure

        Object.entries(folderStructure).forEach(([folder, pgns]) => {
            const folderDiv = createFolderDiv(folder, pgns);
            directoryStructure.appendChild(folderDiv);
        });
    }

    // Create folder div with PGNs
    function createFolderDiv(folder, pgns) {
        const folderDiv = document.createElement("div");
        folderDiv.textContent = folder;

        const pgnList = document.createElement("div");
        pgnList.classList.add("pgn-list");

        Object.keys(pgns).forEach((pgnFile) => {
            const pgnDiv = document.createElement("div");
            pgnDiv.textContent = pgnFile;
            pgnDiv.addEventListener("click", () => loadPgn(folder, pgnFile));
            pgnList.appendChild(pgnDiv);
        });

        folderDiv.appendChild(pgnList);
        return folderDiv;
    }

    // Load PGN into the chessboard
    function loadPgn(folder, pgnFile) {
        activeOpening = folder;
        activeOpeningLine = pgnFile;

        loadFolderStructure();

        const game = new Chess();
        if (game.load_pgn(OpeningData[folder][pgnFile])) {
            chessboard.position(game.fen());
            pgnContentTextarea.value = OpeningData[folder][pgnFile];
        } else {
            alert("Invalid PGN in file.");
        }
    }

    // Handle button clicks
    document.getElementById("create-folder").addEventListener("click", () => {
        const folderName = prompt("Enter folder name:");
        if (folderName) {
            fetch("http://127.0.0.1:3000/api/folder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderName }),
            })
                .then(() => loadFolderStructure())
                .catch((error) =>
                    console.error("Error creating folder:", error)
                );
        }
    });

    document.getElementById("add-pgn").addEventListener("click", () => {
        const pgnFileName = prompt("Enter PGN file name:");
        const selectedFolder = prompt("Enter folder to add PGN:");
        const pgnContent = pgnContentTextarea.value;

        if (pgnFileName && selectedFolder && pgnContent) {
            fetch(`http://127.0.0.1:3000/api/folder/${selectedFolder}/pgn`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pgnFileName, pgnContent }),
            })
                .then(() => loadFolderStructure())
                .catch((error) => console.error("Error adding PGN:", error));
        }
    });

    function updatePgn() {
        if (
            !OpeningData[activeOpening] ||
            !OpeningData[activeOpening][activeOpeningLine]
        ) {
            alert(`first select an opening & line!`);
            return;
        }

        const pgnContent = pgnContentTextarea.value;

        fetch(
            `http://127.0.0.1:3000/api/folder/${activeOpening}/pgn/${activeOpeningLine}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPgn: pgnContent }),
            }
        )
            .then(() => loadFolderStructure())
            .catch((error) => console.error("Error updating PGN:", error));
    }

    updatePgnButton.addEventListener("click", () => {
        updatePgn();

        loadPgn(activeOpening, activeOpeningLine); // Load the current PGN
    });

    loadFolderStructure(); // Load the folder structure on page load
});
