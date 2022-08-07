import { Attribute, AttributeMethodEvent } from '@baileyherbert/reflection';
import { ReleaseJobKey } from './queue.service';

export const QueueWorker = Attribute.create(class QueueWorkerAttribute extends Attribute {
	public constructor(public readonly job: ReleaseJobKey) { super(); }
	public override onMethod(event: AttributeMethodEvent<Object, any>) {}
});

export const QueueCleaner = Attribute.create(class QueueWorkerAttribute extends Attribute {
	public constructor(public readonly job: ReleaseJobKey) { super(); }
	public override onMethod(event: AttributeMethodEvent<Object, any>) {}
});
