const grid = document.querySelector('.grid');
const main = document.getElementById('main');

document.addEventListener('contextmenu', event => event.preventDefault());

const MOUSE_BUTTONS = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2
}

let COLOR_GRID = '#F6BD60';
let COLOR_OBSTACLE = '#F28482';
let COLOR_ORIGIN = '#7F5539';
let COLOR_DESTINY = '#4361EE';
let COLOR_PATH = '#3BCEAC';

const inputColorGrid = document.getElementById('colorGrid');
const inputColorObstacle = document.getElementById('colorObstacle');
const inputColorDestiny = document.getElementById('colorDestiny');
const inputColorOrigin = document.getElementById('colorOrigin');
const inputColorPath = document.getElementById('colorPath');

const GRID_WIDTH = 18;
const GRID_HEIGHT = 24;

grid.style["grid-template-columns"] = "auto ".repeat(GRID_WIDTH);

const gridMatrix = [[]];
let startPosition;
let destinyPosition;

let squareStart;
let squareDestiny;

const sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let speed = 100;

const slider = document.getElementById('slider');

slider.addEventListener('input', el => {
  speed = el.target.value;
})

const startGridMatrix = () => {
  for (let i = 0; i < GRID_HEIGHT; i++) {
    gridMatrix[i] = [];
    for (let j = 0; j < GRID_WIDTH; j++) {
      gridMatrix[i][j] = {};
    }
  }
}

startGridMatrix();

for (let i = 0; i < GRID_WIDTH * GRID_HEIGHT; i++) {
  const square = document.createElement('div');
  square.className = 'square';

  square.addEventListener('mousedown', event => {
    switch (event.button) {
      case MOUSE_BUTTONS.LEFT:
        // obstacle
        gridMatrix[Math.floor(i / GRID_WIDTH)][i % GRID_WIDTH] = { obstacle: true };
        square.style.background = COLOR_OBSTACLE;
        break;

      case MOUSE_BUTTONS.CENTER:
        // origin
        if (squareStart) {
          squareStart.style.background = COLOR_GRID;
          gridMatrix[Math.floor(startPosition / GRID_WIDTH)][startPosition % GRID_WIDTH] = null;
        } else {
          gridMatrix[Math.floor(i / GRID_WIDTH)][i % GRID_WIDTH] = { start: true };
          startPosition = i;
        }
        square.style.background = COLOR_ORIGIN;
        squareStart = square;
        break;

      case MOUSE_BUTTONS.RIGHT:
        // destiny
        if (squareDestiny) {
          squareDestiny.style.background = COLOR_GRID;
          gridMatrix[Math.floor(destinyPosition / GRID_WIDTH)][destinyPosition % GRID_WIDTH] = null;
        } else {
          gridMatrix[Math.floor(i / GRID_WIDTH)][i % GRID_WIDTH] = { destiny: true };
          destinyPosition = i;
        }
        square.style.background = COLOR_DESTINY;
        squareDestiny = square;
        break;

      default:
        break;
    }
  });

  grid.appendChild(square);
}

const squares = document.querySelectorAll('.square');

// Update the color of the squares

// Grid
inputColorGrid.addEventListener('input', el => {
  COLOR_GRID = el.target.value;
  squares.forEach((square, index) => {
    if (index !== startPosition && index !== destinyPosition && !gridMatrix[Math.floor(index / GRID_WIDTH)][index % GRID_WIDTH].obstacle) {
      square.style.background = COLOR_GRID;
    }
  });
});

// Obstacle
inputColorObstacle.addEventListener('input', el => {
  COLOR_OBSTACLE = el.target.value;
  squares.forEach((square, index) => {
    if (gridMatrix[Math.floor(index / GRID_WIDTH)][index % GRID_WIDTH].obstacle) {
      square.style.background = COLOR_OBSTACLE;
    }
  });
});

// Origin
inputColorOrigin.addEventListener('input', el => {
  COLOR_ORIGIN = el.target.value;
  if (squareStart) {
    squareStart.style.background = COLOR_ORIGIN;
  }
});

// Destiny
inputColorDestiny.addEventListener('input', el => {
  COLOR_DESTINY = el.target.value;
  if (squareDestiny) {
    squareDestiny.style.background = COLOR_DESTINY;
  }
});

// Path
inputColorPath.addEventListener('input', el => {
  COLOR_PATH = el.target.value;
});

// Graph and Vertex class
class Vertex {
  constructor({ label, visited, parent }) {
    this.label = label;
    this.visited = visited;
    this.parent = parent;
    this.cost = 0;
    this.destiny = false;
  }
}

class Graph {
  constructor({ vertices }) {
    this.vertices = vertices;
    this.adjacencyList = [[]];

    vertices.forEach((vertex, index) => {
      this.adjacencyList[index] = [];
      this.adjacencyList[index].push(vertex);
    });
  }

  addEdge = (u, v) => {
    this.adjacencyList[u].push(this.vertices[v]);
  }
}

let vertices = Array.from({ length: GRID_HEIGHT * GRID_WIDTH }, (_, i) => {
  return new Vertex({ label: i, visited: false, parent: null });
});

let g = new Graph({ vertices });

// Message element for no path
const messageElement = document.createElement('div');
messageElement.style.color = 'red';
messageElement.style.display = 'none';
document.body.appendChild(messageElement);

// Solve algorithm
const solve = async () => {
  const queue = [];
  let startIndex, destinyIndex;

  // Check for positions and add the edges
  for (let i = 0; i < GRID_HEIGHT; i++) {
    for (let j = 0; j < GRID_WIDTH; j++) {
      if (gridMatrix[i][j].start) {
        startIndex = GRID_WIDTH * i + j;
      } else if (gridMatrix[i][j].destiny) {
        destinyIndex = GRID_WIDTH * i + j;
      }

      // Add the edges in the graph
      if (j < GRID_WIDTH - 1 && !gridMatrix[i][j].obstacle && !gridMatrix[i][j + 1].obstacle) {
        g.addEdge(GRID_WIDTH * i + j, GRID_WIDTH * i + j + 1);
        g.addEdge(GRID_WIDTH * i + j + 1, GRID_WIDTH * i + j);
      }
      if (i < GRID_HEIGHT - 1 && !gridMatrix[i][j].obstacle && !gridMatrix[i + 1][j].obstacle) {
        g.addEdge(GRID_WIDTH * i + j, GRID_WIDTH * (i + 1) + j);
        g.addEdge(GRID_WIDTH * (i + 1) + j, GRID_WIDTH * i + j);
      }
    }
  }

  let current = vertices[startIndex];
  queue.push(vertices[startIndex]);
  vertices[startIndex].visited = true;

  let foundPath = false;

  // Executing the BFS algorithm
  while (queue.length > 0) {
    current = queue.shift();

    for (let i = 0; i < g.adjacencyList[current.label].length; i++) {
      let currentVertex = g.adjacencyList[current.label][i].label;
      await sleep(101 - speed);
      if (currentVertex != startIndex) {
        squares[currentVertex].style.background = 'pink';
        squares[currentVertex].classList.add('onSearch');
      }
      if (!vertices[currentVertex].visited) {
        vertices[currentVertex].visited = true;
        vertices[currentVertex].parent = current;

        // Check if we reached the destination
        if (currentVertex === destinyIndex) {
          foundPath = true;
        }

        queue.push(vertices[currentVertex]);
      }
    }
  }

  // Drawing the path if found
  if (foundPath) {
    let parent = vertices[destinyIndex];
    while (parent !== null) {
      if (!parent.destiny && parent.parent) {
        squares[parent.label].style.background = COLOR_PATH;
      }
      parent = parent.parent;
    }
    messageElement.style.display = 'none'; // Hide the message
  } else {
    // Show message if no path exists
    messageElement.textContent = "No path exists";
    messageElement.style.display = "block";
  }
}

const clearBoard = () => {
  startGridMatrix();

  vertices = Array.from({ length: GRID_HEIGHT * GRID_WIDTH }, (_, i) => {
    return new Vertex({ label: i, visited: false, parent: null });
  });

  g = new Graph({ vertices });

  squares.forEach(square => {
    square.style.background = COLOR_GRID;
    square.classList.remove('onSearch');
  });

  squareDestiny = undefined;
  squareStart = undefined;
  messageElement.style.display = 'none'; // Hide message on clear
}
