
import { spawn } from 'child_process';
import { EOL } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import { Chess } from 'chess.js';

import { generateRepetition } from './repetition.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Engine {
    constructor(callback) {
        this.process = spawn(path.resolve(__dirname, '../engine.exe'));
        this.process.stdout.setEncoding('utf8');
        this.process.stdout.on('data', buffer => {
            for (const line of buffer.split(/\r?\n/g)) {
                this._process(line, callback);
            }
        });
        this.ready_counter = 0;
    }

    _write(line) {
        this.process.stdin.write(line + EOL);
    }

    _process(line, callback) {
        const cmd = line.split(' ');

        if (cmd[0] === 'readyok') {
            this.ready_counter -= 1;
        }
        if (cmd[0] === 'info') {
            if (this.ready_counter > 0) {
                return;
            }
            const depth = +cmd[cmd.indexOf('depth')+1];
            const score_pos = cmd.indexOf('score');
            if (score_pos === -1) {
                return;
            }
            const score_type = cmd[score_pos+1];
            const score_value = cmd[score_pos+2] * (this.chess.turn() === 'w' ? 1 : -1);
            const score = score_type === 'mate' ? 'M' + score_value : (Math.trunc(score_value / 10) / 10).toFixed(1);

            // Sometimes, despite the `ready_counter` variable, a stray line concerning the previous position is received.
            try {
                const move = this.chess.move(cmd[cmd.indexOf('pv')+1]);
                this.chess.undo();

                this.engine_lines[cmd[cmd.indexOf('multipv')+1]-1] = { score, move };
                callback?.([...this.engine_lines], { depth, id: this.id });
            } catch {}
        }
        if (cmd[0] === 'bestmove') {
            this.resolve();
        }
    }

    async evaluate(fen, { depth = 20, multipv = 1, prevent_repetitions = false, id } = {}) {
        this._write('stop');
        if (depth <= 0 || multipv <= 0) {
            return [];
        }
        this.chess = new Chess(fen);
        if (this.chess.isCheckmate()) {
            return [{ score: 'M' + (this.chess.turn() === 'w' ? '-' : '') + '0' }];
        } else if (this.chess.isStalemate()) {
            return [{ score: '0.0' }];
        }
        this.engine_lines = [];
        this.id = id;
        this.ready_counter += 1;
        this._write('isready');

        let extra_moves_cmd = '';
        if (prevent_repetitions) {
            // An old discussion, for reference: https://github.com/official-stockfish/Stockfish/issues/948
            const repetition = generateRepetition(this.chess);
            if (repetition) {
                extra_moves_cmd = ' moves ' + repetition.join(' ');
            }
        }
        this._write('position fen ' + fen + extra_moves_cmd);
        this._write('setoption name MultiPV value ' + multipv);
        this._write('go depth ' + depth);

        await new Promise(resolve => this.resolve = resolve);
        return [...this.engine_lines];
    }
}
