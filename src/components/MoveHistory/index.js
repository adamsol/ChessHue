
import MoveNode from './MoveNode.js';
import NumberNode from './NumberNode.js';

export default {
    components: { MoveNode, NumberNode },
    template: `
        <div v-if="moves.length > 0" style="display: flex; flex-wrap: wrap; align-items: baseline; margin-bottom: 6px">
            <template v-for="(san, i) in moves" :key="i">
                <NumberNode
                    :index="i"
                    :start_ply_number="start_ply_number"
                />
                <MoveNode
                    :color="colors[i]"
                    :is_current="current_index === i+1"
                    :san="san"
                    @click="$emit('click', i)"
                />
            </template>
        </div>
    `,
    props: {
        colors: { type: Array, default: () => [] },
        current_index: { type: Number, default: null },
        moves: { type: Array, required: true },
        start_ply_number: { type: Number, required: true },
    },
    emits: ['click'],
};
