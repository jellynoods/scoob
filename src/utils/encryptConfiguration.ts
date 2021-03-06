import { PLACEHOLDER } from '../constants';
import {
	Configuration,
	KeyConfiguration,
	KeyConfigurationValue,
} from '../types';
import getProvider from './getProvider';
import isObject from './isObject';

export default async function encryptConfiguration(
	keys: KeyConfiguration,
	defaultKey: KeyConfigurationValue | undefined,
	configuration: Configuration,
	originalConfiguration: Configuration = {},
) {
	const entryPromises = Object.entries(configuration).map(
		async ([key, value]) => {
			// Note: We keep this as `any` intentionally to make this easier for us.
			const keyConfiguration = (keys[key] || defaultKey) as any;
			const provider = getProvider(keyConfiguration);

			if (value === PLACEHOLDER) {
				if (!originalConfiguration[key]) {
					throw new Error('moving encrypted values is not supported');
				}

				return [key, originalConfiguration[key]];
			} else if (isObject(value)) {
				return [
					key,
					await encryptConfiguration(
						keys[key],
						defaultKey,
						value,
						originalConfiguration[key] as Configuration,
					),
				];
			} else {
				return [key, await provider.encrypt(keyConfiguration, value)];
			}
		},
	);

	const encryptedConfiguration: Configuration = Object.fromEntries(
		await Promise.all(entryPromises),
	);

	return encryptedConfiguration;
}
