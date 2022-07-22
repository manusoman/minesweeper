(() => { 'use strict';

const configs = [
    { type : 'small', rows : 14, cols : 14 },
    { type : 'medium', rows : 22, cols : 22 },
    { type : 'large', rows : 30, cols : 30 }
];

const mineRate = 0.16;
const colorClasses = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

let mineFreeBoxes;
let openedBoxes = 0;

putCopyright();
addCreateGameEvents(configs);


// Functions *************************************************************************

const hasMine = () => Math.random() <= mineRate ? 'm' : 0;

function addCreateGameEvents(configs) {
    const gameEle = document.getElementById('game');
    const configureEle = document.getElementById('configure');
    let gameFrame;

    const gameFinish = isSuccess => {
        isSuccess ? alert('Success!') : alert('You lost :(');
        gameEle.removeChild(gameFrame);
        gameEle.classList.add('off');
        configureEle.classList.remove('off');
    };

    configs.forEach(conf => {
        document.getElementById(conf.type).addEventListener('click', e => {
            gameFrame = document.createElement('div');
            gameFrame.classList.add(conf.type);
            openedBoxes = 0;

            const gameGrid = createGrid(gameFrame, conf.rows, conf.cols);

            attachBoxEvents(gameGrid, gameFinish);
            gameEle.appendChild(gameFrame);
            configureEle.classList.add('off');
            gameEle.classList.remove('off');
            e.stopPropagation();
        }, true);
    });
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
            gameFinishCB(false);
            return;
        }
    
        openBox(i, j, val);
    
        if (val > 0) return;
    
        for (let temp_i = i - 1; temp_i <= i + 1; ++temp_i) {
            for (let temp_j = j - 1; temp_j <= j + 1; ++temp_j) {
                const temp_val = gameArray[temp_i] === undefined ||
                                    gameArray[temp_i][temp_j] === undefined ?
                                    undefined : gameArray[temp_i][temp_j];
    
                if (temp_val === undefined) continue;
    
                if (temp_val === 0) handleClick(temp_i, temp_j);
                else if (temp_val !== 'o') openBox(temp_i, temp_j, temp_val);
            }
        }
    }
    
    function openBox(i, j, val) {
        const box = gameGrid[i][j];

        if (val > 0) box.textContent = val;

        box.classList.add('open');
        gameArray[i][j] = 'o';

        ++openedBoxes === mineFreeBoxes && gameFinishCB(true);
    }
}

function createGame(rows, cols, clickedRow, clickedCol) {
    const gameArray = [];
    let totalMines = 0;

    for (let i = 0; i < rows; ++i) {
        const a = [];
        const zeroFlag = (i >= clickedRow - 1) && (i <= clickedRow + 1);

        for (let j = 0; j < cols; ++j) {
            if (zeroFlag && (j >= clickedCol - 1) && (j <= clickedCol + 1)) {
                a.push(0);
            } else {
                const temp = hasMine();
                temp && ++totalMines;
                a.push(temp);
            }
        }

        gameArray.push(a);
    }

    mineFreeBoxes = (rows * cols) - totalMines;

    for (let i = 0; i < rows; ++i) {
        for (let j = 0; j < cols; ++j) {
            if (gameArray[i][j] === 'm') continue;

            let mineCount = 0;

            for (let temp_i = i - 1; temp_i <= i + 1; ++temp_i) {
                for (let temp_j = j - 1; temp_j <= j + 1; ++temp_j) {                    
                    if (gameArray[temp_i] === undefined || gameArray[temp_i][temp_j] === undefined) continue;
                    gameArray[temp_i][temp_j] === 'm' && ++mineCount;
                }
            }

            gameArray[i][j] = mineCount;
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
