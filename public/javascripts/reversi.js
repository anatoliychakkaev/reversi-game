(function () {
    var $ = function (str) {
        var arr = typeof str == 'string' ? str.split(',') : str;
        arr.each = function (callback) {
            for (var i = 0, l = this.length; i < l; i++) {
                callback.apply(arr[i], [i, arr[i]]);
            }
        };
        return arr;
    };
    var s = /\s+/, undef,
    matrix = { 1: [0, 1], 2: [0, -1], 3: [1, 0], 4: [-1, 0], 5: [1, -1], 6: [1, 1], 7: [-1, -1], 8: [-1, 1] };
    function Board(position, color) {
        // boolean color (false => white, true => black)
        // default black
        this.color = ( color == undef ) ? true : color;

        this.init_position(position);
    }

    Board.prototype.init_position = function (position) {
        var point,
            i, j, w = 0, b = 0;

        this.position = position;
        this.empty_cells = [];
        this.nonempty_cells = [];

        // empty/nonempty cells and board stats
        for (i = 0; i < 8; i++) {
            for (j = 0; j < 8; j++) {
                point = {i: i, j: j};
                if (this.empty(i, j)) {
                    this.empty_cells.push(point);
                } else {
                    this.nonempty_cells.push(point);
                    if (this.position[i][j] == 'b') {
                        b++;
                    } else if (this.position[i][j] == 'w') {
                        w++;
                    }
                }
            }
        }

        if (!this.can_move()) {
            this.color = !this.color;
            if (!this.can_move()) {
                // no. game is over
                this.terminal_board = true;
            } else {
                // yep. repeat same player
                this.same_color_again = true;
            }
        }

        this.board_stats = {b: b, w: w, moves: this.availableCells.length};
    };

    Board.prototype.empty = function (i, j) {
        var c = this.position[i][j];
        return c != 'w' && c != 'b';
    };

    $('empty_cell,nonempty_cell,availableCell').each(function(i, name) {
        Board.prototype['each_' + name] = function (callback) {
            var self = this
            $(self[name + 's']).each(function (i, p) {
                callback.apply(self, [p]);
            });
        };
    });

    Board.prototype.draw = function (player) {
        return {
            player: player,
            prev_position: this.parent ? this.parent.position : undef,
            position:   this.position,
            map: {
                w: 'white', b: 'black', 0: 'empty',
                W: this.color || player == 'b' ? 'empty' : 'move_here white',
                B: !this.color || player == 'w' ? 'empty' : 'move_here black',
            },
            right_info: this.board_stats.w + ':' + this.board_stats.b,
            left_info:  this.terminal_board ?
                'Win of ' + (this.board_stats.b > this.board_stats.w ? 'blacks' : 'whites') :
                'Move of ' + (this.color ? 'blacks' : 'whites')
        };
    };

    Board.prototype.move = function (coords) {
        if (this.availableCells.length == 0) {
            return false;
        } else if (coords !== undef) {
            var can_move = false;
            this.each_availableCell(function (p) {
                if (p.i + ":" + p.j == coords) {
                    can_move = true;
                }
            });
            if (!can_move) {
                return false;
            }
        }
        if (coords === undef) {
            coords = this.ai();
        }
        if (!this.childBoards) {
            this.calcDepth(1, coords);
        }
        return this.childBoards[coords];
    };
    Board.prototype.ai = function () {
        if (this.color) {
            var variants = [];
            this.calcDepth(1);
            this.each_availableCell(function (p) {
                var pp = p.i + ':' + p.j;
                variants.push({cost: this.childBoards[pp].cost, p: pp});
            });
            variants.sort(function (x, y) {
                return -y.cost + x.cost;
            });
            return variants[0].p;
        } else {
            var i = Math.round((this.availableCells.length - 1) * Math.random());
        }
        return this.availableCells[i].i + ':' + this.availableCells[i].j;
    };
    Board.prototype.calcDepth = function (howDeep, point) {
        var self = this;
        if (!this.childBoards) {
            this.childBoards = {};
        }
        if (point) {
            var position = this.clonePosition();
            if (vectors(this.color, position, point, 'check')) {
                board = new Board(position, !this.color);
                board.parent = this;
                this.childBoards[point] = board;
                if (howDeep > 1) {
                    board.calcDepth(howDeep - 1);
                }
            }
        } else {
            this.each_availableCell(function (point) {
                var position = this.clonePosition(), board;
                if (vectors(this.color, position, point, 'check')) {
                    board = new Board(position, !this.color);
                    board.parent = this;
                    board.estimate();
                    self.childBoards[point.i + ':' + point.j] = board;
                }
            });
            if (howDeep > 1) {
                for (var c in this.childBoards) {
                    this.childBoards[c].calcDepth(howDeep - 1);
                }
            }
        }
    };
    Board.prototype.can_move = function () {
        this.availableCells = [];
        this.each_empty_cell(function (point) {
            this.position[point.i][point.j] = '0';
            if (vectors(this.color, this.position, point, 'look')) {
                this.availableCells.push(point);
            }
        });
        return this.availableCells.length;
    };
    Board.prototype.clonePosition = function () {
        var b = [], row;
        for (var i = 0; i < 8; i++) {
            row = [];
            for (var j = 0; j < 8; j++) {
                row.push(this.position[i][j]);
            }
            b.push(row);
        }
        return b;
    };
    Board.prototype.pwned_by = function (c) {
        var color = this.color ? 'b' : 'w';
        if (c) {
            return color == c || c == 'x';
        } else {
            return color;
        }
    };
    function vectors(black, board, point, action) {
        var move_state = false;
        if (typeof point == 'string') {
            point = point.split(':');
            point = {i: parseInt(point[0], 10), j: parseInt(point[1], 10)};
        }
        for (var d in matrix) {
            if (matrix.hasOwnProperty(d)) {
                if (try_vector(black, board, point, action, matrix[d], 1)) {
                    move_state = true;
                }
            }
        }
        return move_state;
    }
    function try_vector(black, board, point, action, dir, delta, move_state) {
        var color = black ? 'b' : 'w',
            opcolor = black ? 'w' : 'b',
            t_i = point.i + delta * dir[0],
            t_j = point.j + delta * dir[1], new_delta = 0;
        if (typeof move_state == 'undefined') {
            move_state = false;
        }
        if (action == 'turn' && delta >= 0) {
            board[t_i][t_j] = color;
            new_delta = delta - 1;
            if (new_delta == 0) {
                board[point.i][point.j] = color;
                return true;
            }
        } else if (action == 'check' || action == 'look') {
            if (0 <= t_i && t_i < 8 && 0 <= t_j && t_j < 8) {
                if (board[t_i][t_j] == opcolor) {
                    new_delta = delta + 1;
                } else if (board[t_i][t_j] == color && delta > 1) {
                    if (action == 'look') {
                        board[point.i][point.j] = color.toUpperCase();
                        return true;
                    }
                    move_state = true;
                    action = 'turn';
                    new_delta = delta - 1;
                }
            }
        }
        if (new_delta == 0) {
            return move_state;
        } else {
            return try_vector(black, board, point, action, dir, new_delta, move_state)
        }
    }
    var costs = [
        '15 2 4 4 4 4 2 15'.split(s),
        '2  1 3 3 3 3 1  2'.split(s),
        '4  2 3 2 2 3 2  4'.split(s),
        '4  3 2 1 1 2 3  4'.split(s),
        '4  3 2 1 1 2 3  4'.split(s),
        '4  2 3 2 2 3 2  4'.split(s),
        '2  1 3 3 3 3 1  2'.split(s),
        '15 2 4 4 4 4 2 15'.split(s)
    ];
    Board.prototype.estimate = function (color) {
        var cost = 0, m = 1, c, board = this.position, color = (this.color ? 'b' : 'w');
        this.each_nonempty_cell(function (point) {
            c = board[point.i][point.j];
            m = c == color ? 1 : -1;
            cost += parseInt(costs[point.i][point.j], 10) * m;
        });
        if (this.same_color_again) {
            cost += 40;
        }
        this.cost = cost;
    };

    function Game(player, nextStepColor, base_position, drawer, container) { // {{{
        base_position = base_position || [
            '0 0 0 0 0 0 0 0'.split(s),
            '0 0 0 0 0 0 0 0'.split(s),
            '0 0 0 0 0 0 0 0'.split(s),
            '0 0 0 w b 0 0 0'.split(s),
            '0 0 0 b w 0 0 0'.split(s),
            '0 0 0 0 0 0 0 0'.split(s),
            '0 0 0 0 0 0 0 0'.split(s),
            '0 0 0 0 0 0 0 0'.split(s)
        ];
        var lock = false;
        this.player = player;
        this.externalDrawer = drawer;
        this.container = container;

        this.start = function (nextStepColor) {
            this.boards = [];
            this.opponents = 0;
            this.board = new Board(base_position, nextStepColor);
            this.draw();
        };

        this.state = function () {
            if (this.opponents < 2) {
                return 'not enough players';
            }
            if (this.board.terminal_board) {
                return 'end';
            }
            return 'turn';
        };

        this.pwned_by = function (c) {
            if (c) {
                return this.state() == 'turn' && this.board.pwned_by(c);
            } else {
                return this.board.pwned_by();
            }
        };

        this.can_player_move = function (player) {
            var x = this.pwned_by(player);
            return x;
        };

        this.join = function () {
            if (this.opponents > 2) {
                return '0';
            }
            this.opponents = parseInt(this.opponents, 10) + 1;
            return this.opponents == 1 ? 'b' : 'w';
        };

        this.move = function (coords, skip_callback) {
            if (lock) {
                return;
            }
            var self = this;
            var board = this.board.move(coords);
            if (board) {
                this.boards.push(this.board);
                this.board = board;
                this.draw();
                if (!skip_callback && this.afterMove) {
                    this.afterMove(coords);
                }
            } else {
                console.log('Invalid move ' + coords);
                console.log(this.board.availableCells);
            }
            return !!board;
        };

        this.draw = function () {
            if (this.externalDrawer) {
                this.externalDrawer.call(this.container, this.board.draw(this.player));
            }
        };

        this.boardToJSON = function () {
            return JSON.stringify(this.board);
        }

        this.start(nextStepColor);

        // }}}
    }

    if (typeof exports == 'undefined') {
        exports = {};
    }
    exports.ReversiGame = Game;
    exports.createGame = function (db_game) {
        return new Game('w', false, null);
    };

})();
// vim:set foldmethod=marker
