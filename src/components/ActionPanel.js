
export default {
    template: `
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
            <button @click="flipBoard()">
                Flip board
            </button>
            <button @click="copyFen()">
                Copy FEN
            </button>
            <button :disabled="reviewing" @click="resetMainLine()">
                Reset main line
            </button>
        </div>
    `,
    inject: [
        'move_history', 'current_move_index', 'variation_move_index', 'board_flipped',
        'move_colors', 'reviewing',
        'makeMove', 'setMoveIndex', 'updateGround',
    ],
    mounted() {
        _.addKeydownListener(event => {
            if (event.key === 'ArrowLeft') {
                this.goBackward();
            } else if (event.key === 'ArrowRight') {
                this.goForward();
            } else if (event.key === 'ArrowUp') {
                this.fastBackward();
            } else if (event.key === 'ArrowDown') {
                this.fastForward();
            } else if (event.key === 'f') {
                this.flipBoard();
            }
        });
        window.addEventListener('mousedown', event => {
            if (event.button === 3) {
                this.goBackward();
            } else if (event.button === 4) {
                this.goForward();
            }
        });
    },
    methods: {
        goBackward() {
            if (this.variation_move_index > 0) {
                this.setMoveIndex('variation_move_index', this.variation_move_index - 1);
            } else if (this.current_move_index > 0) {
                this.setMoveIndex('current_move_index', this.current_move_index - 1);
            }
        },
        goForward() {
            if (this.variation_move_index === 0 && this.current_move_index < this.move_history.length) {
                this.makeMove(this.move_history[this.current_move_index]);
            }
        },
        fastBackward() {
            if (this.variation_move_index > 0) {
                this.setMoveIndex('variation_move_index', 0);
            } else {
                this.setMoveIndex('current_move_index', 0);
            }
        },
        fastForward() {
            if (this.variation_move_index === 0) {
                this.setMoveIndex('current_move_index', this.move_history.length);
            }
        },
        flipBoard() {
            this.board_flipped = !this.board_flipped;
            this.updateGround();
        },
        copyFen() {
            navigator.clipboard.writeText(chess.fen());
        },
        resetMainLine() {
            this.move_history = chess.history();
            this.current_move_index += this.variation_move_index;
            this.variation_move_index = 0;
            this.move_colors = [];
        },
    },
};
