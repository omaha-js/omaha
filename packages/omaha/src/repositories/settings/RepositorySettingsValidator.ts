import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { RepositorySettingsManager } from './RepositorySettingsManager';

@ValidatorConstraint({ name: 'customText', async: false })
export class RepositorySettingsValidator implements ValidatorConstraintInterface {
	validate(value: any, args: ValidationArguments) {
		return (
			typeof value === 'object' &&
			RepositorySettingsManager.validate(value)
		);
	}

	defaultMessage(args: ValidationArguments) {
		return `The $property property must be an object containing valid repository options and types`;
	}
}
