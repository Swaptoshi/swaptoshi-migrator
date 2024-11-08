export interface AirdropStoreData {
	recipients: {
		address: Buffer;
		amount: bigint;
	}[];
}

export interface AirdropGenesisSubstoreEntry {
	recipients: {
		address: string;
		amount: string;
	}[];
	tokenId: string;
	providerAddress: string;
}

export interface FactoryStoreData {
	owner: Buffer;
	attributesArray: TokenFactoryAttributes[];
}

export interface TokenFactoryAttributes {
	key: string;
	attributes: Buffer;
}

export interface FactoryGenesisSubstoreEntry {
	owner: string;
	attributesArray: {
		key: string;
		attributes: string;
	}[];
	tokenId: string;
}

export interface ICOStoreData {
	providerAddress: Buffer;
	price: string;
}

export interface ICOGenesisSubstoreEntry {
	providerAddress: string;
	price: string;
	poolAddress: string;
}

export interface NextAvailableTokenIdStoreData {
	nextTokenId: bigint;
}

export interface NextAvailableTokenIdGenesisSubstoreEntry {
	nextTokenId: string;
}

export interface VestingUnlockStoreData {
	toBeUnlocked: {
		tokenId: Buffer;
		address: Buffer;
		amount: bigint;
	}[];
}

export interface VestingUnlockGenesisSubstoreEntry {
	toBeUnlocked: {
		tokenId: string;
		address: string;
		amount: string;
	}[];
	height: number;
}

export interface TokenFactoryGenesisStoreEntry {
	airdropSubstore: AirdropGenesisSubstoreEntry[];
	factorySubstore: FactoryGenesisSubstoreEntry[];
	icoSubstore: ICOGenesisSubstoreEntry[];
	nextAvailableTokenIdSubstore: NextAvailableTokenIdGenesisSubstoreEntry;
	vestingUnlockSubstore: VestingUnlockGenesisSubstoreEntry[];
}
