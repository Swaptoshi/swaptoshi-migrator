export const delegatedVoteStoreSchema = {
	$id: '/governance/store/delegated_vote',
	type: 'object',
	required: ['outgoingDelegation', 'incomingDelegation'],
	properties: {
		outgoingDelegation: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		incomingDelegation: {
			type: 'array',
			fieldNumber: 2,
			items: {
				dataType: 'bytes',
				format: 'klayr32',
			},
		},
	},
};
