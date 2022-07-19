import { createStore } from '../helpers/stores';
import { Repository } from '../models/Repository';

/**
 * The current repository.
 */
export const repository = createStore<Repository>(undefined);
