
export default {
    template: `
        <div>
            <textarea
                v-model.trim="pgn_or_fen"
                rows="10"
                placeholder="PGN or FEN"
                spellcheck="false"
                style="font-family: inherit; width: 100%; resize: vertical"
            />
            <div class="flex-row" style="column-gap: 12px">
                <button :disabled="reviewing" @click="load()">
                    Load
                </button>
                <label>
                    <input
                        v-model="auto_review"
                        type="checkbox"
                        @change="updateStore('auto_review')"
                    />
                    Auto review
                </label>
            </div>
        </div>
    `,
    inject: [
        'pgn_or_fen', 'auto_review', 'reviewing',
        'load', 'updateStore',
    ],
};
