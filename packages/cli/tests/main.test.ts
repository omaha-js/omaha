import { message } from '../src/main';

describe('main', function() {
	it('says hello world', function() {
		expect(message).toBe('Hello world!');
	})
});
