import '/socket.io/socket.io.js';
import '/assets/peer.min.js';

const socket = io();
const localPeer = new Peer();
const peers = new Map();
const peerRoot = document.querySelector('#peers');
const peerCounter = document.querySelector('#peer-counter');
const joinButton = document.querySelector('#join');

let status = 'offline';
let mediaStream = null;

const updatePeerCounter = (num = null) => {
	console.log('counter', num, peers.size);
	peerCounter.textContent = num === null ? peers.size : num;
};

// "Beitreten"-Button
joinButton.addEventListener('click', async () => {
	joinButton.remove();

	await getMediaStream();
	status = 'joining';
	socket.emit('join', { id: localPeer.id });
});

// Wird aufgerufen, wenn wir eine ID von PeerJS erhalten
localPeer.on('open', (id) => {
	console.info('Received PeerID:', id);

	const localIdElement = document.querySelector('#local-peer-id');
	localIdElement.textContent = id;
	localIdElement.classList.remove('hidden');

	joinButton.disabled = false;
});

// Wird aufgerufen, wenn der lokale Peer angerufen wird.
localPeer.on('call', async (call) => {
	console.info('Called by', call.peer);

	const id = call.peer;
	onNewCall(id, call);

	call.answer(await getMediaStream());
});

// Wird aufgerufen, wenn wir mit dem Signalling-Server verbunden sind
socket.on('connect', () => {
	console.info('Connected!');
});

// Wird aufgerufen, wenn wir die Verbindung zum Signalling-Server verlieren
socket.on('disconnect', () => {
	console.warn('Disconnected!');
	// Reconnection logic here...
});

/**
 * Das 'peers'-Event wird aufgerufen, wenn neue Nutzer die Webseite betreten oder verlassen.
 */
socket.on('peers', async (data) => {
	console.info('New Peers:', data.peers, '– Old Peers:', peers);

	switch (status) {
		case 'online':
			for (const [id, peer] of peers.entries()) {
				if (!data.peers.includes(id)) {
					console.info('Disconnecting', id);

					// Disconnect old peer
					disconnectPeer(id, peer);
				}
			}
			break;
		case 'joining':
			for (const peerId of data.peers) {
				// Skip own peer
				if (peerId === localPeer.id) {
					continue;
				}

				if (!peers.has(peerId)) {
					console.info('Calling', peerId);

					// Connect to new peer
					const call = localPeer.call(peerId, await getMediaStream());
					onNewCall(peerId, call);
				}
			}

			status = 'online';
			break;
	}

	updatePeerCounter(data.peers.length);
});

/**
 * Peer-Callbacks konfigurieren
 */
async function onNewCall(peerId, call) {
	// Wird aufgerufen, wenn ein MediaStream des Peers empfangen wurde
	call.on('stream', (stream) => {
		// UI-Container konfigurieren
		const elementId = 'peer-' + peerId;
		const peerElement =
			document.querySelector(`#${elementId}`) ??
			document.createElement('div');
		peerElement.id = elementId;
		peerElement.className =
			'col-span-1 relative rounded-lg overflow-hidden';

		// Video-Element konfigurieren und den MediaStream anfügen
		const video = peerElement.querySelector('video') ?? document.createElement('video');
		video.srcObject = stream;
		video.className = 'w-full';
		video.onloadedmetadata = (e) => {
			video.play();
		};

		// Auf iOS benötigt, damit Video spielt ohne in den Vollbildmodus zu gehen
		video.setAttribute('playsinline', true);

		const span =
			peerElement.querySelector('span') ?? document.createElement('span');
		span.className =
			'absolute top-0 left-0 right-0 bg-slate-700 text-center text-slate-200 opacity-40 font-mono';
		span.textContent = peerId;

		// Elemente nur anfügen, wenn sie noch nicht existieren
		if (!peerElement.hasChildNodes()) {
			peerElement.append(video);
			peerElement.append(span);
			peerRoot.append(peerElement);
		}

		peers.set(peerId, { call, stream });
	});

	call.on('close', () => {
		peers.delete(peerId);
	});
}

/**
 * Verbindung zum Peer beenden und UI-Elemente entfernen
 */
async function disconnectPeer(peerId) {
	if (!peers.has(peerId)) {
		return;
	}

	const peer = peers.get(peerId);

	// Verbindung schließen
	peer.call.close();

	// UI entfernen
	const peerElement = document.querySelector('#peer-' + peerId);
	if (peerElement) {
		peerElement.remove();
	}

	// ID von Liste der Peers entfernen
	peers.delete(peerId);
}

/**
 * Der Nutzer wird nach einem Kamera- und/oder Mikrofon-Zugriff gefragt und ein MediaStream zurückgegeben.
 * @return {MediaStream} Webcam und Mikrofon Stream
 */
async function getMediaStream() {
	if (mediaStream !== null) {
		return mediaStream;
	}

	return new Promise((resolve, reject) => {
		// Nach Zugriff fragen
		navigator.getUserMedia(
			{
				audio: true, // Mikrofon an
				video: true // Video an, mit präferierter Auflösung
			},
			(stream) => {
				// Stream cachen
				mediaStream = stream;

				// Die Kamera des lokalen Nutzers anzeigen
				const video = document.querySelector('#my-video');
				video.srcObject = stream;
				video.onloadedmetadata = (e) => {
					video.play();
				};

				resolve(mediaStream);
			},
			(err) => {
				console.error('Error getting MediaStream', err);
				alert('Fehler bei Webcam/Mikro-Zugriff');
				reject(err);
			}
		);
	});
}

