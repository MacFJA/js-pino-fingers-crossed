import { destination, symbols } from "pino";

if (typeof WeakMap === "undefined") {
	throw new ReferenceError(
		"The Javascript engine don't have the required WeakMap class available",
	);
}
/**
 * The binding key to use to enable the fingers-crossed feature
 * @type {string}
 * @readonly
 * @public
 */
export const enable = "#_fingers_crossed";

/**
 * List of method that will be forwarded to the wrapped stream
 * @typedef PassThroughStream
 * @property {import('pino').Logger['flush']} flush
 * @property {ReturnType<import('pino').destination>['flushSync']} flushSync
 * @property {import('stream').Writable['end']} end
 * @property {import('stream').Writable['emit']} emit
 */

/**
 * Create a Fingers-Crossed log stream.
 * @param {ReturnType<import('pino').transport>|import('pino').DestinationStream|ReturnType<import('pino').destination>|undefined} [transport]
 * @return {import('pino').DestinationStreamWithMetadata & PassThroughStream}
 * @public
 */
export default function (transport) {
	const stream = transport ?? destination({ dest: 1 });

	/** @type {WeakMap<WeakKey, string[]>} */
	const messagesMap = new WeakMap();

	/**
	 * Write a message to the wrapped stream
	 * @param {ReturnType<import('pino').destination>|ReturnType<import('pino').transport>|import('pino').DestinationStream } stream
	 * @param {string} message
	 * @return {void}
	 */
	function writeMessage(stream, message) {
		const toDrain = !stream.write(message);
		// This block will handle backpressure
		if (toDrain && "emit" in stream && typeof stream.emit === "function") {
			stream.emit("drain");
		}
	}

	return {
		_writableState: true,
		[symbols.needsMetadataGsym]: true,
		lastLevel: 0,
		lastTime: "",
		lastMsg: "",
		lastObj: {},
		// @ts-ignore
		lastLogger: null,
		/**
		 * @param {string} msg
		 */
		write(msg) {
			// @ts-ignore
			const { lastTime, lastMsg, lastObj, lastLogger, lastLevel } = this;
			if (
				symbols.needsMetadataGsym in stream &&
				stream[symbols.needsMetadataGsym]
			) {
				// @ts-ignore
				stream.lastLevel = lastLevel;
				// @ts-ignore
				stream.lastTime = lastTime;
				// @ts-ignore
				stream.lastMsg = lastMsg;
				// @ts-ignore
				stream.lastObj = lastObj;
				// @ts-ignore
				stream.lastLogger = lastLogger;
			}

			const chunk = JSON.parse(msg);
			const trigger = chunk[enable];
			delete chunk[enable];

			if (trigger === false || !Number.isFinite(trigger)) {
				writeMessage(stream, `${JSON.stringify(chunk)}\n`);
				return;
			}

			const messages = messagesMap.get(lastLogger) ?? [];
			messages.push(`${JSON.stringify(chunk)}\n`);
			if (chunk.level >= trigger) {
				for (const message of messages) {
					writeMessage(stream, message);
				}
				messages.splice(0);
			}

			messagesMap.set(lastLogger, messages);
		},
		emit: (eventName, args) => {
			return (
				"emit" in stream &&
				typeof stream.emit === "function" &&
				stream.emit(eventName, args)
			);
		},
		flushSync: () => {
			return (
				"flushSync" in stream &&
				typeof stream.flushSync === "function" &&
				stream.flushSync()
			);
		},
		end: (cb) => {
			return (
				"end" in stream && typeof stream.end === "function" && stream.end(cb)
			);
		},
		flush: (cb) => {
			return (
				"flush" in stream &&
				typeof stream.flush === "function" &&
				stream.flush(cb)
			);
		},
	};
}
