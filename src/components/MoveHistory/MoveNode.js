
export default {
    template: `
        <span
            style="font-weight: bold; cursor: pointer"
            :style="{
                'color': color,
                'border': is_current ? '2px solid currentColor' : '2px solid transparent',
                'border-radius': '4px',
                'padding': '2px',
            }"
            @click="$emit('click')"
        >
            {{ san }}
        </span>
    `,
    props: {
        color: { type: String, default: '' },
        is_current: { type: Boolean },
        san: { type: String, required: true },
    },
    emits: ['click'],
};
