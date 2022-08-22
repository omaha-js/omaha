import { Controller, Get } from '@nestjs/common';
import { Environment } from './app.environment';

@Controller()
export class AppController {

	@Get('/constants')
	public getAppConstants() {
		return {
			app_name: Environment.APP_NAME,
			app_url: Environment.APP_URL,
			allows_registration: !Environment.DISABLE_REGISTRATION
		};
	}

}
