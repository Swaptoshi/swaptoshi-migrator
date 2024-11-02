/*
 * Copyright © 2022 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 */
import { address } from '@liskhq/lisk-cryptography';
import { getAuthModuleEntry, getAuthModuleEntryBuffer } from '../../../src/assets/auth';
import { MODULE_NAME_AUTH } from '../../../src/constants';
import {
	AuthAccountEntry,
	AuthStoreEntry,
	AuthStoreEntryBuffer,
	GenesisAssetEntry,
} from '../../../src/types';
import { AuthAccount, createFakeDefaultAuthAccount } from '../utils/account';
import { ADDRESS_KLAYR32 } from '../utils/regex';

const { getLisk32AddressFromAddress } = address;

describe('Build assets/auth', () => {
	let accounts: AuthAccount[];
	beforeAll(async () => {
		accounts = [
			createFakeDefaultAuthAccount({
				key: Buffer.from('cc96c0a5db38b968f563e7af6fb435585c889111', 'hex'),
				value: {
					nonce: '0',
					numberOfSignatures: 0,
					mandatoryKeys: [],
					optionalKeys: [],
				},
			}),
			createFakeDefaultAuthAccount({
				key: Buffer.from('584dd8a902822a9469fb2911fcc14ed5fd98220d', 'hex'),
				value: {
					nonce: '0',
					numberOfSignatures: 0,
					mandatoryKeys: [],
					optionalKeys: [],
				},
			}),
		];
	});

	it('should get auth module substore entries Buffer', async () => {
		const response: AuthStoreEntryBuffer = await getAuthModuleEntryBuffer(accounts[0]);

		expect(Object.getOwnPropertyNames(response)).toEqual(['address', 'authAccount']);
		expect(response.address).toBeInstanceOf(Buffer);
		expect(Object.getOwnPropertyNames(response.authAccount)).toEqual([
			'numberOfSignatures',
			'mandatoryKeys',
			'optionalKeys',
			'nonce',
		]);
	});

	it('should get auth module substore entries', async () => {
		const authStoreEntries: AuthStoreEntryBuffer = await getAuthModuleEntryBuffer(accounts[0]);

		const response: GenesisAssetEntry = await getAuthModuleEntry(
			[authStoreEntries]
				.sort((a, b) => a.address.compare(b.address))
				.map(entry => ({
					...entry,
					address: getLisk32AddressFromAddress(entry.address, 'kly'),
				})),
		);

		const authDataSubstore = (response.data.authDataSubstore as unknown) as AuthStoreEntry[];

		expect(response.module).toEqual(MODULE_NAME_AUTH);
		expect(authDataSubstore).toHaveLength(1);
		expect(Object.getOwnPropertyNames(authDataSubstore[0])).toEqual(['address', 'authAccount']);
		authDataSubstore.forEach((asset: { address: string; authAccount: AuthAccountEntry }) => {
			expect(asset.address).toEqual(expect.stringMatching(ADDRESS_KLAYR32));
			expect(Object.getOwnPropertyNames(asset.authAccount)).toEqual([
				'numberOfSignatures',
				'mandatoryKeys',
				'optionalKeys',
				'nonce',
			]);
		});
	});
});
