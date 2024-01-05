
const { spawn } = require('child_process');
const { EOL } = require('os');
const path = require('path');

const { Chess } = require('chess.js');

class Engine {
    constructor(filepath, callback) {
        this.process = spawn(path.resolve(__dirname, filepath));
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
            if (depth === 0) {
                // Checkmate or stalemate.
                this.resolve();
                return;
            }
            const score_pos = cmd.indexOf('score');
            if (score_pos === -1) {
                return;
            }
            const score_type = cmd[score_pos+1];
            const score_value = cmd[score_pos+2] * (this.chess.turn() === 'w' ? 1 : -1);
            const score = score_type === 'mate' ? 'M' + score_value : (Math.trunc(score_value / 10) / 10).toFixed(1);

            // Sometimes, despite the `ready_counter` variable, a stray line concerning the previous position is received.
            try {
                const move = this.chess.move(cmd[cmd.indexOf('pv')+1]).san;
                this.chess.undo();

                this.engine_lines[cmd[cmd.indexOf('multipv')+1]-1] = { score, move };
                callback?.([...this.engine_lines], depth);
            } catch {}
        }
        if (cmd[0] === 'bestmove') {
            this.resolve();
        }
    }

    async evaluate(fen, { multipv = 1, depth = 20 } = {}) {
        this.chess = new Chess(fen);
        this.engine_lines = [];

        this.ready_counter += 1;
        this._write('stop');
        this._write('isready');

        this._write('position fen ' + fen);
        this._write('setoption name MultiPV value ' + multipv);
        this._write('go depth ' + depth);

        await new Promise(resolve => this.resolve = resolve);
        return [...this.engine_lines];
    }
}

module.exports = { Engine };
