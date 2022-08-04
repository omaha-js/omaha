/**
 * Defines the current status of a release (draft, published, archived).
 */
export enum ReleaseStatus {

	/**
	 * The release is a draft and has not been finalized – its attachments and details are subject to change.
	 */
	Draft = 'draft',

	/**
	 * The release has been finalized and published – its attachments cannot be changed.
	 */
	Published = 'published',

	/**
	 * The release has been archived – its details will remain in the database but it can no longer be downloaded, and
	 * its stored attachments will be deleted from storage.
	 */
	Archived = 'archived',

}
