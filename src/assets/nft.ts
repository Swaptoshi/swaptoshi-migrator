import { StateDB } from '@liskhq/lisk-db';
import { DB_PREFIX_NFT_STORE, DB_PREFIX_SUPPORTED_NFT_STORE, MODULE_NAME_NFT } from '../constants';
import { nftGenesisStoreSchema, nftStoreSchema, supportedNFTsStoreSchema } from '../schemas';
import {
	GenesisAssetEntry,
	NFTGenesisStoreEntry,
	NFTStoreData,
	NFTSubstoreEntry,
	SupportedNFTsStoreData,
	SupportedNFTSubstoreEntry,
} from '../types';
import { getStateStore } from '../utils/store';

export const getNFTSubstore = async (db: StateDB): Promise<NFTSubstoreEntry[]> => {
	const nftStore = getStateStore(db, DB_PREFIX_NFT_STORE);
	const nfts = (await nftStore.iterateWithSchema(
		{
			gte: Buffer.alloc(16, 0),
			lte: Buffer.alloc(16, 255),
		},
		nftStoreSchema,
	)) as { key: Buffer; value: NFTStoreData }[];

	return nfts
		.sort((a, b) => a.key.compare(b.key))
		.map(item => ({
			nftID: item.key.toString('hex'),
			owner: item.value.owner.toString('hex'),
			attributesArray: item.value.attributesArray.map(t => ({
				module: t.module,
				attributes: t.attributes.toString('hex'),
			})),
		}));
};

export const getSupportedNFTsSubstore = async (
	db: StateDB,
): Promise<SupportedNFTSubstoreEntry[]> => {
	const supportedNFTStore = getStateStore(db, DB_PREFIX_SUPPORTED_NFT_STORE);
	const supportedNFTs = (await supportedNFTStore.iterateWithSchema(
		{
			gte: Buffer.alloc(4, 0),
			lte: Buffer.alloc(4, 255),
		},
		supportedNFTsStoreSchema,
	)) as { key: Buffer; value: SupportedNFTsStoreData }[];

	return supportedNFTs
		.sort((a, b) => a.key.compare(b.key))
		.map(item => ({
			chainID: item.key.toString('hex'),
			supportedCollectionIDArray: item.value.supportedCollectionIDArray.map(t => ({
				collectionID: t.collectionID.toString('hex'),
			})),
		}));
};

export const getNFTModuleEntry = async (
	nftSubstore: NFTSubstoreEntry[],
	supportedNFTsSubstore: SupportedNFTSubstoreEntry[],
): Promise<GenesisAssetEntry> => {
	const genesisObj: NFTGenesisStoreEntry = {
		nftSubstore,
		supportedNFTsSubstore,
	};
	return {
		module: MODULE_NAME_NFT,
		data: (genesisObj as unknown) as Record<string, unknown>,
		schema: nftGenesisStoreSchema,
	};
};
