
load('application');
layout('application');

if (!app.games) app.games = [];

action('thegame', function () {
    this.title = 'Reversi Game';

    // already in game
    if (session.color && session.game) {
        return ok();
    }

    // pending game (was), join opponent
    if (app.game) {
        session.color = app.game.join(req.sessionID);
        session.game = app.games.length;
        socket(app.game.starter).emit('opponent joined');
        app.games.push(app.game);
        app.game = false;
    }

    // new game, join starter
    else {
        app.game = new Game;
        session.color = app.game.join(req.sessionID);
        session.game = app.games.length;
    }

    return ok();

    function ok() {
        render({player: session.color, game: app.games[session.game] || app.game});
    }

});

action('move', function () {
    var game = app.games[session.game];
    var success = game.move(session.player, params);
    if (success) {
        var opponent = game.other(req.sessionID);
        socket(opponent).emit('move', params);
        socket().emit('wait');
        if (game.end()) {
            socket(opponent).emit('end');
            socket().emit('end');
        }
    }
});

