
export default {
    template: `
        <span>
            <span v-if="(start_ply_number + index) % 2 === 1" :style="style">
                {{ (start_ply_number + index + 1) / 2 }}.
            </span>
            <span v-else-if="index === 0" :style="style">
                {{ start_ply_number / 2 }}...
            </span>
        </span>
    `,
    props: {
        index: { type: Number, required: true },
        start_ply_number: { type: Number, required: true },
    },
    emits: ['click'],
    data: () => ({
        style: { color: 'gray', padding: '4px' },
    }),
};
