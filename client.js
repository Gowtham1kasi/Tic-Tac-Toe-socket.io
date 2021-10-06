const readline = require('readline');
// Read line
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const io = require("socket.io-client");

// Connecting to server
const socket = io.connect(`http://${process.argv[2]}:${process.argv[3]}`, {
    reconnect: true
});

let win = false;

// listening for player no
socket.on("message", (playerNo,message) => {
    if(playerNo < 3) console.log(`you are player ${playerNo}\n${message} `); 
    
    else {
        console.log(message);
    }
    socket.on("win", msg => {
        win = true;
        console.log(msg);
        process.exit();
    })

    // Board
    socket.on("board", board => {
        console.log(`\n${board[1]} ${board[2]} ${board[3]}`);
        console.log(`${board[4]} ${board[5]} ${board[6]}`);
        console.log(`${board[7]} ${board[8]} ${board[9]}`);
    });

    // listening For player Turn
    socket.on("turn", res => {
        if (res !== "") {
            console.log(res);
        }
        rl.question('your no: ', function (result) {
            if (win === true) {
                return rl.close();
            }
            if (result === "r") {
                socket.emit("reset");
            } else {
                socket.emit("move", result);
            }
        });
    })
});