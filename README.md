<p align="center">
	<a href="https://github.com/omaha-js/omaha" target="_blank" rel="noopener noreferrer">
		<img width="180" src="https://i.bailey.sh/co96GjPYG6.png" alt="omaha logo">
	</a>
</p>
<br>
<p align="center">
	<a href="https://hub.docker.com/r/baileyherbert/omaha"><img src="https://img.shields.io/docker/v/baileyherbert/omaha?sort=semver" alt="docker image"></a>
	<a href="https://hub.docker.com/r/baileyherbert/omaha"><img src="https://img.shields.io/docker/image-size/baileyherbert/omaha?sort=semver" alt="docker image size"></a>
	<a href="https://github.com/omaha-js/omaha/blob/main/LICENSE.md"><img src="https://img.shields.io/github/license/omaha-js/omaha" alt="mit license"></a>
</p>
<p align="center">
  <a href="https://github.com/omaha-js/omaha" target="_blank" rel="noopener noreferrer">github</a> &nbsp;/&nbsp;
  <a href="https://hub.docker.com/r/baileyherbert/omaha" target="_blank" rel="noopener noreferrer">docker</a> &nbsp;/&nbsp;
  <a href="https://docs.bailey.sh/omaha/" target="_blank" rel="noopener noreferrer">documentation</a>
</p>

# omaha

A self-hosted software repository for app deployments and updates. I developed it out of frustration with managing updates for various software applications. Omaha's goal is to be the ultimate update manager for all applications, regardless of language or platform. It could also be used as a package manager.

- Allows creating multiple accounts and hosting multiple repositories on each
- Choose from `semantic`, `microsoft`, and `incremental` versioning per repository
- Choose from `local` (volume) or `remote` (Amazon S3, Backblaze, etc.) storage for release files
- Supports shared access to repositories with customizable permissions
- Supports API tokens with customizable permissions for repositories or entire accounts
- Supports both public and private repositories
- Supports rolling releases (reduce storage by automatically archiving older versions)
- Supports release tagging (such as `latest` and `next`)
- Supports release searches with constraints (such as `^1.0.0`)
- Supports multiple assets per release (such as `windows` and `linux` binaries)
- Supports websocket connections for realtime events

To support all of these features, `omaha` offers a complete REST API, a convenient web interface, a command line tool, as well as official clients in JavaScript and C# for interacting with the API.

## milestones

This is a work in progress – here's an overview of the current status:

- [x] REST API
- [ ] Web interface
- [ ] API client (JS)
- [ ] API client (C#)
- [ ] Docker deployment
- [ ] NuGet deployment

## license

MIT
