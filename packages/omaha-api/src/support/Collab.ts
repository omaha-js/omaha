import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * This decorator can be applied to a parameter to inject the collaboration for the request's target repository.
 */
export const Collab = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest()._guardedCollaboration;
});
