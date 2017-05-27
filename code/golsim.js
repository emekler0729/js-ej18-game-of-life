/**
 * Created by Eduard on 5/21/2017.
 */
var state = {
    'live': true,
    'dead': false
};

function randomSeed(width, height) {
    var seed = [];

    for(var h = 0; h < height; h++) {
        var row = [];

        for(var w = 0; w < width; w++) {
            if(Math.random() < 0.5) {
                row.push(state.dead)
            } else {
                row.push(state.live);
            }
        }

        seed.push(row);
    }

    return seed;
}

function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.prototype.plus = function(other) {
    return new Vector(this.x + other.x, this.y + other.y);
};

var directions = {
    'n':  new Vector( 0, -1),
    'ne': new Vector( 1, -1),
    'e':  new Vector( 1,  0),
    'se': new Vector( 1,  1),
    's':  new Vector( 0,  1),
    'sw': new Vector(-1,  1),
    'w':  new Vector(-1,  0),
    'nw': new Vector(-1, -1)
};

var directionNames = 'n ne e se s sw w nw'.split(' ');

function Grid(width, height) {
    this.space = new Array(width * height);
    this.width = width;
    this.height = height;
}

Grid.prototype.set = function(vector, value) {
    this.space[vector.x + (vector.y * this.width)] = value;
};

Grid.prototype.get = function(vector) {
    return this.space[vector.x + (vector.y * this.width)];
};

Grid.prototype.forEach = function(f, context) {
    for(var y = 0; y < this.height; y++) {
        for(var x = 0; x < this.width; x++) {
            var cell = this.space[x + (y * this.width)];

            if(cell != null) {
                f.call(context, cell, new Vector(x, y));
            }
        }
    }
};

Grid.prototype.isInside = function(vector) {
    return vector.x >= 0 && vector.x < this.width &&
            vector.y >= 0 && vector.y < this.height;
};

function Actor(initialState) {
    this.element = document.createElement('input');
    this.element.type = 'checkbox';
    this.element.checked = initialState;
}

Object.defineProperty(Actor.prototype, 'state', {
    get: function() {return this.element.checked;}
});

Actor.prototype.act = function(view) {
    var liveNeighbors = view.findAll(state.live).length;

    if(this.state == state.live) {
        if(liveNeighbors < 2 || liveNeighbors > 3) {
            return new Actor(state.dead)
        } else {
            return new Actor(state.live);
        }
    } else {
        if(liveNeighbors == 3) {
            return new Actor(state.live);
        } else {
            return this;
        }
    }
};

function View(simulation, vector) {
    this.simulation = simulation;
    this.vector = vector;
}

View.prototype.look = function(direction) {
    var destination = this.vector.plus(directions[direction]);
    if(this.simulation.grid.isInside(destination)) {
        return this.simulation.grid.get(destination);
    }
};

View.prototype.findAll = function(state) {
    var results = [];

    directionNames.forEach(function(direction) {
        var neighbor = this.look(direction);
        if(neighbor) {
            results.push(neighbor);
        }
    }, this);

    if(state) {
        results = results.filter(function(result) {
            return result.state == state;
        });
    }

    return results;
};

function Simulation(seed, canvasId) {
    var self = this;
    this.grid = new Grid(seed[0].length, seed.length);
    this.canvas = document.getElementById(canvasId);

    seed.forEach(function(row, y) {
        row.forEach(function(initialValue, x) {
            this.grid.set(new Vector(x, y), new Actor(initialValue));
        }, this);
    }, this);

    this.draw();

    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Next Generation';
    button.addEventListener('click', function() {
        self.turn.call(self);
    });
    document.body.appendChild(button);
}

Simulation.prototype.draw = function() {
    var newDiv = document.createElement('div');
    newDiv.id = this.canvas.id;
    document.body.replaceChild(newDiv, this.canvas);
    this.canvas = newDiv;

    this.grid.forEach(function(actor, pos) {
        if(pos.x == 0 && pos.y > 0) {
            this.canvas.appendChild(document.createElement('br'));
        }

        this.canvas.appendChild(actor.element);
    }, this)
};

Simulation.prototype.turn = function() {
    var newGrid = new Grid(this.grid.width, this.grid.height);

    this.grid.forEach(function(actor, pos) {
        newGrid.set(pos, actor.act(new View(this, pos)));
    }, this);

    this.grid = newGrid;
    this.draw();
};