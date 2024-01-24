let grid = [];
let cols = 20;
let rows = 20;
let loc=50;

function setup() {
    createCanvas(windowWidth, windowHeight);
    let rowSize = height / rows;
    let colSize = width / cols;
    for (let i = 0; i < cols; i++) {
        grid[i] = [];
        for (let j = 0; j < rows; j++) {
            grid[i][j] = new Cell(colSize / 2 + i * colSize, rowSize / 2 + j * rowSize, rowSize / 2, i*loc+j*loc);
        }
    }
}

function draw() {
    background(45, 50, 80);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            grid[i][j].update();
            grid[i][j].display();
        }
    }
}