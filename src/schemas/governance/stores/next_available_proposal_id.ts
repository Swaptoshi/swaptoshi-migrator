export const nextAvailableProposalIdStoreSchema = {
	$id: '/governance/store/next_available_proposal_id',
	type: 'object',
	required: ['nextProposalId'],
	properties: {
		nextProposalId: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
	},
};
