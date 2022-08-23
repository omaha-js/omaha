import ApexCharts, { ApexOptions } from 'apexcharts';

const target = new ApexCharts(document.createElement('div'), {
	chart: {type: 'line'}
});

const tooltip = (target as any).ctx.w.globals.tooltip;
const onSeriesHover = tooltip.constructor.prototype.onSeriesHover;
const seriesHover = tooltip.constructor.prototype.seriesHover;

tooltip.constructor.prototype.onSeriesHover = (function(...args: any[]) {
	this.lastHoverTime = 0;
	return onSeriesHover.apply(this, args);
});

tooltip.constructor.prototype.seriesHover = (function(...args: any[]) {
	this.lastHoverTime = 0;
	return seriesHover.apply(this, args);
});

export function chart(node: HTMLElement, options: ApexOptions) {
	const chart = new ApexCharts(node, options)
	chart.render();

	return {
		update(options: ApexOptions) {
			chart.updateOptions(options)
		},

		destroy() {
			chart.destroy()
		}
	};
}
