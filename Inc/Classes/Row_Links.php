<?php
namespace WPSPOTLIGHT\Inc\Classes;

use WPSPOTLIGHT\Libs\RowLinks;

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

if ( ! class_exists( 'Row_Links' ) ) {
	/**
	 * Row Links Class
	 *
	 * Jewel Theme <support@jeweltheme.com>
	 */
	class Row_Links extends RowLinks {

		public $is_active;
		public $is_free;

		/**
		 * Construct method
		 *
		 * @author Jewel Theme <support@jeweltheme.com>
		 */
		public function __construct() {
			parent::__construct();

			$this->is_active = false;
			$this->is_free   = true;
		}


		/**
		 * Plugin action links
		 *
		 * @param [type] $links .
		 *
		 * @author Jewel Theme <support@jeweltheme.com>
		 */
		public function plugin_action_links( $links ) {

			$docs_url = 'https://wpspotlight.pro/docs/spotlight/plugin-installation-activation';

			$links['settings'] = apply_filters(
				'wp_spotlight_settings_link',
				sprintf(
					'<a class="wp-spotlight-settings" id="wp-spotlight-settings" href="#">%1$s</a>',
					__('Key Bindings', 'spotlight')
				)
			);

			$links['docs'] = apply_filters(
				'wp_spotlight_docs_link',
				sprintf(
					'<a class="wp-spotlight-docs" href="%1$s" target="_blank">%2$s</a>',
					esc_url($docs_url),
					__('Docs', 'spotlight')
				)
			);

			return apply_filters('wp_spotlight_links', $links);
		}

	}
}