// Initialize the chess game
var game = new Chess();

// Initialize the chessboard
var board = Chessboard("board", {
    draggable: true,
    position: "start",
    onDrop: handleMove,
    onSnapEnd: updateBoardPosition,
});

// Update board position after move
function updateBoardPosition() {
    board.position(game.fen());
}

// Handle move
function handleMove(source, target) {
    var move = game.move({
        from: source,
        to: target,
        promotion: "q", // Always promote to a queen for simplicity
    });

    if (move === null) return "snapback"; // Illegal move

    updateStatus(); // Update status, FEN, PGN, and move list
}

// Update game status
function updateStatus() {
    var status = "";
    var moveListHtml = "";

    if (game.in_checkmate()) {
        status = "Game over, checkmate.";
    } else if (game.in_draw()) {
        status = "Game over, draw.";
    } else {
        var moveColor = game.turn() === "w" ? "White" : "Black";
        status = moveColor + " to move";

        if (game.in_check()) {
            status += ", in check!";
        }
    }

    document.getElementById("status").innerText = status;
    document.getElementById("fen").innerText = game.fen();
    document.getElementById("pgn").innerText = game.pgn();

    // Build move list
    var moveList = game.history();
    moveList.forEach(function (move, index) {
        moveListHtml += index + 1 + ". " + move + "<br>";
    });
    document.getElementById("move-list").innerHTML = moveListHtml;
}

// Clipboard functionality
function copyToClipboard(text) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}

// Event listeners for FEN and PGN copy
document.getElementById("fen").addEventListener("click", function () {
    copyToClipboard(game.fen());
});

document.getElementById("pgn").addEventListener("click", function () {
    copyToClipboard(game.pgn());
});

// Toggle sidebar visibility
document
    .getElementById("toggle-sidebar")
    .addEventListener("click", function () {
        var sidebar = document.getElementById("sidebar");
        sidebar.classList.toggle("collapsed");
    });
