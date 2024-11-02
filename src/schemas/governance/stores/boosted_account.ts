export const boostedAccountStoreSchema = {
	$id: '/governance/store/boosted_account',
	type: 'object',
	required: ['targetHeight'],
	properties: {
		targetHeight: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
	},
};
