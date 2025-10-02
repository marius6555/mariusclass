
// A simple event emitter for sending errors across the app
import { EventEmitter } from 'events';

class ErrorEmitter extends EventEmitter {}

export const errorEmitter = new ErrorEmitter();
