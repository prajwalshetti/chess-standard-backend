const express = require("express");
const socketIO = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static(path.join(__dirname, 'images')));


app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function(socket) {
    console.log("New connection:", socket.id);

    // Player assignment logic
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    // Send initial board state
    socket.emit("boardState", chess.fen());

    socket.on("move", function(move) {
        try {
            // Validate player turn
            if ((chess.turn() === 'w' && socket.id !== players.white) ||
                (chess.turn() === 'b' && socket.id !== players.black)) {
                socket.emit("invalidMove", move);
                return;
            }

            // Validate and apply move
            const result = chess.move(move);
            if (result) {
                // Broadcast move and new board state
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                socket.emit("invalidMove", move);
            }
        } catch (error) {
            console.error("Move error:", error);
            socket.emit("invalidMove", move);
        }
    });

    socket.on("disconnect", function() {
        console.log("Disconnected")
        if (socket.id === players.white) {
            delete players.white;
        } else if (socket.id === players.black) {
            delete players.black;
        }
        
        // Optional: Reset game if a player disconnects
        chess.reset();
        io.emit("boardState", chess.fen());
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});