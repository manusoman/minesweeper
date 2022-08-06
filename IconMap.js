(() => { 'use strict';

const str = `       000
       0 0
      0  0
     0  0000
000 0       0
0 0 0       0
0 0 0       0
0 0 0       0
0 0 0       0
0 0 0      0
000  000000`;

const rows = str.split('\n');
const iconWidth = 13;
const iconHeight = rows.length;

function getIconMap() {
    const iconMap = [];

    for (let i = 0; i < iconHeight; ++i) {
        const row = rows[i];
        const cl = row.length;
    
        for (let j = 0; j < cl; ++j) {
            if (row[j] === '0') {
                iconMap.push([i, j]);
            }
        }
    }

    return iconMap;
};

window.IconMap = { iconWidth, iconHeight, iconMap : getIconMap() };

})();
