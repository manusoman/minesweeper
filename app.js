(() => { 'use strict';

const gameSizes = [
    { type : 'small', rows : 14, cols : 14 },
    { type : 'medium', rows : 22, cols : 22 },
    { type : 'large', rows : 30, cols : 30 }
];

const mineRate = 0.16;
const expl_strength = 10;
const colorClasses = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

const gameFinishBox = document.getElementById('gameFinish');
const message = document.getElementById('message');

let gameFrame;
let gameGrid;
let gameArray;
let mineMap;
let mineFreeBoxes;
let openedBoxes;
let explosionBox;
let gameFinished;
let handleClick;

putCopyright();
attach_CreateGameEvents(gameSizes);


// Functions *************************************************************************

const hasMine = () => Math.random() <= mineRate ? 'm' : 0;
const finishGame = isSuccess => {
    handleClick = () => undefined;
    gameFinished = true;
    gameArray = null;

    if (isSuccess) {
        message.textContent = 'Success!';
    } else {
        document.body.removeChild(explosionBox);
        explosionBox = undefined;
        message.textContent = 'You lost :(';
    }
    
    gameFinishBox.classList.remove('off');
};

function attach_CreateGameEvents(gameSizes) {
    const gameEle = document.getElementById('game');
    const configureEle = document.getElementById('configure');
    const newGameButton = document.getElementById('newGame');

    gameSizes.forEach(size => {
        document.getElementById(size.type).addEventListener('click', e => {
            gameFrame = document.createElement('div');
            gameFrame.classList.add(size.type);
            
            gameFinished = false;
            mineMap = [];
            openedBoxes = 0;
            gameGrid = createGrid(gameFrame, size.rows, size.cols);

            attachBoxEvents();
            gameEle.appendChild(gameFrame);
            configureEle.classList.add('off');
            gameEle.classList.remove('off');
            e.stopPropagation();
        }, true);
    });

    newGameButton.addEventListener('click', e => {
        e.stopPropagation();
        gameFinishBox.classList.add('off');
        gameEle.removeChild(gameFrame);
        gameEle.classList.add('off');
        configureEle.classList.remove('off');
    }, true);
}

function createGrid(parentEle, rows, cols) {
    const gameGrid = [];

    for (let i = 0; i < rows; ++i) {
        const row = document.createElement('div');
        const rowArray = [];
        
        for (let j = 0; j < cols; ++j) {
            const box = document.createElement('div');

            box.classList.add('box');
            row.appendChild(box);
            rowArray.push(box);
        }

        row.classList.add('row');
        parentEle.appendChild(row);
        gameGrid.push(rowArray);
    }
    
    return gameGrid;
}

function attachBoxEvents() {
    const rows = gameGrid.length;
    const cols = gameGrid[0].length;

    handleClick = boxClickHandler;

    for (let i = 0; i < rows; ++i) {
        for (let j = 0; j < cols; ++j) {
            gameGrid[i][j].addEventListener('click', e => {
                e.stopPropagation();

                if (!gameArray) {
                    gameArray = createGame(rows, cols, i, j);
                    styleMineCounts();
                }
                
                handleClick(i, j);
            }, true);
        }
    }
}

function boxClickHandler(i, j) {
    const val = gameArray[i][j];

    if (val === 'o') return;

    if (val === 'm') {
        const { hypot } = Math;
        const explosion_delay = 30;
        const distances = mineMap.map(cord => hypot(cord[0] - i, cord[1] - j));
        let explosion_time = 0;

        explosionBox = document.createElement('div');
        explosionBox.classList.add('explosionBox');
        document.body.appendChild(explosionBox);

        // Sort mineMap array based on distances array and then
        // explode them with the given delay
        sortDistances(distances);

        mineMap.forEach(cord => {
            setTimeout(() => {
                explode(cord[0], cord[1]);
            }, explosion_time);

            explosion_time += explosion_delay;
        });

        setTimeout(() => {
            finishGame(false);
        }, explosion_time);

        return;
    }

    if (openBox(i, j)) {
        finishGame(true);
        return;
    }

    if (val > 0) return;

    for (let temp_i = i - 1; temp_i <= i + 1; ++temp_i) {
        if (gameFinished) return;
        if (gameArray[temp_i] === undefined) continue;

        for (let temp_j = j - 1; temp_j <= j + 1; ++temp_j) {
            if (gameFinished) return;
            const temp_val = gameArray[temp_i][temp_j];
            
            if (temp_val === undefined) continue;

            if (temp_val === 0) boxClickHandler(temp_i, temp_j);
            else if (temp_val !== 'o' && openBox(temp_i, temp_j)) {
                finishGame(true);
                return;
            }
        }
    }
}

function openBox(i, j) {
    const val = gameArray[i][j];
    const box = gameGrid[i][j];
    openBoxUI(box, val);
    gameArray[i][j] = 'o';
    return ++openedBoxes === mineFreeBoxes;
}
    
function openBoxUI(box, val, blastData) {
    if (val > 0) box.textContent = val;
    box.classList.add(blastData || 'open');
}

function sortDistances(distances) {
    const len = distances.length;

    for (let i = 0; i < len - 1; ++i) {
        for (let j = i + 1; j < len; ++j) {
            if (distances[i] <= distances[j]) continue;

            const temp1 = distances[i];
            const temp2 = mineMap[i];

            distances[i] = distances[j];
            distances[j] = temp1;

            mineMap[i] = mineMap[j];
            mineMap[j] = temp2;
        }
    }
}

function createGame(rows, cols, clickedRow, clickedCol) {
    const gameArray = [];

    for (let i = 0; i < rows; ++i) {
        const a = [];
        const zeroFlag = (i >= clickedRow - 1) && (i <= clickedRow + 1);

        for (let j = 0; j < cols; ++j) {
            if (zeroFlag && (j >= clickedCol - 1) && (j <= clickedCol + 1)) {
                a.push(0);
            } else {
                const temp = hasMine();
                temp && mineMap.push([i, j]);
                a.push(temp);
            }
        }

        gameArray.push(a);
    }

    const totalBoxes = rows * cols;
    mineFreeBoxes = totalBoxes - mineMap.length;

    // In the extreme case where no mines where added by the random function
    // call the 'createGame' function again until at least one mine is added.
    if (mineFreeBoxes === totalBoxes) {
        return createGame(rows, cols, clickedRow, clickedCol);
    }

    for (let i = 0; i < rows; ++i) {
        for (let j = 0; j < cols; ++j) {
            if (gameArray[i][j] === 'm') continue;

            let sorroundingMines = 0;

            for (let temp_i = i - 1; temp_i <= i + 1; ++temp_i) {
                if (gameArray[temp_i] === undefined) continue;
                for (let temp_j = j - 1; temp_j <= j + 1; ++temp_j) {                    
                    if (gameArray[temp_i][temp_j] === undefined) continue;
                    gameArray[temp_i][temp_j] === 'm' && ++sorroundingMines;
                }
            }

            gameArray[i][j] = sorroundingMines;
        }
    }

    return gameArray;
}

function styleMineCounts() {
    const rows = gameGrid.length;
    const cols = gameGrid[0].length;

    for (let i = 0; i < rows; ++i) {
        for (let j = 0; j < cols; ++j) {
            const val = gameArray[i][j];

            if (val && val !== 'm') {
                const box = gameGrid[i][j];
                box.classList.add(colorClasses[val - 1]);
            }
        }
    }
}

function explode(i, j) {
    // create the explosion box
    const box = gameGrid[i][j];
    const c_left = box.offsetLeft;
    const c_top = box.offsetTop;
    const explBox = create_explBox(c_left, c_top);

    // animate the box
    explosionBox.appendChild(explBox);
    setTimeout(() => {
        openBoxUI(gameGrid[i][j], gameArray[i][j], 'minebox');
        gameArray[i][j] = 'o';
        set_box_translation(explBox, c_left, c_top);
    }, 0);
    

    // also knock off the sorrounding boxes
    for (let a = i - 1; a <= i + 1; ++a) {
        if (gameArray[a] === undefined) continue;

        for (let b = j - 1; b <= j + 1; ++b) {
            const val = gameArray[a][b];

            if(val === undefined || val === 'o' || val === 'm') continue;
            
            const box = gameGrid[a][b];
            const left = box.offsetLeft;
            const top = box.offsetTop;
            const explBox = create_explBox(left, top);

            // animate the box
            explosionBox.appendChild(explBox);
            setTimeout(() => {
                openBoxUI(gameGrid[a][b], gameArray[a][b], 'nearBox');
                gameArray[a][b] = 'o';
                set_box_translation(explBox, left, top, c_left, c_top);
            }, 0);            
        }
    }
}

function create_explBox(left, top) {
    const explBox = document.createElement('div');
    explBox.style.left = left + 'px';
    explBox.style.top = top + 'px';
    explBox.classList.add('explBox');
    return explBox;
}

function set_box_translation(explBox, x, y, cx = x - 30, cy = y - 30) {
    const x_offset = (x - cx) * expl_strength;
    const y_offset = (y - cy) * expl_strength;

    explBox.style.left = x + x_offset + 'px';
    explBox.style.top = y + y_offset + 'px';
    explBox.style.opacity = 0;
}

function putCopyright() {
    let spanEle, year;

    fetch('https://manusoman.github.io/MindLogs/settings.json')
	.then(res => res.json())
	.then(data => year = data.current_year)
	.catch(err => {
        year = new Date().getFullYear();
        console.error(err.message);
    }).finally(() => spanEle.textContent = `© ${year}, Manu Soman`);

    spanEle = document.getElementById('copyright');
}

})();
