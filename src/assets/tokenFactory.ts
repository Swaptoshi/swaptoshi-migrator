import { StateDB } from '@liskhq/lisk-db';
import { getKlayr32AddressFromAddress } from '@klayr/cryptography/dist-node/address';
import {
	DB_PREFIX_TOKEN_FACTORY_AIRDROP_STORE,
	DB_PREFIX_TOKEN_FACTORY_FACTORY_STORE,
	DB_PREFIX_TOKEN_FACTORY_ICO_STORE,
	DB_PREFIX_TOKEN_FACTORY_VESTING_UNLOCK_STORE,
	MODULE_NAME_TOKEN_FACTORY,
} from '../constants';
import {
	airdropStoreSchema,
	factoryStoreSchema,
	icoStoreSchema,
	nextAvailableTokenIdStoreSchema,
	tokenFactoryGenesisStoreSchema,
	vestingUnlockStoreSchema,
} from '../schemas';
import {
	AirdropGenesisSubstoreEntry,
	AirdropStoreData,
	FactoryGenesisSubstoreEntry,
	FactoryStoreData,
	GenesisAssetEntry,
	GovernableConfigSubstoreEntry,
	ICOGenesisSubstoreEntry,
	ICOStoreData,
	NextAvailableTokenIdGenesisSubstoreEntry,
	NextAvailableTokenIdStoreData,
	TokenFactoryGenesisStoreEntry,
	VestingUnlockGenesisSubstoreEntry,
	VestingUnlockStoreData,
} from '../types';
import { getStateStore } from '../utils/store';

export const getAirdropSubstore = async (db: StateDB): Promise<AirdropGenesisSubstoreEntry[]> => {
	const airdropStore = getStateStore(db, DB_PREFIX_TOKEN_FACTORY_AIRDROP_STORE);
	const airdrops = (await airdropStore.iterateWithSchema(
		{
			gte: Buffer.alloc(28, 0),
			lte: Buffer.alloc(28, 255),
		},
		airdropStoreSchema,
	)) as { key: Buffer; value: AirdropStoreData }[];

	return airdrops
		.map(item => ({
			recipients: item.value.recipients.map(t => ({
				address: getKlayr32AddressFromAddress(t.address),
				amount: t.amount.toString(),
			})),
			tokenId: item.key.subarray(0, 8).toString('hex'),
			providerAddress: getKlayr32AddressFromAddress(item.key.subarray(8)),
		}))
		.sort((a, b) => {
			// First, sort by tokenId
			if (a.tokenId < b.tokenId) return -1;
			if (a.tokenId > b.tokenId) return 1;

			// Then, sort by providerAddress
			if (a.providerAddress < b.providerAddress) return -1;
			if (a.providerAddress > b.providerAddress) return 1;

			// default
			return 0;
		});
};

export const getFactorySubstore = async (db: StateDB): Promise<FactoryGenesisSubstoreEntry[]> => {
	const factoryStore = getStateStore(db, DB_PREFIX_TOKEN_FACTORY_FACTORY_STORE);
	const factories = (await factoryStore.iterateWithSchema(
		{
			gte: Buffer.alloc(8, 0),
			lte: Buffer.alloc(8, 255),
		},
		factoryStoreSchema,
	)) as { key: Buffer; value: FactoryStoreData }[];

	return factories
		.map(item => ({
			owner: getKlayr32AddressFromAddress(item.value.owner),
			attributesArray: item.value.attributesArray.map(t => ({
				key: t.key,
				attributes: t.attributes.toString('hex'),
			})),
			tokenId: item.key.toString('hex'),
		}))
		.sort((a, b) => {
			// First, sort by tokenId
			if (a.tokenId < b.tokenId) return -1;
			if (a.tokenId > b.tokenId) return 1;

			// default
			return 0;
		});
};

export const getICOSubstore = async (db: StateDB): Promise<ICOGenesisSubstoreEntry[]> => {
	const icoStore = getStateStore(db, DB_PREFIX_TOKEN_FACTORY_ICO_STORE);
	const icos = (await icoStore.iterateWithSchema(
		{
			gte: Buffer.alloc(20, 0),
			lte: Buffer.alloc(20, 255),
		},
		icoStoreSchema,
	)) as { key: Buffer; value: ICOStoreData }[];

	return icos
		.map(item => ({
			providerAddress: getKlayr32AddressFromAddress(item.value.providerAddress),
			price: item.value.price,
			poolAddress: getKlayr32AddressFromAddress(item.key),
		}))
		.sort((a, b) => {
			// First, sort by poolAddress
			if (a.poolAddress < b.poolAddress) return -1;
			if (a.poolAddress > b.poolAddress) return 1;

			// default
			return 0;
		});
};

export const getNextAvailableTokenIdSubstore = async (
	db: StateDB,
): Promise<NextAvailableTokenIdGenesisSubstoreEntry> => {
	const nextAvailableTokenIdStore = getStateStore(db, DB_PREFIX_TOKEN_FACTORY_ICO_STORE);

	let nextAvailableTokenId;
	try {
		nextAvailableTokenId = await nextAvailableTokenIdStore.getWithSchema<
			NextAvailableTokenIdStoreData
		>(Buffer.alloc(0), nextAvailableTokenIdStoreSchema);
	} catch {
		return {
			nextTokenId: '1',
		};
	}

	return {
		nextTokenId: nextAvailableTokenId.nextTokenId.toString(),
	};
};

export const getVestingUnlockSubstore = async (
	db: StateDB,
): Promise<VestingUnlockGenesisSubstoreEntry[]> => {
	const vestingUnlockStore = getStateStore(db, DB_PREFIX_TOKEN_FACTORY_VESTING_UNLOCK_STORE);
	const vestingUnlocks = (await vestingUnlockStore.iterateWithSchema(
		{
			gte: Buffer.alloc(4, 0),
			lte: Buffer.alloc(4, 255),
		},
		vestingUnlockStoreSchema,
	)) as { key: Buffer; value: VestingUnlockStoreData }[];

	return vestingUnlocks
		.map(item => {
			const indexBuf = item.key;

			return {
				toBeUnlocked: item.value.toBeUnlocked.map(t => ({
					tokenId: t.tokenId.toString('hex'),
					address: getKlayr32AddressFromAddress(t.address),
					amount: t.amount.toString(),
				})),
				height: indexBuf.readUIntBE(0, 4),
			};
		})
		.sort((a, b) => a.height - b.height); // sort by height
};

export const getTokenFactoryModuleEntry = async (
	airdropSubstore: AirdropGenesisSubstoreEntry[],
	factorySubstore: FactoryGenesisSubstoreEntry[],
	icoSubstore: ICOGenesisSubstoreEntry[],
	nextAvailableTokenIdSubstore: NextAvailableTokenIdGenesisSubstoreEntry,
	vestingUnlockSubstore: VestingUnlockGenesisSubstoreEntry[],
	configSubstore: GovernableConfigSubstoreEntry,
): Promise<GenesisAssetEntry> => {
	const genesisObj: TokenFactoryGenesisStoreEntry = {
		airdropSubstore,
		factorySubstore,
		icoSubstore,
		nextAvailableTokenIdSubstore,
		vestingUnlockSubstore,
		configSubstore,
	};
	return {
		module: MODULE_NAME_TOKEN_FACTORY,
		data: (genesisObj as unknown) as Record<string, unknown>,
		schema: tokenFactoryGenesisStoreSchema,
	};
};
