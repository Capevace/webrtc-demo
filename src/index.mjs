import { app, server } from './express.mjs';
import initSignalling from './signalling.mjs';

// Signalling konfigurieren
initSignalling(app, server);

// Server starten
server.listen(3000, () =>
	console.log('Der Server ist auf https://localhost:3000 erreichbar.')
);
