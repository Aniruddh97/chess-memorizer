let boardConfig = {
    draggable: true,
    position: "start",
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    orientation: "white",
};

let board = ChessBoard("board", boardConfig);

MicroModal.init();

let game = new Chess();
let studyGame = new Chess();
let pgnMoves = [];
let currentMoveIndex = 0;
let userSide = "white"; // Default to white
let gameStarted = false;

let openingsData = {};

fetch("http://127.0.0.1:3000/api/folder-structure")
    .then((response) => response.json())
    .then((data) => (openingsData = data))
    .then(() => setup())
    .catch((error) => console.error("Error fetching folder structure:", error));

function setup() {
    if (Object.keys(openingsData).length == 0) {
        showModal(`no openings available : ${openingsData}`);
        return;
    }

    populateOpenings();
}

function startRevision() {
    let selectedOpening = document.getElementById("opening").value;
    let selectedLine = document.getElementById("opening-line").value;

    const pgn = openingsData[selectedOpening][selectedLine];
    if (!pgn) {
        showModal(
            `line '${selectedLine}' of opening '${selectedOpening}' doesn't exist`
        );
        return;
    }

    studyGame.load_pgn(pgn);

    pgnMoves = studyGame.history();
    userSide = getPlayerSide();

    const headers = studyGame.header();
    if ("PlayerIndex" in headers) {
        currentMoveIndex = parseInt(headers["PlayerIndex"], 10);
        userSide = currentMoveIndex == 1 ? "black" : "white";
    }

    boardConfig["orientation"] = userSide;

    gameStarted = true;

    board = ChessBoard("board", boardConfig);
    board.start();

    if (userSide == "black") {
        game.move(pgnMoves[0]);
        board.position(game.fen(), false);
        currentMoveIndex = 1;
    }

    updateStatus();
}

function getPlayerSide() {
    const sides = document.getElementsByName("side");

    for (var i = 0; i < sides.length; i++) {
        if (sides[i].checked) {
            return sides[i].value;
        }
    }
}

function onDragStart(source, piece, position, orientation) {
    if (
        !gameStarted ||
        (userSide === "white" && piece.search(/^b/) !== -1) ||
        (userSide === "black" && piece.search(/^w/) !== -1)
    ) {
        return false; // Prevent dragging opponent's pieces
    }
}

function onDrop(source, target) {
    const move = game.move({
        from: source,
        to: target,
        promotion: "q", // Promote to queen for simplicity
    });

    // Illegal move
    if (move === null) return "snapback";

    // Update the board position and check for automatic moves
    board.position(game.fen(), false);
    updateStatus();
    playOpponentMove();
}

function playOpponentMove() {
    // If it's the user's turn
    if (!game.game_over() && gameStarted) {
        if (currentMoveIndex < pgnMoves.length) {
            const correctMove = pgnMoves[currentMoveIndex];
            const userMove = game.history()[game.history().length - 1]; // Last move made by the user

            if (userMove === correctMove) {
                currentMoveIndex++;
                if (currentMoveIndex < pgnMoves.length) {
                    game.move(pgnMoves[currentMoveIndex]);
                    board.position(game.fen(), false);
                    updateStatus();
                }
                currentMoveIndex++;
            } else {
                // Show the correct move
                showModal(`The best move is: ${correctMove}`);

                // Reset the board to the last valid position
                game.undo();
                board.position(game.fen(), false);
            }
        } else {
            showModal("line completed!");
        }
    }

    if (currentMoveIndex >= pgnMoves.length) {
        showModal("line completed!");
    }
}

function onSnapEnd() {
    board.position(game.fen(), false);
    updateStatus();
}

function updateStatus() {
    const status = document.getElementById("status");
    const gameStatus = game.game_over()
        ? "Game over"
        : `Current turn: ${userSide}`;
    status.innerHTML = gameStatus;

    // Update FEN and PGN displays
    document.getElementById("fen").innerText = game.fen();
    document.getElementById("pgn").innerText = game.pgn();
}

function showModal(message) {
    document.getElementById("modal-error-message").textContent = message;
    MicroModal.show("modal-1");
}

// Handle copy to clipboard for FEN and PGN
document.querySelectorAll(".copyable").forEach((item) => {
    item.addEventListener("click", () => {
        navigator.clipboard.writeText(item.innerText).then(() => {
            alert(`${item.innerText} copied to clipboard!`);
        });
    });
});

document.getElementById("revise").addEventListener("click", startRevision);

/**
 * OPENINGS & LINES
 */

document.getElementById("opening").addEventListener("change", (e) => {
    const selectedOpening = e.target.value;
    populatePgnLines(selectedOpening);
});

function populateOpenings() {
    const openingSelect = document.getElementById("opening");

    openingSelect.innerHTML = "";

    Object.keys(openingsData).forEach((opening) => {
        const option = document.createElement("option");
        option.value = opening;
        option.textContent = opening;
        openingSelect.appendChild(option);
    });

    populatePgnLines(openingSelect.value);
}

function populatePgnLines(opening) {
    const pgnSelect = document.getElementById("opening-line");

    const lines = openingsData[opening];

    pgnSelect.innerHTML = "";

    Object.keys(lines).forEach((line) => {
        const option = document.createElement("option");
        option.value = line;
        option.textContent = line;
        pgnSelect.appendChild(option);
    });
}
