import { StateDB } from '@liskhq/lisk-db';
import { StateStore } from '@klayr/chain';

export const getStateStore = (db: StateDB, prefix: Buffer): StateStore =>
	new StateStore(db, prefix);
