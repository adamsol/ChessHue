
import { Chess, DEFAULT_POSITION } from '../node_modules/chess.js/dist/esm/chess.js';
import Chessground from '../node_modules/chessground/index.js';
import { createApp } from '../node_modules/vue/dist/vue.esm-browser.js';

import { gradeMove } from './review.js';

const app = createApp({
    template: `
        <div style="display: flex; gap: 10px">
            <div :class="[strayed_off_game > 0 ? 'strayed-off-game' : '', current_move_color]">
                <div ref="chessground" style="width: 900px; height: 0; padding-bottom: 100%; resize: horizontal; overflow: hidden" />
            </div>

            <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px">
                <div class="flex-row">
                    Number of lines:
                    <input v-model="analysis_multipv" type="number" step="1" min="1" @change="updateEvaluation" />
                </div>
                <div class="flex-row">
                    Depth:
                    {{ current_depth }}
                    /
                    <input v-model="analysis_depth" type="number" step="2" min="2" @change="updateEvaluation" />
                </div>
                <div v-for="line in engine_lines">
                    <template v-if="line">
                        {{ line.score }} | {{ line.move }}
                    </template>
                    &nbsp;
                </div>
                <hr />
                <div v-if="move_history.length > 0" style="display: flex; flex-wrap: wrap; align-items: baseline; margin-bottom: 6px">                    
                    <span v-if="start_ply_number % 2 === 0" style="color: gray; padding: 4px">
                        {{ start_ply_number / 2 }}...
                    </span>
                    <template v-for="(san, i) in move_history">
                        <span v-if="(start_ply_number + i) % 2 === 1" style="color: gray; padding: 4px">
                            {{ (start_ply_number + i + 1) / 2 }}.
                        </span>
                        <span
                            style="font-weight: bold; cursor: pointer"
                            :style="{
                                'color': move_colors[i],
                                'border': strayed_off_game === 0 && current_move === i+1 ? '2px solid currentColor' : '2px solid transparent',
                                'border-radius': '4px',
                                'padding': '2px',
                            }"
                            @click="setIndex('strayed_off_game', 0); setIndex('current_move', i+1)"
                        >
                            {{ san }}
                        </span>
                    </template>
                </div>
                <div class="flex-row">
                    <button @click="fastBackward()">
                        &lt;&lt;
                    </button>
                    <button @click="goBackward()">
                        &lt;
                    </button>
                    <button @click="goForward()">
                        &gt;
                    </button>
                    <button @click="fastForward()">
                        &gt;&gt;
                    </button>
                    <button @click="flip()">
                        Flip board
                    </button>
                    <button @click="copyFen">
                        Copy FEN
                    </button>
                    <button :disabled="reviewing" @click="resetMainLine()">
                        Reset main line
                    </button>
                </div>
                <div class="flex-row">
                    <button :disabled="reviewing" @click="review()">
                        Review
                    </button>
                    Depth:
                    <input v-model="review_depth" type="number" step="2" min="2" />
                </div>
                <div v-if="reviewing">
                    <progress :max="move_history.length" :value="review_progress" style="width: 100%" />
                </div>
                <hr />
                <div>
                    <textarea
                        v-model.trim="pgn_or_fen"
                        rows="10"
                        placeholder="PGN or FEN"
                        spellcheck="false"
                        style="font-family: inherit; width: 100%; resize: vertical"
                    />
                    <div class="flex-row">
                        <button :disabled="reviewing" @click="load()">
                            Load
                        </button>
                        <button :disabled="reviewing" @click="load(); review()">
                            Load & review
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data: () => ({
        analysis_multipv: 3,
        analysis_depth: 20,
        engine_lines: [],
        current_depth: 0,

        pgn_or_fen: '',
        start_ply_number: 1,
        move_history: [],
        current_move: 0,
        strayed_off_game: 0,

        review_depth: 12,
        review_progress: undefined,
        move_colors: [],
    }),
    computed: {
        reviewing() {
            return this.review_progress !== undefined;
        },
        current_move_color() {
            return this.strayed_off_game === 0 ? this.move_colors[this.current_move-1] : undefined;
        },
    },
    async mounted() {
        window.electron.setEvaluationCallback((engine_lines, depth) => {
            const length = app.$data.engine_lines.length;
            app.$data.engine_lines = engine_lines;
            app.$data.engine_lines.length = length;

            app.$data.current_depth = depth;
        });
        window.addEventListener('keydown', event => {
            if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
                return;
            }
            if (event.key === 'ArrowLeft') {
                this.goBackward();
            } else if (event.key === 'ArrowRight') {
                this.goForward();
            } else if (event.key === 'ArrowUp') {
                this.fastBackward();
            } else if (event.key === 'ArrowDown') {
                this.fastForward();
            } else if (event.key === 'f') {
                this.flip();
            }
        });
        const url = await window.electron.getProtocolUrl();
        if (url) {
            const [pgn_or_fen, color] = url.split('/');
            this.pgn_or_fen = pgn_or_fen;
            if (color[0] === 'b') {
                this.flip();
            }
            this.load();
        }
    },
    methods: {
        setIndex(name, new_value) {
            const prev_value = this[name];
            this[name] = new_value;

            if (new_value > prev_value) {
                for (let i = prev_value; i < new_value; ++i) {
                    chess.move(this.move_history[i]);
                }
                this.update();
            } else if (new_value < prev_value) {
                for (let i = prev_value; i > new_value; --i) {
                    chess.undo();
                }
                this.update();
            }
        },
        goBackward() {
            if (this.strayed_off_game > 0) {
                this.setIndex('strayed_off_game', this.strayed_off_game - 1);
            } else if (this.current_move > 0) {
                this.setIndex('current_move', this.current_move - 1);
            }
        },
        goForward() {
            if (this.strayed_off_game === 0 && this.current_move < this.move_history.length) {
                this.playSound(this.move_history[this.current_move]);
                this.setIndex('current_move', this.current_move + 1);
            }
        },
        fastBackward() {
            if (this.strayed_off_game > 0) {
                this.setIndex('strayed_off_game', 0);
            } else {
                this.setIndex('current_move', 0);
            }
        },
        fastForward() {
            if (this.strayed_off_game === 0) {
                this.setIndex('current_move', this.move_history.length);
            }
        },
        flip() {
            flipped = !flipped;
            this.updateGround();
        },
        copyFen() {
            navigator.clipboard.writeText(chess.fen());
        },
        resetMainLine() {
            this.move_history = chess.history();
            this.current_move += this.strayed_off_game;
            this.strayed_off_game = 0;
            this.move_colors = [];
        },
        load() {
            if (this.pgn_or_fen.startsWith('[') || !this.pgn_or_fen.includes('/')) {
                chess.loadPgn(this.pgn_or_fen);
            } else {
                chess.load(this.pgn_or_fen);
            }
            this.move_history = chess.history();
            this.current_move = 0;
            this.strayed_off_game = 0;
            this.move_colors = [];

            while (chess.undo()) {}
            this.start_ply_number = chess.moveNumber() * 2 - (chess.turn() === 'w' ? 1 : 0);

            this.update();
        },
        async review() {
            this.review_progress = 0;

            const review_chess = new Chess();
            review_chess.load(chess.header().FEN ?? DEFAULT_POSITION);
            for (const san of this.move_history) {
                review_chess.move(san);
            }
            const options = { depth: this.review_depth };
            let engine_lines = await window.electron.evaluateForMoveClassification(review_chess.fen(), options);

            const colors = [];

            // Running the analysis backwards (starting from the last move) seems to make engine evaluations more consistent,
            // especially when tricky sacrifices are concerned.
            // https://lichess.org/forum/general-chess-discussion/why-does-sf-analysis-start-in-the-end-game
            let move;
            while (move = review_chess.undo()) {
                const prev_engine_lines = await window.electron.evaluateForMoveClassification(review_chess.fen(), options);

                colors.push(gradeMove(move, prev_engine_lines[0], engine_lines[0]));
                this.review_progress += 1;

                console.log(review_chess.moveNumber(), move.san, [...prev_engine_lines], [...engine_lines], colors.at(-1));

                engine_lines = prev_engine_lines;
            }
            this.move_colors = colors.reverse();
            this.updateGround();

            await new Promise(r => setTimeout(r, 100));
            this.review_progress = undefined;
        },
        updateEvaluation() {
            this.engine_lines = new Array(this.analysis_multipv);
            this.current_depth = 0;

            window.electron.evaluateForLiveAnalysis(chess.fen(), { depth: this.analysis_depth, multipv: this.analysis_multipv });
        },
        updateGround() {
            const color = chess.turn() === 'w' ? 'white' : 'black';
            const last_move = chess.history({ verbose: true }).at(-1);

            const dests = new Map();
            for (const move of chess.moves({ verbose: true })) {
                dests.set(move.from, [...dests.get(move.from) ?? [], move.to]);
            }

            // https://github.com/lichess-org/chessground/blob/v8.3.7/src/state.ts
            ground.set({
                fen: chess.fen(),
                orientation: flipped ? 'black' : 'white',
                turnColor: color,
                lastMove: last_move && [last_move.from, last_move.to],
                movable: {
                    free: false,
                    color,
                    dests,
                },
                selectable: {
                    enabled: false,
                },
                drawable: {
                    // https://github.com/lichess-org/chessground/issues/165
                    autoShapes: this.current_move_color ? [{
                        orig: last_move.to,
                        customSvg: `
                            <g class="annotation">
                                <circle fill="${this.current_move_color}" cx="50" cy="50" r="50" stroke="#fff" stroke-width="5" />
                            </g>
                        `,
                    }] : [],
                },
                animation: {
                    duration: 100,
                },
                events: {
                    move: (from, to) => {
                        // TODO: promotion selector
                        const move = chess.move({ from, to, promotion: 'q' });
                        if (this.current_move === this.move_history.length) {
                            this.move_history.length = this.current_move;
                            this.move_history.push(move.san);
                            this.current_move += 1;
                        } else if (this.strayed_off_game === 0 && move.san === this.move_history[this.current_move]) {
                            this.current_move += 1;
                        } else {
                            this.strayed_off_game += 1;
                        }
                        this.playSound(move.san);
                        this.update();
                    },
                },
            });
        },
        playSound(san) {
            let name;
            if (san.includes('x')) {
                name = 'capture';
            } else {
                name = 'move';
            }
            new Audio(`../assets/sound/${name}.mp3`).play();
        },
        update() {
            this.updateEvaluation();
            this.updateGround();
        },
    },
}).mount('#app');

const chess = new Chess();
const ground = Chessground(app.$refs.chessground);
let flipped = false;

app.update();