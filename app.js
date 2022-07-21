(() => { 'use strict';

const configs = [
    { type : 'small', size : 14 },
    { type : 'medium', size : 22 },
    { type : 'large', size : 30 },
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
            openedBoxes = 0;

            const gameArray = createGame(conf.size, conf.size);
            const gameGrid = createGrid(gameFrame, gameArray);

            attachBoxEvents(gameGrid, gameArray, gameFinish);

            gameEle.appendChild(gameFrame);
            configureEle.classList.add('off');
            gameEle.classList.remove('off');
            e.stopPropagation();
        }, true);
    });
}

function createGame(rows, cols) {
    const gameArray = [];
    let totalMines = 0;
    let r = rows;

    while (r--) {
        const a = [];
        let i = cols;

        while (i--) {
            const temp = hasMine();
            temp && ++totalMines;
            a.push(temp);
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

function createGrid(gameEle, gameArray) {
    const fragment = new DocumentFragment();
    const rows = gameArray.length;
    const cols = gameArray[0].length;
    const gameGrid = [];

    for (let i = 0; i < rows; ++i) {
        const row = document.createElement('div');
        const rowArray = [];

        row.classList.add('row');
        
        for (let j = 0; j < cols; ++j) {
            const box = document.createElement('div');
            const val = gameArray[i][j];

            if (val && val !== 'm') {
                box.classList.add(colorClasses[val - 1]);
            }

            box.classList.add('box');
            row.appendChild(box);
            rowArray.push(box);
        }

        fragment.appendChild(row);
        gameGrid.push(rowArray);
    }
    
    gameEle.appendChild(fragment);
    return gameGrid;
}

function attachBoxEvents(gameGrid, gameArray, gameFinishCB) {
    const rows = gameArray.length;
    const cols = gameArray[0].length;

    const openBox = (i, j, showCount = true) => {
        if (showCount) gameGrid[i][j].textContent = gameArray[i][j];
        gameGrid[i][j].classList.add('open');
        gameArray[i][j] = 'o';

        ++openedBoxes === mineFreeBoxes && gameFinishCB(true);
    };

    for (let i = 0; i < rows; ++i) {
        for (let j = 0; j < cols; ++j) {
            gameGrid[i][j].addEventListener('click', e => {
                e.stopPropagation();
                handleClick(i, j, gameArray, gameFinishCB, openBox);
            }, true);
        }
    }
}

function handleClick(i, j, gameArray, gameFinishCB, openBox) {
    if (gameArray[i][j] === 'o') return;

    if (gameArray[i][j] === 'm') {
        gameFinishCB(false);
        return;
    }

    if (gameArray[i][j] === 0) {
        openBox(i, j, false);

        for (let temp_i = i - 1; temp_i <= i + 1; ++temp_i) {
            for (let temp_j = j - 1; temp_j <= j + 1; ++temp_j) {
                if (gameArray[temp_i] === undefined || gameArray[temp_i][temp_j] === undefined) continue;

                if (gameArray[temp_i][temp_j] === 0) handleClick(temp_i, temp_j);
                else if (gameArray[temp_i][temp_j] !== 'o') openBox(temp_i, temp_j);
            }
        }
    } else openBox(i, j);
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
