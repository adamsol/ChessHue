
<template>
    <div class="flex-row" style="column-gap: 12px">
        <label>
            <input
                v-model="analysis_enabled"
                type="checkbox"
                title="Toggle engine evaluation"
                @change="updateEvaluation(); updateStore('analysis_enabled')"
            />
        </label>
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
    <div v-if="analysis_enabled" class="flex-column" style="align-items: start">
        <div v-for="(line, i) in engine_lines" style="height: 28px">
            <div
                v-if="line"
                style="cursor: pointer; user-select: none; padding: 4px; border-radius: 4px"
                :style="{ background: hovered_line_index === i ? '#fff2' : 'none' }"
                @mouseover="hovered_line_index = i; updateGround()"
                @mouseleave="hovered_line_index = null; updateGround()"
                @click="hovered_line_index = null; makeMove(line.move)"
            >
                {{ line.score }} | {{ line.move.san }}
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        inject: [
            'analysis_enabled', 'analysis_depth', 'analysis_multipv', 'analysis_prevent_repetitions',
            'current_depth', 'engine_lines', 'hovered_line_index',
            'makeMove', 'updateEvaluation', 'updateStore', 'updateGround',
        ],
        mounted() {
            _.addKeydownListener(event => {
                let index;
                if (event.key === ' ') {
                    index = 0;
                } else if (/^\d$/.test(event.key)) {
                    index = +event.key - 1;
                }
                if (index !== undefined) {
                    const line = this.engine_lines[index];
                    if (line) {
                        this.makeMove(line.move.san);
                    }
                }
            });
        },
    };
</script>
