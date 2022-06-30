import express from 'express';
import { ExpressPeerServer } from 'peer';
import { Server } from 'socket.io';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Diese Funktion richtet die benötigten Einstellungen für den Socket & Peer-Server ein.
 */
export default function initSignalling(app, server) {
	// PeerJS einrichten
	const peerServer = ExpressPeerServer(app, {
		path: '/peerjs'
	});
	app.use('/signalling', peerServer);

	// Socket.io einrichten
	const io = new Server(server);
	io.on('connection', (socket) => onConnection(io, socket));

	app.use('/', express.static(__dirname + '/client'));
}

/**
 * Die Liste aller Sockets/Peers auf der Webseite
 */
const peersInRoom = new Map();

/**
 * Wird aufgerufen, wenn sich ein neuer Client per Socket.io verbindet.
 */
function onConnection(io, socket) {
	let peerId = null;

	const emitPeers = () => io.emit('peers', {
		peers: Array.from(peersInRoom.keys())
	});

	emitPeers();

	// Wenn ein neuer Nutzer die Seite aufruft und eine Peer ID erhalten hat,
	// wird dieser zur Liste der verbundenen Peers hinzugefügt. Diese Liste
	// wird bei Änderungen an alle verbundenen Nutzer gesendet.
	socket.on('join', (data) => {
		if (peerId !== null) {
			peersInRoom.delete(data.id);
		}

		peerId = data.id;
		peersInRoom.set(peerId, socket);

		// Den verbundenen Sockets wird die aktuelle Liste an
		// Peers im Anruf zugestellt.
		emitPeers();
	});

	// Wenn ein Socket disconnected, muss die Liste der Peers auch aktualisiert werden
	socket.on('disconnect', () => {
		if (peerId !== null) {
			peersInRoom.delete(peerId);

			emitPeers();
		}
	});
}
