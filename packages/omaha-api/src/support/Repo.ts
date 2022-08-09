import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * This decorator can be applied to a parameter to inject the request's target repository.
 */
export const Repo = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest()._guardedRepository;
});
