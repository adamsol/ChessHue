
<template>
    <div style="display: flex; gap: 10px">
        <div class="flex-column">
            <MaterialDifferencePanel :color="board_flipped ? 'white' : 'black'" />
            <div :class="{ variation: variation_move_index > 0 }">
                <div
                    ref="chessground"
                    style="height: 0; padding-bottom: 100%; resize: horizontal; overflow: hidden"
                    :style="{ width: board_size + 'px', color: current_move_color ?? 'transparent' }"
                />
            </div>
            <MaterialDifferencePanel :color="board_flipped ? 'black' : 'white'" />
        </div>

        <div class="flex-column" style="flex-grow: 1; gap: 6px">
            <AnalysisPanel />
            <hr />
            <ChartPanel />
            <MoveHistoryPanel />
            <ActionPanel />
            <ReviewPanel />
            <hr />
            <LoadPanel />
        </div>
    </div>
</template>

<script>
    import { Chess, DEFAULT_POSITION } from 'chess.js';
    import { Chessground } from 'chessground';
    import { computed as vue_computed } from 'vue/dist/vue.esm-bundler';

    import { calculateMaterialDifference } from '@/material';
    import { getColor, gradeMove } from '@/review';

    import ActionPanel from './components/ActionPanel';
    import AnalysisPanel from './components/AnalysisPanel';
    import ChartPanel from './components/ChartPanel';
    import LoadPanel from './components/LoadPanel';
    import MaterialDifferencePanel from './components/MaterialDifferencePanel';
    import MoveHistoryPanel from './components/MoveHistoryPanel';
    import ReviewPanel from './components/ReviewPanel';

    function provideReactively({ data = {}, computed = {}, methods = {} }) {
        const names = [...Object.keys(data), ...Object.keys(computed), ...Object.keys(methods)];
        return {
            provide() {
                // https://vuejs.org/guide/components/provide-inject.html#working-with-reactivity
                return Object.fromEntries(names.map(name => [name, vue_computed({
                    get: () => this[name],
                    set: value => this[name] = value,
                })]));
            },
            data: () => data,
            computed,
            methods,
        };
    }

    const REVIEW_ESTIMATED_BRANCHING_FACTOR = 1.3;

    window.chess = new Chess();

    export default {
        components: { ActionPanel, AnalysisPanel, ChartPanel, LoadPanel, MaterialDifferencePanel, MoveHistoryPanel, ReviewPanel },
        created() {
            // This needs to be non-reactive to avoid an update loop.
            this.board_size = electron.store.get('board_size', window.innerHeight * 0.7);
        },
        async mounted() {
            this.ground = Chessground(this.$refs.chessground);

            let evaluation_callback_update_timeout;

            electron.setLiveAnalysisEvaluationCallback((engine_lines, { depth, id }) => {
                if (this.evaluation_id !== id) {
                    return;
                }
                const length = this.engine_lines.length;
                this.engine_lines = engine_lines;
                this.engine_lines.length = length;
                this.current_depth = depth;

                evaluation_callback_update_timeout ??= setTimeout(() => {
                    this.updateGround();
                    evaluation_callback_update_timeout = null;
                }, 200);
            });

            const url = await electron.getProtocolUrl();
            if (url) {
                const [pgn_or_fen, color] = url.split('/');
                this.pgn_or_fen = pgn_or_fen.replace(/_/g, ' ');
                if (color[0] === 'b') {
                    this.board_flipped = true;
                }
                this.load();
            }

            let board_resize_timeout;

            const observer = new ResizeObserver(mutations => {
                clearTimeout(board_resize_timeout);
                board_resize_timeout = setTimeout(() => {
                    this.board_size = mutations[0].contentRect.width;
                    this.updateStore('board_size');
                }, 100);
            });
            observer.observe(this.$refs.chessground);

            this.update();
        },
        mixins: [provideReactively({
            data: {
                material_difference: calculateMaterialDifference(new Chess()),

                analysis_enabled: electron.store.get('analysis_enabled', true),
                analysis_depth: electron.store.get('analysis_depth', 20),
                analysis_multipv: electron.store.get('analysis_multipv', 3),
                analysis_prevent_repetitions: electron.store.get('analysis_prevent_repetitions', false),
                engine_lines: [],
                current_depth: 0,
                evaluation_id: 0,
                hovered_line_index: null,

                pgn_or_fen: '',
                start_ply_number: 1,
                move_history: [],
                current_move_index: 0,
                variation_move_index: 0,
                board_flipped: false,

                review_depth: electron.store.get('review_depth', 12),
                auto_review: electron.store.get('auto_review', false),
                review_progress: undefined,
                move_evaluations: [],
                move_colors: [],
            },
            computed: {
                reviewing() {
                    return this.review_progress !== undefined;
                },
                current_move_color() {
                    return this.variation_move_index === 0 ? this.move_colors[this.current_move_index-1] : undefined;
                },
            },
            methods: {
                makeMove(san_or_object) {
                    const move = chess.move(san_or_object);
                    if (this.current_move_index === this.move_history.length) {
                        this.move_history.length = this.current_move_index;
                        this.move_history.push(move.san);
                        this.current_move_index += 1;
                    } else if (this.variation_move_index === 0 && move.san === this.move_history[this.current_move_index]) {
                        this.current_move_index += 1;
                    } else {
                        this.variation_move_index += 1;
                    }
                    this.playSound(move.san);
                    this.update();
                },
                setMoveIndex(name, new_value) {
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
                load() {
                    try {
                        chess.loadPgn(this.pgn_or_fen);
                    } catch (e1) {
                        try {
                            chess.load(this.pgn_or_fen);
                        } catch (e2) {
                            console.error(e1);
                            console.error(e2);
                        }
                    }
                    this.move_history = chess.history();
                    this.current_move_index = 0;
                    this.variation_move_index = 0;
                    this.move_evaluations = [];
                    this.move_colors = [];

                    while (chess.undo()) {}
                    this.start_ply_number = chess.moveNumber() * 2 - (chess.turn() === 'w' ? 1 : 0);

                    this.update();

                    if (this.auto_review) {
                        this.runReview();
                    }
                },
                async runReview() {
                    if (this.move_history.length === 0 || this.review_depth <= 0) {
                        return;
                    }
                    this.review_progress = [0, this.move_history.length + 1];

                    const review_chess = new Chess();
                    review_chess.load(chess.header().FEN ?? DEFAULT_POSITION);
                    for (const san of this.move_history) {
                        review_chess.move(san);
                    }
                    const options = { depth: this.review_depth };

                    electron.setMoveClassificationEvaluationCallback((engine_lines, { depth }) => {
                        if (!this.reviewing) {
                            return;
                        }
                        this.review_progress[0] = Math.floor(this.review_progress[0]) + 0.999 / Math.pow(REVIEW_ESTIMATED_BRANCHING_FACTOR, options.depth - depth);
                    });

                    let engine_lines = await electron.evaluateForMoveClassification(review_chess.fen(), options);
                    if (!this.reviewing) {
                        return;
                    }
                    this.review_progress[0] = 1;

                    const evaluations = [];
                    const colors = [];

                    // Running the analysis backwards (starting from the last move) seems to make engine evaluations more consistent,
                    // especially when tricky sacrifices are concerned.
                    // https://lichess.org/forum/general-chess-discussion/why-does-sf-analysis-start-in-the-end-game
                    let move;
                    while (move = review_chess.undo()) {
                        const prev_engine_lines = await electron.evaluateForMoveClassification(review_chess.fen(), options);
                        if (!this.reviewing) {
                            return;
                        }
                        evaluations.push(engine_lines[0]?.score);
                        const grade = gradeMove(move, prev_engine_lines[0], engine_lines[0]);
                        colors.push(getColor(grade));
                        this.review_progress[0] = Math.floor(this.review_progress[0]) + 1;

                        engine_lines = prev_engine_lines;
                    }
                    this.move_evaluations = [...evaluations, engine_lines[0]?.score].reverse();
                    this.move_colors = colors.reverse();
                    this.updateGround();

                    await new Promise(r => setTimeout(r, 100));
                    this.review_progress = undefined;
                },
                abortReview() {
                    electron.evaluateForMoveClassification('', { depth: 0 });
                    this.review_progress = undefined;
                },
                updateEvaluation() {
                    this.engine_lines = new Array(this.analysis_multipv);
                    this.current_depth = 0;
                    this.hovered_line_index = null;

                    electron.evaluateForLiveAnalysis(chess.fen(), {
                        depth: this.analysis_enabled ? this.analysis_depth : 0,
                        multipv: this.analysis_multipv,
                        prevent_repetitions: this.analysis_prevent_repetitions,
                        id: ++this.evaluation_id,
                    });
                },
                updateGround() {
                    const color = chess.turn() === 'w' ? 'white' : 'black';
                    const last_move = chess.history({ verbose: true }).at(-1);

                    const dests = new Map();
                    for (const move of chess.moves({ verbose: true })) {
                        dests.set(move.from, [...dests.get(move.from) ?? [], move.to]);
                    }

                    const lines = this.hovered_line_index === null ?
                        this.engine_lines.filter(x => x) :
                        [{ score: '0', move: this.engine_lines[this.hovered_line_index].move }]
                    ;
                    const getArrowScale = line => {
                        return Math.max(1 - gradeMove(line.move, lines[0], line), 0);
                    };

                    // https://github.com/lichess-org/chessground/blob/v8.3.7/src/state.ts
                    // https://github.com/lichess-org/chessground/blob/v8.3.7/src/draw.ts
                    this.ground.set({
                        fen: chess.fen(),
                        orientation: this.board_flipped ? 'black' : 'white',
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
                            autoShapes: [
                                // Best move arrows
                                ...lines.map((line, i) => ({
                                    orig: line.move.from,
                                    dest: line.move.to,
                                    brush: i === 0 ? 'paleBlue' : 'paleGrey',
                                    modifiers: { lineWidth: 15 * getArrowScale(line) },
                                })).filter(obj => obj.modifiers.lineWidth >= 0.5),  // Values smaller than 0.5 are rounded to 0 and considered unset, defaulting to 15.

                                // Best move promotion annotations
                                ...lines.filter(line => line.move.promotion).map(line => ({
                                    orig: line.move.to,
                                    piece: {
                                        role: { q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[line.move.promotion],
                                        color,
                                        scale: getArrowScale(line),
                                    },
                                })),

                                // Review annotations
                                // https://github.com/lichess-org/chessground/issues/165
                                ...this.current_move_color ? [{
                                    orig: last_move.to,
                                    customSvg: `
                                        <g class="annotation">
                                            <circle fill="${this.current_move_color}" cx="50" cy="50" r="50" stroke="#fff" stroke-width="5" />
                                        </g>
                                    `,
                                }] : [],
                            ],
                            shapes: this.ground.state.drawable.shapes,
                        },
                        animation: {
                            duration: 100,
                        },
                        events: {
                            move: (from, to) => {
                                // TODO: promotion selector
                                this.makeMove({ from, to, promotion: 'q' });
                            },
                            select() {
                                document.activeElement.blur();
                            },
                        },
                    });
                },
                async playSound(san) {
                    let name;
                    if (san.includes('x')) {
                        name = 'capture';
                    } else {
                        name = 'move';
                    }
                    const sound_module = await import(`@/assets/sound/${name}.mp3`);
                    const audio = new Audio(sound_module.default);
                    audio.volume = 0.7;
                    await audio.play();
                },
                update() {
                    this.updateEvaluation();
                    this.updateGround();
                    this.material_difference = calculateMaterialDifference(chess);
                },
                updateStore(name) {
                    electron.store.set(name, this[name]);
                },
            },
        })],
    };
</script>
