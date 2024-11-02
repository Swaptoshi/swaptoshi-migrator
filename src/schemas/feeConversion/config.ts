export const feeConversionConfigSchema = {
	$id: '/feeConversion/config',
	type: 'object',
	required: ['conversionPath'],
	properties: {
		conversionPath: {
			type: 'array',
			fieldNumber: 1,
			items: {
				dataType: 'string',
			},
		},
	},
};
