console.log('ohai')


var devices = [];

var http = require('http');
//var WebSocketServer = require('websocket').server;
var WebSocket = require('ws');
var wsclients = [];

// create the http server
var server = http.createServer(function(request, response) {
  // process HTTP request
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('X-Powered-By', 'doener');
  response.write('obend');
});
server.listen(1337, function() { });

// create the websocket server
var wsServer = new WebSocket.Server({
  server: server
});

wsServer.getUID = function() {
  function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
}


wsServer.on('connection', function connection(ws, request, client) {

    ws.id = wsServer.getUID();
    wsclients[ws.id] = ws;

    ws.on('message', function message(msg) {
      console.log('Received message: '+msg);
      var payload

      try {
        payload = JSON.parse(msg)
        //name already in devices list?
        if (payload.type == "faildevice") {
          if (typeof devices[payload.name] !== 'undefined') {
            console.log(payload.name+' already known')
            if (devices[payload.name].wsid != ws.id) {
              console.log(payload.name+' refreshing id')
              devices[payload.name].wsid = ws.id;
            }


            console.log(devices[payload.name])
            wsclients[devices[payload.name].wsid].send('selber penis')
          }
          else {
            //set up new device
            devices[payload.name] = []
            devices[payload.name].wsid = ws.id
            devices[payload.name].type = payload.type
            devices[payload.name].displayname = payload.name
            devices[payload.name].channels = payload.values.length
            devices[payload.name].values = payload.values

            console.log(payload.name+' added')
            console.log(devices[payload.name])
            wsclients[devices[payload.name].wsid].send('ja hallo erstmal')
            //TODO: trigger any default actions

          }
        }
      }
      catch(err) {
        console.log('JSON parse error');
      }

      //info(ws.id)


    });

    ws.on('close', function(connection) {
      console.log('disconnected')
      console.log(connection)
      // close user connection
    });
});


function setChannels(device, newvalues) {

}

function info(id) {
  console.log(wsclients)
  console.log('Clients:')
  wsServer.clients.forEach(function each(client) {
        console.log('Client.id: ' + client.id);
  });
}
