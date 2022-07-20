(() => { 'use strict';

const mineRate = 0.16;
const rows = 20;
const cols = 20;

const hasMine = () => Math.random() <= mineRate ? 'm' : 0;
const colorClasses = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const gameEle = document.getElementById('game');
const gameArray = createGame(rows, cols);
const gameGrid = createGrid(gameEle);

attachBoxEvents();


// Functions *************************************************************************

function createGame(rows, cols) {
    let r = rows;
    const gameArray = [];

    while (r--) {
        let i = cols;
        const a = [];
        while (i--) a.push(hasMine());
        gameArray.push(a);
    }

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
                openBox(i, j);
            }, true);
        }
    }
}

function openBox(i, j) {
    if (gameArray[i][j] === 'o') return;
    if (gameArray[i][j] === 'm') throw 'Opened a mine: Game over!';

    if (gameArray[i][j] === 0) {
        gameGrid[i][j].classList.add('open');
        gameArray[i][j] = 'o';

        for (let temp_i = i - 1; temp_i <= i + 1; ++temp_i) {
            for (let temp_j = j - 1; temp_j <= j + 1; ++temp_j) {
                if(gameArray[temp_i] === undefined || gameArray[temp_i][temp_j] === undefined) continue;

                if (gameArray[temp_i][temp_j] === 0) {
                    openBox(temp_i, temp_j);
                } else if (gameArray[temp_i][temp_j] !== 'o') {
                    gameGrid[temp_i][temp_j].textContent = gameArray[temp_i][temp_j];
                    gameGrid[temp_i][temp_j].classList.add('open');
                    gameArray[temp_i][temp_j] = 'o';
                }
            }
        }
    } else {
        gameGrid[i][j].textContent = gameArray[i][j];
        gameGrid[i][j].classList.add('open');
        gameArray[i][j] = 'o';
    }
}

})();
