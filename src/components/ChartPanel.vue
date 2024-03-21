
<template>
    <div
        v-if="move_evaluations.length > 1"
        style="width: 100%; height: 150px; background: #333"
    >
        <LineChart
            ref="chart"
            :data="chart_data"
            :options="chart_options"
            style="max-width: 100%; cursor: pointer"
            @mouseout="onMouseOut"
        />
    </div>
</template>

<script>
    import { Chart, Filler, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
    import { Line as LineChart } from 'vue-chartjs';

    import { getMoveNumberPrefix } from '@/move';
    import { calculateLoss } from '@/review';

    Chart.register(Filler, LinearScale, LineElement, PointElement, Tooltip);

    export default {
        components: { LineChart },
        inject: [
            'start_ply_number', 'move_history', 'current_move_index', 'variation_move_index',
            'move_evaluations', 'move_colors',
            'setMoveIndex',
        ],
        computed: {
            chart_data() {
                return {
                    datasets: [{
                        data: this.move_evaluations.map(score => calculateLoss(score, '0')),
                        backgroundColor: ['#bbb', ...this.move_colors],
                        fill: {
                            target: 'origin',
                            above: '#ccc',
                            below: '#111',
                        },
                    }],
                    labels: [...Array(this.move_evaluations.length).keys()],
                };
            },
            chart_options() {
                return {
                    scales: {
                        x: {
                            display: false,
                            type: 'linear',
                            max: this.move_evaluations.length - 1 + this.move_evaluations.length / 60,
                        },
                        y: {
                            ticks: {
                                callback: value => value === 0 ? '' : null,
                            },
                            grid: {
                                color: '#777',
                            },
                            min: -1,
                            max: 1,
                        },
                    },
                    elements: {
                        line: {
                            tension: 0.3,
                            borderWidth: 1,
                            borderColor: '#666',
                        },
                        point: {
                            radius: 0,
                            hoverRadius: 7,
                            borderColor: '#fff',
                        },
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                title: ([context]) => context.dataIndex > 0 ? [
                                    getMoveNumberPrefix(this.start_ply_number + context.dataIndex - 1),
                                    this.move_history[context.dataIndex - 1],
                                ].join(' ') : '',
                                label: context => this.move_evaluations[context.dataIndex],
                            },
                            animation: {
                                duration: 100,
                            },
                            displayColors: false,
                            backgroundColor: '#0009',
                        },
                    },
                    transitions: {
                        active: {
                            animation: {
                                duration: 0,
                            },
                        },
                    },
                    animation: {
                        duration: 0,
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false,
                    },
                    onClick: (event, [context]) => {
                        this.setMoveIndex('variation_move_index', 0);
                        this.setMoveIndex('current_move_index', context.index);
                    },
                    events: ['mousemove', 'click'],  // Removed 'mouseout' from the default list to prevent flickering.
                    clip: false,
                    responsive: true,
                    maintainAspectRatio: false,
                };
            },
        },
        watch: {
            current_move_index() {
                this.showCurrentMoveDot();
            },
            variation_move_index() {
                this.showCurrentMoveDot();
            },
            move_evaluations() {
                setTimeout(this.showCurrentMoveDot);
            },
        },
        methods: {
            showCurrentMoveDot() {
                const chart = this.$refs.chart?.chart;
                if (!chart) {
                    return;
                }
                if (this.variation_move_index === 0 && this.current_move_index < this.move_evaluations.length) {
                    const elements = [{
                        datasetIndex: 0,
                        index: this.current_move_index,
                    }];
                    chart.setActiveElements(elements);
                } else {
                    chart.setActiveElements([]);
                }
                chart.tooltip.setActiveElements([]);
                chart.update();
            },
            onMouseOut() {
                setTimeout(this.showCurrentMoveDot, 50);
            },
        },
    };
</script>
