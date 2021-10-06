const express = require("express");
const app = express();
const socket = require("socket.io");
const server = app.listen(process.argv[2], ()=> console.log(`server running on port ${process.argv[2]}`));

// creating websaocket connection
const io = socket(server);

let players = 0;
let player1;
let player2;

let player1Turn = true;

let board = {
    1: ".",
    2: ".",
    3: ".",
    4: ".",
    5: ".",
    6: ".",
    7: ".",
    8: ".",
    9: "."
};

// probability of winning combination
const winProbability = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [3, 6, 9],
    [2, 5, 8], [1, 4, 7], [3, 5, 7], [1, 5, 9]];

// Winner check after every input
function checkForWin(playerCharacter) {
    let line;
    for (let i = 0; i < winProbability.length; i++) {
        line = 0;
        for (let j = 0; j < winProbability[i].length; j++) {
            if (board[winProbability[i][j]] === playerCharacter) {
                line++;
            }
            if (line === 3) {
                return true;
            }
        }
    } 
    return false;
}

// check for Tie
function checkTie() {
    for (let i = 1; i <= Object.keys(board).length; i++) {
        if (board[i] === ".") {
            return false;
        }
    }
    io.emit("win", "It's a TIE!!");
    return true();
}


// Game reset 
function newGame() {
    Object.keys(board).forEach( (key) => {
        board[key] = ".";
    });
    player1Turn = true;
}

// websocket listening for players connection 
io.on("connection", socket => {
    console.log("connected");
    if (players === 0) {
        socket.emit("message", 1, 'waiting for player 2 to join');
        player1 = socket.id;
        
    } if (players === 1) {
        socket.emit("message", 2, 'player 1 will start game');
        player2 = socket.id;
        
        // Starting the game only after player2 is connected
        io.to(player1).emit("turn", "player 2 joined please make a move to start game ");
    }
    // players exceed more than 2
    if(players >= 2) {
        socket.emit("message", 3, 'lobby is full');
    }
    players++;

    // when player disconnected
    socket.on("disconnect", () => {
        if (players !== 0) {
            players--;
        }
        newGame();
        return;
    })

    // listening for player moves
    socket.on("move", num => {
        // For player 1 turn
        if (player1Turn) {
            if (board[num] !== ".") {
                io.to(player1).emit("turn", "spot already taken");
            } 
            // Changes spot
            board[num] = "x";

            if (checkForWin("x")) {
                io.emit("win", "Game won by first player");
                return newGame();
                
            }     
            if (checkTie())  return newGame();
            
            // Sends the board and sets for next player
            io.emit("board", board);
            io.to(player2).emit("turn", "");
            player1Turn = false; 
            return;
        } 

        // For player 2 turn 
        if (board[num] !== ".") {
            return io.to(player2).emit("turn", "spot already taken");
        }
        board[num] = "o";
                
        if (checkForWin("o")) {
            io.emit("win", "Game won by second player");
            return newGame();  
        } 
        if (checkTie())  return newGame();
        
        io.emit("board", board);
        io.to(player1).emit("turn", "");
        player1Turn = true;      
    });


    // player resets game
    socket.on("reset", () => {
        let player = 'first';
        if(socket.id === player1) player = 'second';

        io.emit("win", `Game won by ${player} player`);
        newGame();
    });
});


