import { MODULE_NAME_LIQUID_POS } from '../constants';
import { liquidPosGenesisStoreSchema } from '../schemas';
import {
	GenesisAssetEntry,
	GovernableConfigSubstoreEntry,
	LiquidPosGenesisStoreEntry,
} from '../types';

export const getLiquidPosModuleEntry = async (
	configSubstore: GovernableConfigSubstoreEntry,
): Promise<GenesisAssetEntry> => {
	const genesisObj: LiquidPosGenesisStoreEntry = {
		configSubstore,
	};
	return {
		module: MODULE_NAME_LIQUID_POS,
		data: (genesisObj as unknown) as Record<string, unknown>,
		schema: liquidPosGenesisStoreSchema,
	};
};
