import {createApp} from './ui/app.js';

const root = document.getElementById('app');

if (!root) {
  throw new Error('App root was not found.');
}

createApp(root);
