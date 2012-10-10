## About

This is simple multiplayer game 'reversi'. Using this game I want to demonstrate
the way of communication with client using socket.io. Idea is to use regular
routes and controllers instead of implementing socket.io stuff manually.

If you like to use socket.io with your railwayjs app, all you need is to add

    require('rw.io');

line to your 'npmfile.js' (and of course install it `npm install rw.io socket.io`)

That's it - now you can use 'socket()' method inside your controllers. And
'socket' method in routing map.

## Install with railway@1.1.0

1. clone repo, run `npm install`
2. remove railwayjs: `rm -rf node_modules/railway`
3. get railwayjs from github, switch to branch 1.1.0
4. install railway: `npm install path-to-railway` (inside app dir)

## Run app

    node server.js

## Use app

open http://localhost:3000/ in two different browsers (we need different sessions)

## Explore

Goal of this demo app: show example of usage socket.io in railway, so, first of
all I want you to check controller: `app/controller/game_contrller.js`

It has two actions, `thegame` for http get request, `move` for socket request.
Both actions configured in routes `config/routes.js`

Idea is following: we have single method exposed to controller, called `socket`,
it used for interaction with client. When `socket()` called without params it
returns current user's pipe, so you can send messages directly to owner of
session (if he has multiple tabs with same sessionID all of them will receive
message).

If you need to communicate with another user you need to know his SessionID. It
available in `req.sessionID`.

If you need to send broadcast message... ask me, and I will expose another API,
or, better fork [tiny lib rw.io](https://github.com/1602/rw.io) and add this
API, it's pretty easy.

## Skip client-side part

Client-side part may look difficult, this is because reversi game was written
very poorly more than two years ago, and i'm too lazy to improve it.

Basically it just standard socket.io stuff:

- connect
- subscribe to particular events: `sio.on('event', listener);`
- communicate with server part: `sio.emit('event', 'data');`

If you still want to check it: 'public/javascripts/reversi.cli` is for you

