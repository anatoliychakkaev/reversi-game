
exports.routes = function (map) {
    map.root('game#thegame');
    map.socket('move', 'game#move');

    // Generic routes. Add all your routes below this line
    // feel free to remove generic routes
    map.all(':controller/:action');
    map.all(':controller/:action/:id');
};

