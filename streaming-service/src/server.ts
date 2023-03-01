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

        // HINT: what happens if the JSON in the received message is formatted incorrectly?
        // HINT: see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
        try {
          let currJSON = JSON.parse(msg.toString());
          let batteryTemp = currJSON.battery_temperature;

            if (batteryTemp < 20 || batteryTemp > 80) {
              tempOutOfRangeCount++;
            }
          } catch (e) {
            console.error('Invalid JSON:', e);
            return;
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

        websocketServer.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(msg.toString());
            }
          });
    });

    socket.on('end', () => {
        console.log('Closing connection with the TCP client');
    });
    
    socket.on('error', (err) => {
        console.log('TCP client error: ', err);
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
