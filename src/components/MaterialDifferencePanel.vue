
<template>
    <div class="flex-row" style="height: 30px; gap: 15px; align-items: center">
        <div v-for="(count, type) in material_difference[color]">
            <img
                v-for="_ in count"
                :alt="type"
                :src="images[type]"
                style="height: 30px; margin-right: -10px"
            />
        </div>
        <div v-if="value > 0">
            +{{ value }}
        </div>
    </div>
</template>

<script>
    import { PIECE_VALUES } from '@/material';

    export default {
        inject: ['material_difference'],
        props: {
            color: { type: String, required: true, validator: value => ['white', 'black'].includes(value) },
        },
        data: () => ({
            images: {},
        }),
        computed: {
            value() {
                return this.material_difference.value * (this.color === 'white' ? 1 : -1);
            },
        },
        async created() {
            await Promise.all(Object.keys(PIECE_VALUES).map(async type => {
                const image_module = await import(`@/assets/piece/${type}.svg`);
                this.images[type] = image_module.default;
            }));
        },
    };
</script>
