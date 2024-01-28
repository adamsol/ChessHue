
export default {
    template: `
        <div class="flex-row" style="column-gap: 12px">
            <div class="flex-row">
                Depth:
                <span style="width: 20px">
                    {{ current_depth }}
                </span>
                /
                <input
                    v-model="analysis_depth"
                    type="number"
                    step="2"
                    min="2"
                    @change="updateEvaluation(); updateStore('analysis_depth')"
                />
            </div>
            <div class="flex-row">
                Number of lines:
                <input
                    v-model="analysis_multipv"
                    type="number"
                    step="1"
                    min="1"
                    @change="updateEvaluation(); updateStore('analysis_multipv')"
                />
            </div>
            <label>
                <input
                    v-model="analysis_prevent_repetitions"
                    type="checkbox"
                    @change="updateEvaluation(); updateStore('analysis_prevent_repetitions')"
                />
                Prevent repetitions
            </label>
        </div>
        <div v-for="line in engine_lines" style="height: 20px">
            <div
                v-if="line"
                style="cursor: pointer; user-select: none"
                @mouseover="hovered_move = line.move; updateGround()"
                @mouseleave="hovered_move = null; updateGround()"
                @click="hovered_move = null; makeMove(line.move)"
            >
                {{ line.score }} | {{ line.move.san }}
            </div>
        </div>
    `,
    inject: [
        'analysis_depth', 'analysis_multipv', 'analysis_prevent_repetitions',
        'current_depth', 'engine_lines', 'hovered_move',
        'makeMove', 'updateEvaluation', 'updateStore', 'updateGround',
    ],
    mounted() {
        _.addKeydownListener(event => {
            if (/^\d$/.test(event.key)) {
                const line = this.engine_lines[+event.key - 1];
                if (line) {
                    this.makeMove(line.move.san);
                }
            }
        });
    },
};
