
<template>
    <div v-if="move_history.length > 0" class="flex-row" style="gap: 0; margin-bottom: 6px">
        <template v-for="(san, i) in move_history" :key="i">
            <NumberNode :index="i" />
            <MoveNode
                :color="move_colors[i]"
                :is_current="variation_move_index === 0 && current_move_index === i+1"
                :san
                :title="move_evaluations[i+1]"
                @click="setMoveIndex('variation_move_index', 0); setMoveIndex('current_move_index', i+1)"
            />
        </template>
    </div>
</template>

<script>
    import MoveNode from './MoveNode';
    import NumberNode from './NumberNode';

    export default {
        components: { MoveNode, NumberNode },
        inject: [
            'move_evaluations', 'move_colors', 'current_move_index', 'variation_move_index', 'move_history',
            'setMoveIndex',
        ],
    };
</script>
