
//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//bird
let birdWidth = 34; //width/height ratio = 408/228 = 17/12
let birdHeight = 24;
let birdX = boardWidth/8;
let birdY = boardHeight/2;
let birdImg;

let bird = {
    x : birdX,
    y : birdY,
    width : birdWidth,
    height : birdHeight
}

//pipes
let pipeArray = [];
let pipeWidth = 64; //width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;
let bottomPipeFlowerImg;

//physics
let velocityX = -2; //pipes moving left speed
let velocityY = 0; //bird jump speed
let gravity = 0.4;

let gameOver = false;
let score = 0;
let birdColor;

let highestScore = 0;
let easy = 0;
let medium = 10;
let hard = 20;

let pipeOscillationSpeed = 0.02; // speed of up-down oscillation
let pipeAmplitude = 20; // amplitude of the vertical movement

let stopGame = false;

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    //load images
    birdImg = new Image(); // https://www.pixelcut.ai/t/background-remover
    birdImg.src =  "./flappybird_yellow.png"; // Default bird color is yellow
    birdImg.onload = function() { // https://pixelart.streamlit.app/
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    }

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";
    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png"; 
    bottomPipeFlowerImg = new Image();
    bottomPipeFlowerImg.src = "./bottompipe_flower.png"; 

    requestAnimationFrame(update);
    setInterval(placePipes, 1500); //every 1.5 seconds
    document.addEventListener("keydown", moveBird);
    setInterval(triggerAction, 8000); //every 1.5 seconds
}

function update() {
    requestAnimationFrame(update);
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height);
    velocityY += gravity;

    bird.y = Math.max(bird.y + velocityY, 0); //apply gravity to current bird.y, limit the bird.y to top of the canvas
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) {
        gameOver = true;
    }

    //pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;

        let oscillation = 0;

        // Apply oscillation only when score exceeds average level
        if (score > medium) {
            oscillation = pipeAmplitude * Math.sin(pipe.x * pipeOscillationSpeed);
        }

        context.drawImage(pipe.img, pipe.x, pipe.y + oscillation, pipe.width, pipe.height);

        if (!pipe.passed && !pipe.skip && bird.x > pipe.x + pipe.width) {
            score += 0.5; //0.5 because there are 2 pipes! so 0.5*2 = 1, 1 for each set of pipes
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe, oscillation)) {
            gameOver = true;
            stopGame = true;
            if (score > highestScore){
                highestScore = score;
                if(!actions){
                    console.log('Action null');
                    return;
                }
                try {
                    let user = {name: window.birdInfo.birdName, color: window.birdInfo.color, score};
                    let playerIndex = -1;

                    if (valuePlayers.length !== 0 ){
                        playerIndex = valuePlayers.findIndex(player => player.name === user.name);
                    }
                    if (playerIndex !== -1) {
                    // If player exists, update the player details
                    valuePlayers[playerIndex] = user;
                    } else {
                    // If player does not exist, insert the new user
                    valuePlayers.push(user);
                    }
                    console.log('playerIndex', playerIndex, valuePlayers);
                    eraWidget.triggerAction(actions[0].action, 0, JSON.stringify({value: valuePlayers}));
                }
                catch(err) {
                    console.log('Error', err);
                }
            }
        }
    }

    //clear pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift(); //removes first element from the array
    }

    //score
    context.fillStyle = "white";
    context.font="45px sans-serif";
    context.fillText(score, 5, 45);
    context.fillText(highestScore, 310, 45);
    if (gameOver) {
        context.fillText("GAME OVER", 45, 250);
    }
}

function placePipes() {
    if (gameOver) {
        return;
    }

    //(0-1) * pipeHeight/2.
    // 0 -> -128 (pipeHeight/4)
    // 1 -> -128 - 256 (pipeHeight/4 - pipeHeight/2) = -3/4 pipeHeight
    let randomPipeY = pipeY - pipeHeight/4 - Math.random()*(pipeHeight/2);
    let openingSpace = score > medium ? board.height / 5 : board.height / 4;

    const pipesToAdd = [
        {
            img: topPipeImg,
            x: pipeX,
            y: randomPipeY,
            width: pipeWidth,
            height: pipeHeight,
            passed: false,
            skip: false,
        },
        {
            img: bottomPipeImg,
            x: pipeX,
            y: randomPipeY + pipeHeight + openingSpace,
            width: pipeWidth,
            height: pipeHeight,
            passed: false,
            skip: false,
        }
    ];

    if (score > hard) {
        pipesToAdd.push(
            { ...pipesToAdd[0], x: pipeX + 40, y: randomPipeY - 10, skip: true },
            { ...pipesToAdd[1], x: pipeX + 40, y: randomPipeY + 10 + pipeHeight + openingSpace, skip: true },
        );
    } else if (score > medium) {
        if (score % 2) {
            pipesToAdd.push(
                { ...pipesToAdd[0], x: pipeX + 20, y: randomPipeY - 10, skip: true },
            );
        } else {
            pipesToAdd.push(
                { ...pipesToAdd[1], x: pipeX + 20, y: randomPipeY + 10 + pipeHeight + openingSpace, skip: true },
            );
        }
    }
    pipeArray.push(...pipesToAdd);
}

function moveBird(e) {
    if (e.code == "Space") {
        if(stopGame){
            stopGame = false;
            return;
        }
        const activeElement = document.activeElement;
        // Check if the input field is focused
        if (activeElement.tagName === 'INPUT') {
            return;
        }
        //jump
        velocityY = -6;

        //reset game
        if (gameOver) {
            bird.y = birdY;
            pipeArray = [];
            score = 0;
            gameOver = false;
        }
    }
}

function detectCollision(a, b, oscillation) {

    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < (b.y + oscillation) + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > (b.y + oscillation);    //a's bottom left corner passes b's top left corner
}

function triggerAction() {
    eraWidget.triggerAction(actions[0].action, 0, JSON.stringify({value: []}));
}
