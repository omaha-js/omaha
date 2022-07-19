import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * This decorator can be applied to a parameter to inject the request's current user.
 */
export const User = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user;
});
