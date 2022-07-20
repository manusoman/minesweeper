(() => { 'use strict';

const mineRate = 0.16;
const rows = 14;
const cols = 14;

let mineFreeBoxes;
let openedBoxes = 0;

const hasMine = () => Math.random() <= mineRate ? 'm' : 0;
const colorClasses = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const gameEle = document.getElementById('game');
const gameArray = createGame(rows, cols);
const gameGrid = createGrid(gameEle);

attachBoxEvents();


// Functions *************************************************************************

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

function createGrid(gameEle) {
    const fragment = new DocumentFragment();
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

function attachBoxEvents() {
    for (let i = 0; i < rows; ++i) {
        for (let j = 0; j < cols; ++j) {
            gameGrid[i][j].addEventListener('click', e => {
                e.stopPropagation();
                handleClick(i, j);
            }, true);
        }
    }
}

function handleClick(i, j) {
    if (gameArray[i][j] === 'o') return;
    if (gameArray[i][j] === 'm') throw 'Opened a mine: Game over!';

    if (gameArray[i][j] === 0) {
        openBox(i, j, false);

        for (let temp_i = i - 1; temp_i <= i + 1; ++temp_i) {
            for (let temp_j = j - 1; temp_j <= j + 1; ++temp_j) {
                if(gameArray[temp_i] === undefined || gameArray[temp_i][temp_j] === undefined) continue;

                if (gameArray[temp_i][temp_j] === 0) handleClick(temp_i, temp_j);
                else if (gameArray[temp_i][temp_j] !== 'o') openBox(temp_i, temp_j);
            }
        }
    } else openBox(i, j);
}

function openBox(i, j, showCount = true) {
    if (showCount) gameGrid[i][j].textContent = gameArray[i][j];
    gameGrid[i][j].classList.add('open');
    gameArray[i][j] = 'o';

    ++openedBoxes === mineFreeBoxes && alert('Success!');
}

})();
