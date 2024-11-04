const MIN_LENGTH_MODULE_NAME = 1;
const MAX_LENGTH_MODULE_NAME = 32;
const LENGTH_COLLECTION_ID = 4;

export const nftStoreSchema = {
	$id: '/nft/store/nft',
	type: 'object',
	required: ['owner', 'attributesArray'],
	properties: {
		owner: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		attributesArray: {
			type: 'array',
			fieldNumber: 2,
			items: {
				type: 'object',
				required: ['module', 'attributes'],
				properties: {
					module: {
						dataType: 'string',
						minLength: MIN_LENGTH_MODULE_NAME,
						maxLength: MAX_LENGTH_MODULE_NAME,
						pattern: '^[a-zA-Z0-9]*$',
						fieldNumber: 1,
					},
					attributes: {
						dataType: 'bytes',
						fieldNumber: 2,
					},
				},
			},
		},
	},
};

export const supportedNFTsStoreSchema = {
	$id: '/nft/store/supportedNFTs',
	type: 'object',
	required: ['supportedCollectionIDArray'],
	properties: {
		supportedCollectionIDArray: {
			type: 'array',
			fieldNumber: 1,
			items: {
				type: 'object',
				required: ['collectionID'],
				properties: {
					collectionID: {
						dataType: 'bytes',
						minLength: LENGTH_COLLECTION_ID,
						maxLength: LENGTH_COLLECTION_ID,
						fieldNumber: 1,
					},
				},
			},
		},
	},
};
