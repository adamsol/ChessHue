
export default {
    template: `
        <div class="flex-row" style="height: 30px; gap: 15px; align-items: center">
            <div v-for="(count, type) in material_difference[color]">
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
    inject: ['material_difference'],
    props: {
        color: { type: String, required: true, validator: value => ['white', 'black'].includes(value) },
    },
    computed: {
        value() {
            return this.material_difference.value * (this.color === 'white' ? 1 : -1);
        },
    },
};
