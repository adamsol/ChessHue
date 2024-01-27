
export default {
    template: `
        <div style="height: 30px; display: flex; gap: 15px; align-items: center">
            <div v-for="(count, type) in pieces">
                <img
                    v-for="_ in count"
                    :alt="type"
                    :src="'../assets/piece/' + type + '.svg'"
                    style="height: 30px; margin-right: -10px"
                />
            </div>
            <div v-if="value > 0">
                +{{ value }}
            </div>
        </div>
    `,
    props: {
        pieces: { type: Object, required: true },
        value: { type: Number, required: true },
    },
};
