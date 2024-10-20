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

document.getElementById("start-game").addEventListener("click", () => {
    const pgnInput = document.getElementById("pgn-input");
    const sideSelect = document.getElementById("side-selection");

    // Get PGN from the textarea
    const pgn = pgnInput.value.trim();
    if (pgn === "") {
        alert("Please paste a PGN.");
        return;
    }

    studyGame.load_pgn(pgn);
    pgnMoves = studyGame.history();
    userSide = sideSelect.value;

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
});

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
                document.getElementById(
                    "modal-error-message"
                ).textContent = `The best move is: ${correctMove}`;
                MicroModal.show("modal-1");

                // Reset the board to the last valid position
                game.undo();
                board.position(game.fen(), false);
            }
        } else {
            document.getElementById("modal-error-message").textContent =
                "line completed!";
            MicroModal.show("modal-1");
        }
    }

    if (currentMoveIndex >= pgnMoves.length) {
        document.getElementById("modal-error-message").textContent =
            "line completed!";
        MicroModal.show("modal-1");
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

// Handle copy to clipboard for FEN and PGN
document.querySelectorAll(".copyable").forEach((item) => {
    item.addEventListener("click", () => {
        navigator.clipboard.writeText(item.innerText).then(() => {
            alert(`${item.innerText} copied to clipboard!`);
        });
    });
});
