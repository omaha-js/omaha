<script lang="ts">
	import { chart } from './chart';
	import { ApexOptions } from 'apexcharts';
	import { WeeklyDownloadCount } from '@omaha/client';
	import { createEventDispatcher, onDestroy } from 'svelte';

	export let history: WeeklyDownloadCount[];
	export let width: number = 350;
	export let height: number = 40;

	let data = new Array<[ time: number, downloads: number ]>();

	for (const row of history) {
		data.push([row.date_start.getTime(), row.downloads]);
	}

	const dispatch = createEventDispatcher();

	let hoveringDataSet = 0;
	let options: ApexOptions = {
		chart: {
			type: 'area',
			width,
			height,
			sparkline: {
				enabled: true
			},
			animations: {
				enabled: false
			},
			events: {
				mouseMove: (e, chart, options) => {
					const index = options.dataPointIndex;

					if (index >= 0) {
						const dataset = history[index];

						if (hoveringDataSet !== dataset.date_start.getTime()) {
							hoveringDataSet = dataset.date_start.getTime();
							dispatch('dataset_enter', dataset);
						}
					}
					else {
						if (hoveringDataSet !== 0) {
							hoveringDataSet = 0;
							dispatch('dataset_leave');
						}
					}
				},
				mouseLeave: () => {
					hoveringDataSet = 0;
					dispatch('dataset_leave');
				}
			}
		},
		markers: {
			strokeWidth: 0,
			hover: {
				size: 4,
			}
		},
		series: [{
			name: 'downloads',
			data
		}],
		dataLabels: {
			enabled: false
		},
		grid: {
			padding: {
				bottom: 1,
				top: 7,
				right: 7,
				left: 7
			}
		},
		xaxis: {
			type: 'datetime',
			crosshairs: {
				stroke: {
					width: 2.5,
					dashArray: 0,
					color: '#ff3b4a'
				}
			}
		},
		tooltip: {
			cssClass: 'd-none'
		},
		stroke: {
			width: 2.5
		},
		theme: {
			monochrome: {
				enabled: true,
				color: '#ff3b4a'
			}
		},
		fill: {
			type: 'gradient',
			gradient: {
				shadeIntensity: 1,
				opacityFrom: 0.7,
				opacityTo: 0.9,
				stops: [0, 100]
			}
		},
	};

	onDestroy(() => options = {});
</script>

<div class="chart-container weekly-downloads">
	<div class="chart">
		<div use:chart={options} />
	</div>
</div>
