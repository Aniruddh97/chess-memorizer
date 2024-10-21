document.getElementById("pgnForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const pgnInput = document.getElementById("pgnInput").value.trim();

    if (!pgnInput) {
        document.getElementById("responseMessage").textContent =
            "Please paste your PGN.";
        return;
    }

    fetch("https://chessmemorizer1-6a4ddn5z.b4a.run/api/pgn/upload", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ pgn: pgnInput }),
    })
        .then((response) => response.json())
        .then((data) => {
            document.getElementById("responseMessage").textContent =
                data.message;
        })
        .catch((error) => {
            document.getElementById("responseMessage").textContent =
                "Error: " + error.message;
        });
});
