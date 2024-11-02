export const voteScoreStoreSchema = {
	$id: '/governance/store/vote_score',
	type: 'object',
	required: ['score'],
	properties: {
		score: {
			dataType: 'uint64',
			fieldNumber: 1,
		},
	},
};
