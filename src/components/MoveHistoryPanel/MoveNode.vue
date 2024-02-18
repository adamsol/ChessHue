
export default {
    template: `
        <span
            style="font-weight: bold; cursor: pointer; padding: 2px; border-radius: 4px"
            :style="{
                color: color,
                background: hovered ? '#fff2' : 'none',
                border: is_current ? '2px solid currentColor' : '2px solid transparent',
            }"
            @click="$emit('click')"
            @mouseover="hovered = true"
            @mouseleave="hovered = false"
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
    data: () => ({
        hovered: false,
    }),
};
