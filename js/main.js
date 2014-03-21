$(document).ready(function()
{
    var game;
    game = OMN.init();

    $('#btn_clear').click(function()
    {
        OMN.drawBackgrounds();
        OMN.wallArray = [];
        OMN.drawState();
    });

    $('#btn_clear_path').click(function()
    {
        OMN.drawBackgrounds();
        OMN.drawState();
    });

    $('#btn_path').click(function()
    {
        OMN.drawBackgrounds();
        OMN.drawState();
        OMN.drawPath();
    });
});

var OMN;
OMN = {
    canvas: null,
    canvasWidth: 790,
    canvasHeight: 500,
    context: null,
    gridWidth: 10,
    gridHeight: 10,
    canvasTimer: null,
    wallArray: [],
    wallColor: '#000000',
    lastMoveX: null,
    lastMoveY: null,
    startSpot: function() { return this.pixelsToCoords(0, 0); },
    startColor: '#00FF00',
    endSpot: function() { return this.pixelsToCoords(this.canvasWidth-1, this.canvasHeight-1); },
    endColor: '#FF0000',

    init: function () {
        d.debug = true;

        this.createCanvas();
        this.drawGrid();

        if (this.canvas) {
            this.setupMouseEvents();
            this.drawState();
        }

        return this;
    },

    setupMouseEvents: function ()
    {
        var self = this;

        this.canvas.mousedown(function (e)
        {
            d.log("mouse down");

            self.canvasTimer = true;
            self.loop();

            var x, y;
            x = e.offsetX;
            y = e.offsetY;

            self.saveWallToArray(x, y);
        });

        this.canvas.mouseup(function ()
        {
            d.log("mouse up");

            self.canvasTimer = null;

            self.drawState();
        });

        this.canvas.mouseout(function()
        {
            if (self.canvasTimer !== null)
            {
                self.canvas.mouseup();
            }
        });

        this.canvas.click(function(e)
        {
//            var x, y;
//            x = e.offsetX;
//            y = e.offsetY;
//
//            //d.log([e.offsetX,e.offsetY]);
//            var coords = self.pixelsToCoords(x, y);
//            self.wallArray[coords] = coords;
//            self.drawState();
//
//            //self.drawBox();
            d.log(self.wallArray);
        });

        this.canvas.mousemove(function(e)
        {
            var x, y;
            x = e.offsetX;
            y = e.offsetY;

            self.saveWallToArray(x, y);
        });
    },

    matrix: [],

    createMatrix: function()
    {
        for (var i = 0; i < (this.canvasWidth/this.gridWidth); i++)
        {
            for (var j = 0; j < (this.canvasHeight/this.gridHeight); j++)
            {
                if (!this.matrix[j])
                {
                    this.matrix[j] = [];
                }

                if (this.wallArray[i] && this.wallArray[i][j])
                {
                    this.matrix[j][i] = 1;
                }
                else
                {
                    this.matrix[j][i] = 0;
                }
            }
        }
    },

    drawPath: function()
    {
        this.createMatrix();

        d.log(this.matrix);

        var grid = new PF.Grid(this.canvasWidth/this.gridWidth, this.canvasHeight/this.gridHeight, this.matrix);
        //var finder = new PF.BiAStarFinder({
        var finder = new PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true,
            heuristic: PF.Heuristic.chebyshev
        });
        var startSpot = this.startSpot();
        var endSpot = this.endSpot();
        var path = finder.findPath(startSpot.x, startSpot.y, endSpot.x, endSpot.y, grid);

        var point, delay;

        delay = 0;
        var self = this;
        for (point in path)
        {
            delay += 10;

            setTimeout(function(pathPoint)
            {
                self.drawBox(pathPoint[0]*self.gridWidth,pathPoint[1]*self.gridHeight, '#0000FF');
                self.drawStart();
                self.drawEnd();
            }, delay, path[point]);
        }

//        var newPath = PF.Util.smoothenPath(grid, path);
//        for (point in newPath)
//        {
//            delay += 100;
//            setTimeout(function(pathPoint)
//            {
//                self.drawBox(pathPoint[0]*self.gridWidth,pathPoint[1]*self.gridHeight, '#FF00FF');
//                self.drawStart();
//                self.drawEnd();
//            }, delay, newPath[point]);
//        }
    },

    saveWallToArray: function(x, y)
    {
        if (this.lastMoveX == null
        || this.lastMoveY == null)
        {
            this.lastMoveX = x;
            this.lastMoveY = y;
        }

        if (this.canvasTimer !== null)
        {
            this.interpolateLine(this.lastMoveX, this.lastMoveY, x, y)
            this.drawState();
        }

        this.lastMoveX = x;
        this.lastMoveY = y;
    },

    drawBackgrounds: function ()
    {
        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.drawGrid();
    },

    drawStart: function()
    {
        this.drawBox(this.startSpot(), this.startColor);
    },

    drawEnd: function()
    {
        this.drawBox(this.endSpot(), this.endColor);
    },

    drawWalls: function ()
    {
        var x, y;

        for (x in this.wallArray)
        {
            for (y in this.wallArray[x])
            {
                this.drawBox(this.wallArray[x][y], this.wallColor);
            }
        }
    },

    drawState: function()
    {
        this.drawBackgrounds();
        this.drawWalls();

        this.drawStart();
        this.drawEnd();
    },

    interpolateLine: function (x1, y1, x2, y2)
    {
        var lastForX, lastForY, dx, dy, x, y, pct, coords;

        for (pct = 0; pct <= 1; pct += 0.06)
        {
            dx = x2 - x1;
            dy = y2 - y1;
            x = x1 + dx * pct;
            y = y1 + dy * pct;
            if (!(x == lastForX && y == lastForY))
            {
                coords = this.pixelsToCoords(x, y);
                if (!this.wallArray[coords.x])
                {
                    this.wallArray[coords.x] = [];
                }
                this.wallArray[coords.x][coords.y] = coords;
            }
            lastForX = x;
            lastForY = y;
        }
    },

    loop: function ()
    {
        if (this.canvasTimer !== null)
        {
            this.drawState();

            var self = this;
            this.canvasTimer = setTimeout(function ()
            {
                self.loop(self);
            }, 30);
        }
        else {
            this.canvasTimer = null;
        }
    },

    pixelsToCoords: function(x, y)
    {
        return {x: Math.floor(x/this.gridWidth), y: Math.floor(y/this.gridHeight)};
    },

    coordsToPixels: function(x, y)
    {
        return {x: x*this.gridWidth, y: y*this.gridHeight};
    },

    drawGrid: function (color) {
        var context = this.context;

        for (var i = 0; i <= this.canvasWidth; i += this.gridWidth)
        {
            this.drawLine(i, 0, i, this.canvasHeight, '#cccccc');
        }

        for (var j = 0; j <= this.canvasHeight; j += this.gridHeight)
        {
            this.drawLine(0, j, this.canvasWidth, j, '#cccccc');
        }
    },

    drawBox: function ()
    {
        var color, x, y, pixels;

        switch (true)
        {
            case (typeof(arguments[0]) == "object"):
                //d.log('coordinates');
                color = arguments[1];
                pixels = this.coordsToPixels(arguments[0].x, arguments[0].y);
                break;
            case (typeof(arguments[0]) == "number"
                && typeof(arguments[1]) == "number"):
                //d.log("pixels");
                color = arguments[2];
                pixels = {x: arguments[0], y: arguments[1]};
                break;
            default:
                d.log(typeof(arguments[0]));
                return;
        }

        this.drawRect(pixels.x, pixels.y, this.gridWidth, this.gridHeight, color);
    },

    drawRect: function (x1, y1, x2, y2, color)
    {
        var context = this.context;

        color = (color ? color : '#' + Math.floor(Math.random() * 16777215).toString(16));

        context.fillStyle = color;
        context.fillRect(x1, y1, x2, y2);
    },

    drawLine: function (x1, y1, x2, y2, color)
    {
        var context = this.context;

        color = (color ? color : '#' + Math.floor(Math.random() * 16777215).toString(16));

        //d.log(color);

        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.stroke();
        context.closePath();
    },

    createCanvas: function ()
    {
        var canvas = $('<canvas/>', {})
            .attr({width: this.canvasWidth, height: this.canvasHeight});
        $('#game').css({width: '500px', height: '500px'}).append(canvas);

        if (canvas[0] && canvas[0].getContext)
        {
            var context = canvas[0].getContext('2d');
            if (context)
            {
                this.canvas = canvas;
                this.context = context;

                d.log("set up canvas and context");
                return true;
            }
        }

        return false;
    }
};

var d =
{
    debug: false,

    log: function(msg)
    {
        if (this.debug)
        {
            console.log(msg);
        }
    }
};