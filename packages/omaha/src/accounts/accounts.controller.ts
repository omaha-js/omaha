import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { AccountToken } from 'src/auth/tokens/models/AccountToken';
import { User } from 'src/support/User';
import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dto/UpdateAccountDto';

@Controller('account')
export class AccountsController {

	public constructor(private readonly service: AccountsService) {}

	@Get()
	@UseScopes('account.settings.read')
	public showAccountOverview(@User() token: AccountToken) {
		return token.account;
	}

	@Patch()
	@UseScopes('account.settings.manage')
	public async updateAccount(@User() token: AccountToken, @Body() dto: UpdateAccountDto) {
		if (dto.name !== undefined) {
			await this.service.setAccountName(token.account, dto.name);
		}

		if (dto.email !== undefined) {
			await this.service.setAccountEmail(token.account, dto.email);
		}

		if (dto.password !== undefined) {
			await this.service.setAccountPassword(token.account, dto.password);
		}

		return token.account;
	}

}
