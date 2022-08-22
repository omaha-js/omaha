import { BadRequestException, Body, Controller, Get, Post, UnauthorizedException } from '@nestjs/common';
import { AccountsService } from 'src/accounts/accounts.service';
import { ActionsService } from 'src/accounts/actions/actions.service';
import { UseRateLimit } from 'src/ratelimit/ratelimit.decorator';
import { User } from 'src/support/User';
import { AuthScopes } from './auth.scopes';
import { Guest } from './decorators/guest.decorator';
import { ActionDto } from './dto/ActionDto';
import { LoginDto } from './dto/LoginDto';
import { RegisterDto } from './dto/RegisterDto';
import { BaseToken } from './tokens/models/BaseToken';
import { TokensService } from './tokens/tokens.service';

@Controller('auth')
export class AuthController {

	public constructor(
		private readonly accounts: AccountsService,
		private readonly tokens: TokensService,
		private readonly actions: ActionsService
	) {}

	@Get('identity')
	@Guest()
	public async getIdentity(@User() token?: BaseToken) {
		if (token) {
			return {
				access: token.isForAccount() ? 'account' : 'repository',
				ttl: Math.floor(token.ttl / 1000),
				scopes: token.scopes,
				account: token.isForAccount() ? token.account : undefined,
			};
		}

		return {
			access: 'unauthenticated',
			scopes: []
		};
	}

	@Post('login')
	@Guest(false)
	@UseRateLimit('login', 5, 25, 25)
	public async login(@Body() dto: LoginDto) {
		const account = await this.accounts.login({
			email: dto.email ?? '',
			password: dto.password ?? ''
		});

		const token = await this.tokens.createWebToken(account, 86400 * 30);

		return {
			token,
			account
		};
	}

	@Post('register')
	@Guest(false)
	@UseRateLimit('register', 2, 5, 10)
	public async register(@Body() dto: RegisterDto) {
		const account = await this.accounts.createAccount(dto);
		const token = await this.tokens.createWebToken(account);

		return {
			token,
			account
		};
	}

	@Post('confirm')
	@Guest()
	@UseRateLimit(5, 10, 15)
	public async confirmEmail(@Body() dto: ActionDto) {
		const action = await this.actions.getAction<MetaConfirmEmail>(dto.token);

		if (action.account.email !== action.metadata.email) {
			throw new BadRequestException(`The account's email address has changed so this token is no longer valid`);
		}

		await this.accounts.setVerified(action.account, true);
		await this.actions.consumeAction(action);

		return {
			success: true,
			message: 'Your email address has been verified successfully! Thanks!'
		};
	}

	@Post('password_reset/request')
	@Guest(false)
	public async passwordResetRequest() {
		throw new UnauthorizedException();
	}

	@Post('password_reset/authorize')
	@Guest(false)
	public async passwordResetAuthorize() {
		throw new UnauthorizedException();
	}

	@Post('password_reset/submit')
	@Guest(false)
	public async passwordResetSubmit() {
		throw new UnauthorizedException();
	}

	@Get('scopes')
	@Guest()
	public async getScopes(@User() token?: BaseToken) {
		return {
			scopes: AuthScopes.map(scope => {
				return {
					...scope,
					active: token ? token.scopes.includes(scope.id) : false
				};
			})
		};
	}

}

interface MetaConfirmEmail {
	email: string;
}
