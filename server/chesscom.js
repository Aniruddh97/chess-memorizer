const ChessWebAPI = require("chess-web-api");
const chessAPI = new ChessWebAPI();
const axios = require("axios");

const processedGames = {};

const pullAndStudyChessDotComGames = async (filter) => {
    const date = new Date();

    const result = await chessAPI.getPlayerCompleteMonthlyArchives(
        "aniruddhpandya",
        date.getFullYear(),
        date.getMonth() + 1
    );
    const games = result?.body?.games;

    if (!games?.length) return;

    const filteredGames = games.filter((game) => game.time_control == "600");

    for (let game of filteredGames.slice(-1)) {
        if (processedGames[game.url]) continue;

        processedGames[game.url] = true;

        await axios({
            method: "post",
            url: "https://chess-memorizer-production.up.railway.app/api/pgn/upload",
            headers: {
                "content-type": "application/json",
            },
            data: JSON.stringify({
                pgn: game.pgn,
            }),
        }).catch(function (error) {
            console.log(error.response.message);
        });
    }
};

module.exports = {
    pullAndStudyChessDotComGames,
};
