
<template>
    <span
        v-if="ply_number % 2 === 1 || index === 0"
        style="color: gray; padding: 4px"
    >
        {{ prefix }}
    </span>
</template>

<script>
    import { getMoveNumberPrefix } from '@/move';

    export default {
        inject: ['start_ply_number'],
        props: {
            index: { type: Number, required: true },
        },
        computed: {
            ply_number() {
                return this.start_ply_number + this.index;
            },
            prefix() {
                return getMoveNumberPrefix(this.ply_number);
            },
        },
    };
</script>
