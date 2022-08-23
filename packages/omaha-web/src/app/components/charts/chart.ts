import ApexCharts, { ApexOptions } from 'apexcharts';

const target = new ApexCharts(document.createElement('div'), {
	chart: {type: 'line'}
});

const tooltip = (target as any).ctx.w.globals.tooltip;
const original = tooltip.constructor.prototype.onSeriesHover;

export function chart(node: HTMLElement, options: ApexOptions) {
	const chart = new ApexCharts(node, options)
	chart.render();

	// Some hacks to improve rendering speed on hover
	const tooltip = (chart as any).ctx.w.globals.tooltip;
	tooltip.constructor.prototype.onSeriesHover = (function(...args: any[]) {
		this.lastHoverTime = 0;
		return original.apply(this, args);
	});

	return {
		update(options: ApexOptions) {
			chart.updateOptions(options)
		},

		destroy() {
			chart.destroy()
		}
	};
}
