module.exports = function (compound) {
    var app = compound.app;
    var reversi = require(app.root + '/public/javascripts/reversi.js');

    function Game() {
        this.reversi = reversi.createGame();
    }

    Game.prototype.join = function (id) {
        if (!this.starter) {
            console.log('Starter joined', id);
            this.starter = id;
        } else {
            console.log('Opponent joined', id);
            this.opponent = id;
        }
        return this.reversi.join();
    };

    Game.prototype.state = function (player) {
        if (!this.opponent) {
            return 'wait opponent';
        } else if (this.reversi.can_player_move(player)) {
            return 'move';
        } else {
            return 'wait';
        }
    };

    Game.prototype.move = function (player, coords) {
        this.player = player;
        return this.reversi.move(coords);
    };

    Game.prototype.other = function (id) {
        return this.opponent === id ? this.starter : this.opponent;
    };

    Game.prototype.end = function () {
        return this.reversi.board.terminal_board;
    };

    Game.prototype.winner = function () {
        var s = this.reversi.board.board_stats;
        return s.b > s.w ? 'b' : 'w';
    };

    Game.prototype.boardToJSON = function () {
        return JSON.stringify(this.reversi.board.position);
    };

    compound.models.Game = Game;

};
