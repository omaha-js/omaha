/**
 * Describes the upload completion of a release attachment.
 */
export enum ReleaseAttachmentStatus {

	/**
	 * The attachment is currently being uploaded to storage.
	 */
	Pending = 'pending',

	/**
	 * The attachment has been uploaded to storage and is ready for use.
	 */
	Ready = 'ready',

	/**
	 * The attachment failed to upload and needs to be reuploaded (this ideally should never happen).
	 */
	Failed = 'failed',

}
