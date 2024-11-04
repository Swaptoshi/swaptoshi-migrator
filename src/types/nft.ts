export interface NFTGenesisStoreEntry {
	nftSubstore: NFTSubstoreEntry[];
	supportedNFTsSubstore: SupportedNFTSubstoreEntry[];
}

export interface NFTSubstoreEntry {
	nftID: string;
	owner: string;
	attributesArray: {
		module: string;
		attributes: string;
	}[];
}

export interface SupportedNFTSubstoreEntry {
	chainID: string;
	supportedCollectionIDArray: {
		collectionID: string;
	}[];
}

export interface NFTAttributes {
	module: string;
	attributes: Buffer;
}

export interface NFTStoreData {
	owner: Buffer;
	attributesArray: NFTAttributes[];
}

export interface SupportedNFTsStoreData {
	supportedCollectionIDArray: {
		collectionID: Buffer;
	}[];
}
