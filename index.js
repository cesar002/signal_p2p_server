const WebSocket = require('ws');

const PORT  = 3002;
const wss = new WebSocket.Server({ port: 3002 });
const peers = new Map(); 

const getClients = async () => { 
    const clients = Array.from(peers.keys());
    return clients;
}

// descubirmiento de nodos 
const broadcastConnectedClients = async () => {
    const clients = await getClients();
    clients.forEach(clientId => {
        const ws = peers.get(clientId);
        if (ws) {
            ws.send(JSON.stringify({ type: 'ConnectedClients', clients: clients }));
        }
    });
}

wss.on('connection', async (ws) => {
    const id = crypto.randomUUID();
    console.log(`${id} Conectado`);
    peers.set(id, ws);

    ws.send(JSON.stringify({ type: 'Connected', id }));
    await broadcastConnectedClients();

    // Escuchar mensajes de este cliente
    ws.on('message', (message) => {
        try {
        const messageFormatted = message.toString();
        const data = JSON.parse(messageFormatted);
        console.log(data);

        // El mensaje debe tener a qué peer va
        const target = peers.get(data.to);
        if (target) {
            target.send(JSON.stringify({ 
                peerData: {...data?.peerData}, 
                type: data?.type || data?.peerData?.type, 
                from: id, 
                to: data.to,
                data: data?.data || {},
            }));
        }

        } catch (err) {
        console.error('Error handling message:', err);
        }
    });

    ws.on('close', async () => {
        peers.delete(id);
        await broadcastConnectedClients();
        console.log(id+' Desconectado');
    });
});


console.log('Servidor de señalización WebSocket iniciado en ws://localhost:'+PORT);
