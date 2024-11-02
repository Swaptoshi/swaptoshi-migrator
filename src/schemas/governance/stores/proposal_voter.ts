export const proposalVoterStoreSchema = {
	$id: '/governance/store/proposal_voter',
	type: 'object',
	required: ['voters'],
	properties: {
		voters: {
			type: 'array',
			fieldNumber: 1,
			items: {
				dataType: 'bytes',
				format: 'klayr32',
			},
		},
	},
};
