import { StateDB } from '@liskhq/lisk-db';
import { getKlayr32AddressFromAddress } from '@klayr/cryptography/dist-node/address';
import {
	DB_PREFIX_DEX_OBSERVATION_STORE,
	DB_PREFIX_DEX_POOL_STORE,
	DB_PREFIX_DEX_POSITION_INFO_STORE,
	DB_PREFIX_DEX_POSITION_MANAGER_STORE,
	DB_PREFIX_DEX_SUPPORTED_TOKEN_STORE,
	DB_PREFIX_DEX_TICK_BITMAP_STORE,
	DB_PREFIX_DEX_TICK_INFO_STORE,
	DB_PREFIX_DEX_TOKEN_SYMBOL_STORE,
	MODULE_NAME_DEX,
} from '../constants';
import {
	DexGenesisStoreEntry,
	DEXPoolData,
	DEXPoolSubstoreEntry,
	GenesisAssetEntry,
	GovernableConfigSubstoreEntry,
	ObservationSubstoreEntry,
	PositionInfoSubstoreEntry,
	PositionManager,
	PositionManagerSubstoreEntry,
	SupportedTokenManager,
	SupportedTokenManagerSubstoreEntry,
	TickBitmapSubstoreEntry,
	TickInfoSubstoreEntry,
	TokenSymbolSubstoreEntry,
} from '../types';
import { getStateStore } from '../utils/store';
import {
	observationStoreSchema,
	poolStoreSchema,
	positionInfoStoreSchema,
	positionManagerStoreSchema,
	supportedTokenStoreSchema,
	tickBitmapStoreSchema,
	tickInfoStoreSchema,
	tokenSymbolStoreSchema,
	dexGenesisStoreSchema,
} from '../schemas';

export const getObservationSubstore = async (db: StateDB): Promise<ObservationSubstoreEntry[]> => {
	const observationStore = getStateStore(db, DB_PREFIX_DEX_OBSERVATION_STORE);
	const observations = (await observationStore.iterateWithSchema(
		{
			gte: Buffer.alloc(22, 0),
			lte: Buffer.alloc(22, 255),
		},
		observationStoreSchema,
	)) as { key: Buffer; value: Omit<ObservationSubstoreEntry, 'poolAddress' | 'index'> }[];

	return observations
		.map(item => {
			const indexBuf = item.key.subarray(20);

			return {
				...item.value,
				poolAddress: getKlayr32AddressFromAddress(item.key.subarray(0, 20)),
				index: indexBuf.readUIntBE(0, 2).toString(),
			};
		})
		.sort((a, b) => {
			// First, sort by poolAddress
			if (a.poolAddress < b.poolAddress) return -1;
			if (a.poolAddress > b.poolAddress) return 1;

			// If poolAddress is the same, sort by index (convert to number to ensure correct numerical sorting)
			return parseInt(a.index, 10) - parseInt(b.index, 10);
		});
};

export const getPoolSubstore = async (db: StateDB): Promise<DEXPoolSubstoreEntry[]> => {
	const poolStore = getStateStore(db, DB_PREFIX_DEX_POOL_STORE);
	const pools = (await poolStore.iterateWithSchema(
		{
			gte: Buffer.alloc(20, 0),
			lte: Buffer.alloc(20, 255),
		},
		poolStoreSchema,
	)) as { key: Buffer; value: DEXPoolData }[];

	return pools
		.map(item => ({
			...item.value,
			token0: item.value.token0.toString('hex'),
			token1: item.value.token1.toString('hex'),
		}))
		.sort((a, b) => {
			// First, sort by token0
			if (a.token0 < b.token0) return -1;
			if (a.token0 > b.token0) return 1;

			// If token0 is the same, sort by token1
			if (a.token1 < b.token1) return -1;
			if (a.token1 > b.token1) return 1;

			// If both token0 and token1 are the same, sort by fee (convert to number if necessary)
			return parseInt(a.fee, 10) - parseInt(b.fee, 10);
		});
};

export const getPositionInfoSubstore = async (
	db: StateDB,
): Promise<PositionInfoSubstoreEntry[]> => {
	const positionInfoStore = getStateStore(db, DB_PREFIX_DEX_POSITION_INFO_STORE);
	const positionInfos = (await positionInfoStore.iterateWithSchema(
		{
			gte: Buffer.alloc(52, 0),
			lte: Buffer.alloc(52, 255),
		},
		positionInfoStoreSchema,
	)) as { key: Buffer; value: Omit<PositionInfoSubstoreEntry, 'poolAddress' | 'key'> }[];

	return positionInfos
		.map(item => ({
			...item.value,
			poolAddress: getKlayr32AddressFromAddress(item.key.subarray(0, 20)),
			key: item.key.subarray(20).toString('hex'),
		}))
		.sort((a, b) => {
			// First, sort by poolAddress
			if (a.poolAddress < b.poolAddress) return -1;
			if (a.poolAddress > b.poolAddress) return 1;

			// If both poolAddress are the same, sort by key
			if (a.key < b.key) return -1;
			if (a.key > b.key) return 1;

			// default
			return 0;
		});
};

export const getPositionManagerSubstore = async (
	db: StateDB,
): Promise<PositionManagerSubstoreEntry[]> => {
	const positionManagerStore = getStateStore(db, DB_PREFIX_DEX_POSITION_MANAGER_STORE);
	const positionManagers = (await positionManagerStore.iterateWithSchema(
		{
			gte: Buffer.alloc(4, 0),
			lte: Buffer.alloc(4, 255),
		},
		positionManagerStoreSchema,
	)) as { key: Buffer; value: PositionManager }[];

	return positionManagers
		.map(item => ({
			...item.value,
			poolAddress: getKlayr32AddressFromAddress(item.value.poolAddress),
		}))
		.sort((a, b) => {
			// First, sort by poolAddress
			if (a.poolAddress < b.poolAddress) return -1;
			if (a.poolAddress > b.poolAddress) return 1;

			// default
			return 0;
		});
};

export const getSupportedTokenSubstore = async (
	db: StateDB,
): Promise<SupportedTokenManagerSubstoreEntry[]> => {
	const supportedTokenStore = getStateStore(db, DB_PREFIX_DEX_SUPPORTED_TOKEN_STORE);

	try {
		const suppoertedTokens = await supportedTokenStore.getWithSchema<SupportedTokenManager>(
			Buffer.alloc(0),
			supportedTokenStoreSchema,
		);
		suppoertedTokens.supported.map(t => t.toString('hex'));

		return [
			{
				supportAll: suppoertedTokens.supportAll,
				supported: suppoertedTokens.supported
					.map(t => t.toString('hex'))
					.sort((a, b) => {
						if (a > b) return 1;
						if (b > a) return -1;
						return 0;
					}),
			},
		];
	} catch {
		return [];
	}
};

export const getTickBitmapSubstore = async (db: StateDB): Promise<TickBitmapSubstoreEntry[]> => {
	const tickBitmapStore = getStateStore(db, DB_PREFIX_DEX_TICK_BITMAP_STORE);
	const tickBitmaps = (await tickBitmapStore.iterateWithSchema(
		{
			gte: Buffer.alloc(22, 0),
			lte: Buffer.alloc(22, 255),
		},
		tickBitmapStoreSchema,
	)) as { key: Buffer; value: Omit<TickBitmapSubstoreEntry, 'poolAddress' | 'index'> }[];

	return tickBitmaps
		.map(item => {
			const indexBuf = item.key.subarray(20);

			return {
				...item.value,
				poolAddress: getKlayr32AddressFromAddress(item.key.subarray(0, 20)),
				index: indexBuf.readUIntBE(0, 2).toString(),
			};
		})
		.sort((a, b) => {
			// First, sort by poolAddress
			if (a.poolAddress < b.poolAddress) return -1;
			if (a.poolAddress > b.poolAddress) return 1;

			// If poolAddress is the same, sort by index (convert to number to ensure correct numerical sorting)
			return parseInt(a.index, 10) - parseInt(b.index, 10);
		});
};

export const getTickInfoSubstore = async (db: StateDB): Promise<TickInfoSubstoreEntry[]> => {
	const tickInfoStore = getStateStore(db, DB_PREFIX_DEX_TICK_INFO_STORE);
	const tickInfos = (await tickInfoStore.iterateWithSchema(
		{
			gte: Buffer.alloc(23, 0),
			lte: Buffer.alloc(23, 255),
		},
		tickInfoStoreSchema,
	)) as { key: Buffer; value: Omit<TickInfoSubstoreEntry, 'poolAddress' | 'tick'> }[];

	return tickInfos
		.map(item => {
			const tickBuff = item.key.subarray(20);

			return {
				...item.value,
				poolAddress: getKlayr32AddressFromAddress(item.key.subarray(0, 20)),
				tick: tickBuff.readUIntBE(0, 3).toString(),
			};
		})
		.sort((a, b) => {
			// First, sort by poolAddress
			if (a.poolAddress < b.poolAddress) return -1;
			if (a.poolAddress > b.poolAddress) return 1;

			// If poolAddress is the same, sort by tick (convert to number to ensure correct numerical sorting)
			return parseInt(a.tick, 10) - parseInt(b.tick, 10);
		});
};

export const getTokenSymbolSubstore = async (db: StateDB): Promise<TokenSymbolSubstoreEntry[]> => {
	const tokenSymbolStore = getStateStore(db, DB_PREFIX_DEX_TOKEN_SYMBOL_STORE);
	const tokenSymbols = (await tokenSymbolStore.iterateWithSchema(
		{
			gte: Buffer.alloc(8, 0),
			lte: Buffer.alloc(8, 255),
		},
		tokenSymbolStoreSchema,
	)) as { key: Buffer; value: Omit<TokenSymbolSubstoreEntry, 'tokenID'> }[];

	return tokenSymbols
		.map(item => ({
			...item.value,
			tokenID: item.key.toString('hex'),
		}))
		.sort((a, b) => {
			// First, sort by tokenID
			if (a.tokenID < b.tokenID) return -1;
			if (a.tokenID > b.tokenID) return 1;

			// default
			return 0;
		});
};

export const getDexModuleEntry = async (
	observationSubstore: ObservationSubstoreEntry[],
	poolSubstore: DEXPoolSubstoreEntry[],
	positionInfoSubstore: PositionInfoSubstoreEntry[],
	positionManagerSubstore: PositionManagerSubstoreEntry[],
	supportedTokenSubstore: SupportedTokenManagerSubstoreEntry[],
	tickBitmapSubstore: TickBitmapSubstoreEntry[],
	tickInfoSubstore: TickInfoSubstoreEntry[],
	tokenSymbolSubstore: TokenSymbolSubstoreEntry[],
	configSubstore: GovernableConfigSubstoreEntry,
): Promise<GenesisAssetEntry> => {
	const genesisObj: DexGenesisStoreEntry = {
		observationSubstore,
		poolSubstore,
		positionInfoSubstore,
		positionManagerSubstore,
		supportedTokenSubstore,
		tickBitmapSubstore,
		tickInfoSubstore,
		tokenSymbolSubstore,
		configSubstore,
	};
	return {
		module: MODULE_NAME_DEX,
		data: (genesisObj as unknown) as Record<string, unknown>,
		schema: dexGenesisStoreSchema,
	};
};
