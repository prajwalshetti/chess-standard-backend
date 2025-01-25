const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        'n': "♞", 'r': "♜", 'N': "♘", 'b': "♝", 
        'q': "♛", 'k': "♚", 'K': "♔", 'R': "♖", 
        'B': "♗", 'Q': "♕", 'p': "♙", 'P': "♟"
    };
    return unicodePieces[piece.type] || "";
};

const getPieceImage = (piece) => {
    if (!piece) return null;
    const color = piece.color === 'w' ? 'white' : 'black';
    const pieceName = {
        'p': 'pawn',
        'r': 'rook',
        'n': 'knight',
        'b': 'bishop',
        'q': 'queen',
        'k': 'king',
    }[piece.type];
    return `/images/${color}/${pieceName}.png`;
};


const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", 
                ((rowIndex + squareIndex) % 2 === 0) ? "light" : "dark"
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === 'w' ? "white" : "black");

                
                const pieceImage = document.createElement("img");
                pieceImage.src = getPieceImage(square);
                pieceImage.alt = `${square.color === 'w' ? 'White' : 'Black'} ${square.type}`;
                pieceImage.classList.add("piece-image");
                pieceElement.appendChild(pieceImage);
                

                // Only make piece draggable if it's the player's turn and color
                pieceElement.draggable = playerRole === square.color && playerRole === chess.turn();
                
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => e.preventDefault());

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };

                    const move = {
                        from: `${String.fromCharCode(97 + sourceSquare.col)}${8 - sourceSquare.row}`,
                        to: `${String.fromCharCode(97 + targetSquare.col)}${8 - targetSquare.row}`
                    };

                    socket.emit("move", move);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    // Optionally add board rotation based on player's color
    boardElement.classList.toggle("flipped", playerRole === 'b');
};

socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
});

socket.on("move", function (move) {
    chess.move(move);
    renderBoard();
});

socket.on("invalidMove", function () {
    alert("Invalid move! Try again.");
});

renderBoard();