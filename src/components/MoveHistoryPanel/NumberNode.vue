
<template>
    <span>
        <span v-if="(start_ply_number + index) % 2 === 1" :style>
            {{ (start_ply_number + index + 1) / 2 }}.
        </span>
        <span v-else-if="index === 0" :style>
            {{ start_ply_number / 2 }}...
        </span>
    </span>
</template>

<script>
    export default {
        inject: ['start_ply_number'],
        props: {
            index: { type: Number, required: true },
        },
        emits: ['click'],
        data: () => ({
            style: { color: 'gray', padding: '4px' },
        }),
    };
</script>
