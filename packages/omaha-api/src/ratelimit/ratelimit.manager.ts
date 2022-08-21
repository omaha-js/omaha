import { NestedMap } from '@baileyherbert/nested-collections';
import { Token } from 'src/entities/Token';
import { RateLimitInterval, RatelimitService } from './ratelimit.service';

export class RatelimitManager {

	private addresses = new NestedMap<[RateLimitInterval, string], number>();
	private tokens = new NestedMap<[RateLimitInterval, string], number>();

	public constructor(
		private service: RatelimitService,
		private key: string | Symbol,
		private int1m: number,
		private int5m: number,
		private int15m: number
	) {}

	/**
	 * Implements rate limiting for the given client, counting this invocation as a request. Returns the number of
	 * requests remaining, or `false` if rate limited.
	 *
	 * @param client
	 * @returns `false` if rate limited, or the number of requests remaining otherwise
	 */
	public guard(client: string | Token) {
		const remaining = this.check(client);

		if (remaining > 0) {
			this.incrementCounts(client);
			return remaining - 1;
		}

		return false;
	}

	/**
	 * Returns the number of available requests for the given client, where 0 means they are being rate limited.
	 *
	 * @param client
	 * @returns
	 */
	public check(client: string | Token) {
		const counts = this.getCounts(client);
		const minimum = Math.max(0, Math.min(
			this.int1m - counts[0],
			this.int5m - counts[1],
			this.int15m - counts[2]
		));

		return minimum;
	}

	/**
	 * Gets the current counts for the given client across all three intervals.
	 *
	 * @param client
	 * @returns
	 */
	private getCounts(client: string | Token): IntervalCounts {
		const id = typeof client === 'string' ? client : client.id.toString('hex');
		const target = typeof client === 'string' ? this.addresses : this.tokens;

		return [
			target.get(['1m', id]) ?? 0,
			target.get(['5m', id]) ?? 0,
			target.get(['15m', id]) ?? 0
		];
	}

	/**
	 * Increments the counts for the given client across all three intervals.
	 *
	 * @param client
	 * @returns
	 */
	private incrementCounts(client: string | Token) {
		const id = typeof client === 'string' ? client : client.id.toString('hex');
		const target = typeof client === 'string' ? this.addresses : this.tokens;

		target.set(['1m', id], (target.get(['1m', id]) ?? 0) + 1);
		target.set(['5m', id], (target.get(['5m', id]) ?? 0) + 1);
		target.set(['15m', id], (target.get(['15m', id]) ?? 0) + 1);
	}

	/**
	 * Clears request counts for the given interval.
	 *
	 * @param interval
	 */
	public clearInterval(interval: RateLimitInterval) {
		this.addresses.get([interval])?.clear();
		this.tokens.get([interval])?.clear();
	}

}

type IntervalCounts = [int1m: number, int5m: number, int15m: number];
