<script lang="ts">
	import { router } from 'tinro';
</script>

<div class="sidebar-switcher">
	<div class="switcher-background"></div>
	<div class="switcher-container">
		<div class="sidebar-icon">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
				<path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3zm-8.322.12C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139z"/>
			</svg>
			<div class="spinner-border spinner-border-sm d-none">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
		<div class="active-name" class:inactive={true}>
			None selected
		</div>
		<div class="caret">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
				<path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
			</svg>
		</div>
	</div>
	<div class="switcher-panel">
		<div class="products">
			<ul>
				<!-- @foreach ($this->getProducts() as $product)
					<li>
						<a href="@link($this->getLink($product->id))" class="jq-hover switcher-row {{ $product == $this->getProduct() ? 'active' }}">
							<div class="row-icon">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
									<path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3zm-8.322.12C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139z"/>
								</svg>
							</div>
							<div class="row-label">
								{{ $product->name }}
							</div>
						</a>
					</li>
				@end -->
			</ul>
		</div>
		<div class="options">
			<ul>
				<li>
					<a href="#createnew">
						<div class="row-icon">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
								<path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
							</svg>
						</div>
						<div class="row-label">
							Create new product
						</div>
					</a>
				</li>
			</ul>
		</div>
	</div>
</div>
