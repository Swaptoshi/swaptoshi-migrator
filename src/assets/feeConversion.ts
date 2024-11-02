import { MODULE_NAME_FEE_CONVERSION } from '../constants';
import { feeConversionGenesisStoreSchema } from '../schemas';
import {
	GenesisAssetEntry,
	GovernableConfigSubstoreEntry,
	FeeConversionGenesisStoreEntry,
} from '../types';

export const getFeeConversionModuleEntry = async (
	configSubstore: GovernableConfigSubstoreEntry,
): Promise<GenesisAssetEntry> => {
	const genesisObj: FeeConversionGenesisStoreEntry = {
		configSubstore,
	};
	return {
		module: MODULE_NAME_FEE_CONVERSION,
		data: (genesisObj as unknown) as Record<string, unknown>,
		schema: feeConversionGenesisStoreSchema,
	};
};
