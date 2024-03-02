
<template>
    <div class="flex-row">
        <button
            :disabled="disabled"
            :title="disabled ? 'Review can only be run for the main line.' : ''"
            @click="reviewing ? abortReview() : runReview()"
        >
            {{ reviewing ? 'Abort review' : 'Review' }}
        </button>
        Depth:
        <input
            v-model="review_depth"
            type="number"
            step="2"
            min="2"
            @change="updateStore('review_depth')"
        />
    </div>
    <div v-if="reviewing">
        <progress :value="review_progress[0]" :max="review_progress[1]" style="width: 100%" />
    </div>
</template>

<script>
    export default {
        inject: [
            'move_history', 'variation_move_index',
            'review_depth', 'review_progress', 'reviewing',
            'runReview', 'abortReview', 'updateStore',
        ],
        computed: {
            disabled() {
                return !this.reviewing && this.variation_move_index > 0;
            },
        },
    };
</script>
