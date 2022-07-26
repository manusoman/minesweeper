(() => { 'use strict';

const gameSizes = [
    { type : 'small', rows : 14, cols : 14 },
    { type : 'medium', rows : 22, cols : 22 },
    { type : 'large', rows : 30, cols : 30 }
];

const mineRate = 0.16;
const expl_strength = 10;
const colorClasses = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

let gameFrame;
let mineMap;
let mineFreeBoxes;
let openedBoxes;
let explosionBox;

putCopyright();
addCreateGameEvents(gameSizes);


// Functions *************************************************************************

const hasMine = () => Math.random() <= mineRate ? 'm' : 0;

function addCreateGameEvents(gameSizes) {
    const gameEle = document.getElementById('game');
    const configureEle = document.getElementById('configure');
    const gameFinishBox = document.getElementById('gameFinish');
    const message = document.getElementById('message');
    const newGameButton = document.getElementById('newGame');

    const gameFinish = isSuccess => {
        message.textContent = isSuccess ? 'Success!' : 'You lost :(';
        gameFinishBox.classList.add('visible');
    };

    gameSizes.forEach(size => {
        document.getElementById(size.type).addEventListener('click', e => {
            gameFrame = document.createElement('div');
            gameFrame.classList.add(size.type);

            mineMap = [];
            openedBoxes = 0;

            const gameGrid = createGrid(gameFrame, size.rows, size.cols);

            attachBoxEvents(gameGrid, gameFinish);
            gameEle.appendChild(gameFrame);
            configureEle.classList.add('off');
            gameEle.classList.remove('off');
            e.stopPropagation();
        }, true);
    });

    newGameButton.addEventListener('click', e => {
        e.stopPropagation();
        gameFinishBox.classList.remove('visible');
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

function attachBoxEvents(gameGrid, gameFinishCB) {
    const rows = gameGrid.length;
    const cols = gameGrid[0].length;
    let gameArray;

    for (let i = 0; i < rows; ++i) {
        for (let j = 0; j < cols; ++j) {
            gameGrid[i][j].addEventListener('click', e => {
                e.stopPropagation();

                if (!gameArray) {
                    gameArray = createGame(rows, cols, i, j);
                    styleMineCounts(gameGrid, gameArray);
                }
                
                handleClick(i, j);
            }, true);
        }
    }

    function handleClick(i, j) {
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
                    explode(cord[0], cord[1], gameArray, gameGrid);
                }, explosion_time);

                explosion_time += explosion_delay;
            });

            setTimeout(() => {
                document.body.removeChild(explosionBox);
                explosionBox = null;
                gameFinishCB(false);
            }, explosion_time);

            return;
        }
    
        openBox(i, j, val);
    
        if (val > 0) return;
    
        for (let temp_i = i - 1; temp_i <= i + 1; ++temp_i) {
            if (gameArray[temp_i] === undefined) continue;

            for (let temp_j = j - 1; temp_j <= j + 1; ++temp_j) {
                const temp_val = gameArray[temp_i][temp_j];    
                if (temp_val === undefined) continue;
    
                if (temp_val === 0) handleClick(temp_i, temp_j);
                else if (temp_val !== 'o') openBox(temp_i, temp_j, temp_val);
            }
        }
    }

    function openBox(i, j, val) {
        const box = gameGrid[i][j];
        openBoxUI(box, val);
        gameArray[i][j] = 'o';
        ++openedBoxes === mineFreeBoxes && gameFinishCB(true);
    }
}
    
function openBoxUI(box, val, isBlast) {
    if (val > 0) box.textContent = val;
    box.classList.add(isBlast ? 'blast' : 'open');
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

    mineFreeBoxes = (rows * cols) - mineMap.length;

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

function styleMineCounts(gameGrid, gameArray) {
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

function explode(i, j, gameArray, gameGrid) {
    // create the explosion box
    const box = gameGrid[i][j];
    const c_left = box.offsetLeft;
    const c_top = box.offsetTop;
    const explBox = create_explBox(c_left, c_top);

    // animate the box
    explosionBox.appendChild(explBox);
    setTimeout(() => {
        openBoxUI(gameGrid[i][j], gameArray[i][j], true);
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
                openBoxUI(gameGrid[a][b], gameArray[a][b], true);
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
