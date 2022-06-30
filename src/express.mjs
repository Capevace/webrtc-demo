import express from 'express';
import https from 'https';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const app = express();
export const server = https.createServer(
	{ 
		key: fs.readFileSync(`${__dirname}/certs/server.key`, { encoding: 'utf8' }),
		cert: fs.readFileSync(`${__dirname}/certs/server.cert`, { encoding: 'utf8' })
	}, 
	app
);
