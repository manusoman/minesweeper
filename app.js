(() => { 'use strict';

const gameSizes = [
    { type : 'small', rows : 14, cols : 14 },
    { type : 'medium', rows : 22, cols : 22 },
    { type : 'large', rows : 30, cols : 30 }
];

const mineRate = 0.16;
const expl_strength = 10;
const colorClasses = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

const header = document.getElementById('header');
const message = document.getElementById('message');
const timer = document.getElementById('timer');
const configureEle = document.getElementById('configure');
const gameEle = document.getElementById('game');

let selectedGameSize;
let gameFrame;
let gameGrid;
let gameArray;
let gameFinished;

let mineMap;
let mineFreeBoxes;
let openedBoxes;

let animationContainer;

// Function references that are assigned later
let handleClick;
let stopTimer;

putCopyright();
attach_createGameEvents(gameSizes);
attach_closeButtonEvent();


// Functions =============================================================================

const hasMine = () => Math.random() <= mineRate ? 'm' : 0;
const getRandomIndex = length => Math.floor(Math.random() * length);

const generateIconMap = () => {
    const { iconWidth, iconHeight, iconMap } = window.IconMap;
    const offset_x = Math.floor((selectedGameSize.cols - iconWidth) / 2);
    const offset_y = Math.floor((selectedGameSize.rows - iconHeight) / 2);
    return iconMap.map(map => [map[0] + offset_y, map[1] + offset_x]);
};

const formatTime = milSecs => {
    const period = milSecs * 0.001; // Conversion to seconds
    const hours = Math.floor(period / 3600);
    const hoursInSecs = hours * 3600;
    const mins = Math.floor((period - hoursInSecs) / 60);
    const seconds = Math.floor(period - hoursInSecs - (mins * 60));
    return (hours ? hours + ':' + mins : mins) + ':' + seconds.toString().padStart(2, '0');
};

const scroll2GridCenter = () => {
    const i = Math.floor(selectedGameSize.rows / 2);
    const j = Math.floor(selectedGameSize.cols / 2);
    const centerBox = gameGrid[i][j];
    centerBox.scrollIntoView({ block :'center', inline :'center' });
};

const finishGame = isSuccess => {
    stopTimer();
    handleClick = () => undefined;
    gameFinished = true;

    if (isSuccess) {
        message.textContent = 'Success!';
        animateWin();
    } else message.textContent = 'You lost :(';
};

function attach_createGameEvents(gameSizes) {
    gameSizes.forEach(size => {
        document.getElementById(size.type).addEventListener('click', e => {
            header.classList.add('whileGaming');

            message.textContent = 'New Game';            
            timer.textContent = '0:00';

            gameFrame = document.createElement('div');
            gameFrame.classList.add(size.type);
            
            selectedGameSize = size;
            gameArray = null;
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
}

function attach_closeButtonEvent() {
    document.getElementById('closeGame').addEventListener('click', e => {
        e.stopPropagation();
        stopTimer();
        
        gameFinished && document.body.removeChild(animationContainer);
        animationContainer = undefined;

        gameEle.removeChild(gameFrame);
        gameEle.classList.add('off');

        configureEle.classList.remove('off');
        header.classList.remove('whileGaming');
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

    handleClick = clickBox;

    for (let i = 0; i < rows; ++i) {
        for (let j = 0; j < cols; ++j) {
            gameGrid[i][j].addEventListener('click', e => {
                e.stopPropagation();

                // The game is created based on where the user clicks first
                if (!gameArray) {
                    gameArray = createGame(rows, cols, i, j);
                    styleMineCounts();
                    startTimer();
                }
                
                handleClick(i, j);
            }, true);
        }
    }
}

function setAnimationContainer(className) {
    animationContainer = document.createElement('div');
    animationContainer.classList.add(className);
    document.body.appendChild(animationContainer);
}

function clickBox(i, j) {
    const val = gameArray[i][j];

    if (val === 'o') return;

    if (val === 'm') {
        const { hypot } = Math;
        const explosion_delay = 30;
        const distances = mineMap.map(cord => hypot(cord[0] - i, cord[1] - j));
        let explosion_time = 0;

        finishGame(false);
        setAnimationContainer('explosionBox', document.body)

        // Sort mineMap array based on distances array and then
        // explode them with the given delay
        sortDistances(distances);

        mineMap.forEach(cord => {
            setTimeout(() => animationContainer && explode(cord[0], cord[1]), explosion_time);
            explosion_time += explosion_delay;
        });
        
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

            if (temp_val === 0) clickBox(temp_i, temp_j);
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

    // In the extreme case where no mines are added by the 
    // random function, call the 'createGame' function again 
    // until a game with at least one mine is created.
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
    // Create the explosion box
    const [c_left, c_top] = getScreenCordinatesForBox(i, j);
    const explBox = createBox(c_left, c_top, 'explBox');

    // Animate the box
    animationContainer.appendChild(explBox);
    setTimeout(() => {
        openBoxUI(gameGrid[i][j], gameArray[i][j], 'minebox');
        gameArray[i][j] = 'o';
        set_box_translation(explBox, c_left, c_top);
    }, 0);
    

    // Knock off the sorrounding boxes too
    for (let a = i - 1; a <= i + 1; ++a) {
        if (gameArray[a] === undefined) continue;

        for (let b = j - 1; b <= j + 1; ++b) {
            const val = gameArray[a][b];

            if(val === undefined || val === 'o' || val === 'm') continue;
            
            const [left, top] = getScreenCordinatesForBox(a, b);
            const explBox = createBox(left, top, 'explBox');

            // Animate the box
            animationContainer.appendChild(explBox);
            setTimeout(() => {
                openBoxUI(gameGrid[a][b], gameArray[a][b], 'nearBox');
                gameArray[a][b] = 'o';
                set_box_translation(explBox, left, top, c_left, c_top);
            }, 0);            
        }
    }
}

function createBox(left, top, className) {
    const explBox = document.createElement('div');
    explBox.style.left = `${left}px`;
    explBox.style.top = `${top}px`;
    explBox.classList.add(className);
    return explBox;
}

function animateWin() {
    const iconMap = generateIconMap();
    const boxCount4icons = iconMap.length;
    const fragment = createAnimationBoxes(boxCount4icons);

    setAnimationContainer('winIconAnimContainer');
    animationContainer.appendChild(fragment);
    scroll2GridCenter();

    // Make the grid blank
    gameFrame.classList.add('won');

    const boxes = animationContainer.children;
    const boxCount = boxes.length;
    let i = 0;

    // Move boxes to form the icon
    while (i < boxCount4icons) {
        const [x, y] = getScreenCordinatesForBox(iconMap[i][0], iconMap[i][1]);
        const box = boxes[i++];

        box.style.left = `${x}px`;
        box.style.top = `${y}px`;
    }

    // If there are extra boxes, move it to random positions in the icon
    while (i < boxCount) {
        const ri = getRandomIndex(boxCount4icons);
        const [x, y] = getScreenCordinatesForBox(iconMap[ri][0], iconMap[ri][1]);
        const box = boxes[i++];

        box.style.left = `${x}px`;
        box.style.top = `${y}px`;
    }
}

function createAnimationBoxes(boxCount4icons) {
    const mineCount = mineMap.length;
    const fragment = new DocumentFragment();
    let i = 0;

    while (i < mineCount) {
        const boxLocation = mineMap[i++];
        const [x, y] = getScreenCordinatesForBox(boxLocation[0], boxLocation[1]);
        const box = createBox(x, y, 'mockBox');
        fragment.appendChild(box);
    }

    while (i++ < boxCount4icons) {
        const boxLocation = mineMap[getRandomIndex(mineCount)];
        const [x, y] = getScreenCordinatesForBox(boxLocation[0], boxLocation[1]);
        const box = createBox(x, y, 'mockBox');
        fragment.appendChild(box);
    }

    return fragment;
}

function getScreenCordinatesForBox(i, j) {
    const box = gameGrid[i][j];
    return [box.offsetLeft, box.offsetTop];
}

function set_box_translation(explBox, x, y, cx = x - 30, cy = y - 30) {
    const x_offset = (x - cx) * expl_strength;
    const y_offset = (y - cy) * expl_strength;

    explBox.style.left = `${ x + x_offset }px`;
    explBox.style.top = `${ y + y_offset }px`;
    explBox.style.opacity = 0;
}

function startTimer() {
    const start = Date.now();
    const id = setInterval(() => {
        timer.textContent = formatTime(Date.now() - start);
    }, 1000);

    stopTimer = () => clearInterval(id);
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
