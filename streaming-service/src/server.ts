import net from 'net';
import { WebSocket, WebSocketServer } from 'ws';
import fs from 'fs';

const TCP_PORT = parseInt(process.env.TCP_PORT || '12000', 10);

const tcpServer = net.createServer();
const websocketServer = new WebSocketServer({ port: 8080 });

// Initialize a counter for the number of consecutive temperature readings that are out of range
let tempOutOfRangeCount = 0;

tcpServer.on('connection', (socket) => {
  console.log('TCP client connected');

  setTimeout(() => {
    tempOutOfRangeCount = 0;
  }, 5000);

  socket.on('data', (msg) => {
    console.log(msg.toString());

    let currJSON;
    try {
      currJSON = JSON.parse(msg.toString());
    } catch (e) {
      console.error('Invalid JSON:', e);
      return;
    }

    let batteryTemp = currJSON.battery && currJSON.battery.temperature;

    if (batteryTemp && (batteryTemp < 20 || batteryTemp > 80)) {
      tempOutOfRangeCount++;
    }

    // If the temperature is out of range for more than 3 consecutive readings, log an incident to a file
    if (tempOutOfRangeCount > 3) {
      const timestamp = new Date().toISOString();
      const logMessage = `${timestamp}: Battery temperature out of range for ${tempOutOfRangeCount} consecutive readings\n`;

      fs.appendFile('incidents.log', logMessage, (err) => {
        if (err) throw err;
        console.log('Incident logged to file');
      });

      tempOutOfRangeCount = 0;
    }

    // Check if the message being sent over the websocket is valid JSON before attempting to parse it
    let jsonMessage: string;
    try {
      jsonMessage = JSON.parse(msg.toString());
    } catch (e) {
      console.error('Invalid JSON:', e);
      return;
    }

    websocketServer.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(jsonMessage));
      }
    });
  });
});

websocketServer.on('listening', () => console.log('Websocket server started'));

websocketServer.on('connection', async (ws: WebSocket) => {
  console.log('Frontend websocket client connected to websocket server');
  ws.on('error', console.error);
});

tcpServer.listen(TCP_PORT, () => {
  console.log(`TCP server listening on port ${TCP_PORT}`);
});
