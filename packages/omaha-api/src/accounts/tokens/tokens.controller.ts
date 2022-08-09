import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { AccountToken } from 'src/auth/tokens/models/AccountToken';
import { TokensService } from 'src/auth/tokens/tokens.service';
import { TokenType } from 'src/entities/enum/TokenType';
import { User } from 'src/support/User';
import { CreateAccountTokenDto } from './dto/CreateAccountTokenDto';
import { UpdateAccountTokenDto } from './dto/UpdateAccountTokenDto';

@Controller('account/tokens')
export class TokensController {

	public constructor(
		private readonly service: TokensService
	) {}

	@Get()
	@UseScopes('account.tokens.list')
	public async getTokens(@User() token: AccountToken) {
		return token.account.tokens;
	}

	@Post()
	@UseScopes('account.tokens.manage')
	public async createToken(@User() token: AccountToken, @Body() params: CreateAccountTokenDto) {
		const scopes = params.scopes.filter(scope => token.hasPermission(scope));

		return await this.service.createDatabaseToken({
			name: params.name,
			description: params.description,
			expiration: params.expiration,
			type: TokenType.Account,
			account: token.account,
			scopes
		});
	}


	@Get(':id')
	@UseScopes('repo.tokens.list')
	public async getToken(@User() token: AccountToken, @Param('id') id: string) {
		const match = await this.service.getDatabaseTokenForAccount(token.account, id);

		if (!match) {
			throw new NotFoundException('No token matching the given ID was found');
		}

		return match;
	}

	@Patch(':id')
	@UseScopes('repo.tokens.manage')
	public async updateToken(@User() token: AccountToken, @Body() params: UpdateAccountTokenDto, @Param('id') id: string) {
		const match = await this.service.getDatabaseTokenForAccount(token.account, id);

		if (!match) {
			throw new NotFoundException('No token matching the given ID was found');
		}

		params.scopes = params.scopes.filter(scope => token.hasPermission(scope));
		return await this.service.updateDatabaseToken(match, params);
	}

	@Delete(':id')
	@UseScopes('repo.tokens.manage')
	public async deleteToken(@User() token: AccountToken, @Param('id') id: string) {
		const match = await this.service.getDatabaseTokenForAccount(token.account, id);

		if (!match) {
			throw new NotFoundException('No token matching the given ID was found');
		}

		await this.service.deleteDatabaseToken(match);

		return {
			success: true,
			message: 'Token has been deleted successfully.'
		};
	}

}
