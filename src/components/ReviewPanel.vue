
<template>
    <div class="flex-row">
        <button @click="reviewing ? review_progress = undefined : runReview()">
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
        <progress :max="move_history.length" :value="review_progress" style="width: 100%" />
    </div>
</template>

<script>
    export default {
        inject: [
            'move_history', 'review_depth', 'review_progress', 'reviewing',
            'runReview', 'updateStore',
        ],
    };
</script>
