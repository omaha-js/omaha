import {
	ColumnOptions,
	CreateDateColumn as RealCreateDateColumn,
	UpdateDateColumn as RealUpdateDateColumn,
	DeleteDateColumn as RealDeleteDateColumn,
	Column
} from 'typeorm';

export function CreateDateColumn(options?: ColumnOptions) {
	return RealCreateDateColumn({
		precision: 3,
		default: () => 'CURRENT_TIMESTAMP(3)',
		...options,
	});
}

export function UpdateDateColumn(options?: ColumnOptions) {
	return RealUpdateDateColumn({
		precision: 3,
		default: () => 'CURRENT_TIMESTAMP(3)',
		onUpdate: 'CURRENT_TIMESTAMP(3)',
		...options,
	});
}

export function DeleteDateColumn(options?: ColumnOptions) {
	return RealDeleteDateColumn({
		precision: 3,
		...options,
	});
}

export function DateColumn(options?: ColumnOptions) {
	return Column({
		type: 'datetime',
		precision: 3,
		...options,
	});
}
