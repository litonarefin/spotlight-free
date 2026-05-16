<?php
namespace WPSPOTLIGHT\Libs;

use WPSPOTLIGHT\Inc\Utils;

// No, Direct access Sir !!!
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Assets' ) ) {

	/**
	 * Assets Class
	 *
	 * Jewel Theme <support@jeweltheme.com>
	 * @version     1.0.0
	 */
	class Assets {

		/**
		 * Constructor method
		 *
		 * @author Jewel Theme <support@jeweltheme.com>
		 */
		public function __construct() {
			add_action( 'wp_enqueue_scripts', array( $this, 'jltwp_spotlight_enqueue_scripts' ), 100 );
			add_action( 'admin_enqueue_scripts', array( $this, 'jltwp_spotlight_enqueue_scripts' ), 100 );
			add_action('elementor/editor/after_enqueue_scripts', [$this, 'jltwp_spotlight_enqueue_scripts'], 100);

			// Floating Icon add in Admin Bar Menu
			add_action( 'admin_bar_menu', [$this, 'jltwp_spotlight_add_admin_bar_items'], 50 );
		}


		public function detect_page_builder() {

			if(Utils::is_block_editor_page()) {
				return "gutenberg";
			}

			if(Utils::is_bricks_builder()) {
				return "bricks";
			}

			if(Utils::is_oxygen_builder_active()) {
				return "oxygen";
			}

			if(Utils::is_divi_builder_active()) {
				return "divi";
			}

			if (did_action('elementor/loaded')) {
				return "elementor";
			}
		}

		/**
		 * Get environment mode
		 *
		 * @author Jewel Theme <support@jeweltheme.com>
		 */
		public function get_mode() {
			return defined( 'WP_DEBUG' ) && WP_DEBUG ? 'development' : 'production';
		}

		/**
		 * Enqueue Scripts
		 *
		 * @method wp_enqueue_scripts()
		 */
		public function jltwp_spotlight_enqueue_scripts() {
			if(!Utils::check_user_is_admin()){
				return;
			}

			$adminify_active = false;
			if( Utils::is_plugin_active("adminify/adminify.php") || Utils::is_plugin_active("adminify-pro/adminify.php") ) {
				$adminify_active = true;
			}

			$admin_url         = is_network_admin() ? network_admin_url() : admin_url();
			$network_admin_url = (is_multisite() && !is_network_admin()) ? network_admin_url() : '';
			$update_available  = !empty(get_site_transient('update_core')) ? get_site_transient('update_core')->updates : '';

			// CSS Files .
			wp_enqueue_style('wp-spotlight', WPSPOTLIGHT_ASSETS . 'css/wp-spotlight.css', array('dashicons'), WPSPOTLIGHT_VER, 'all');
			wp_enqueue_style('wp-spotlight-form', WPSPOTLIGHT_ASSETS . 'css/wp-spotlight-form.css', array('dashicons'), WPSPOTLIGHT_VER, 'all');

			// JS Files .
			wp_enqueue_script('wp-spotlight', WPSPOTLIGHT_ASSETS . 'js/wp-spotlight.js', array('jquery',), WPSPOTLIGHT_VER, true);

			wp_localize_script(
				'wp-spotlight',
				'WPSPOTLIGHT_CORE',
				array(
					'is_frontend'       => (is_admin()) ? false : true,
					'admin_ajax'        => admin_url('admin-ajax.php'),
					'admin_url'         => esc_url_raw( $admin_url ),
					'network_admin_url' => esc_url_raw($network_admin_url ),
					'apiNonce'          => wp_create_nonce('wp_rest'),
					'root'              => rest_url('wpspotlight/v1' . '/'),
					'home_url'          => site_url('/'),
					'logout_url'        => wp_logout_url(),
					'tour_status'       => get_option('_wpspotlight_tour_completed'),
					'page_editor'       => $this->detect_page_builder(),
					'adminify_ui'       => $adminify_active,
					'mode'				=> get_option('_spotlight_dark_light_mode'),
					'is_multisite'      => (is_multisite()) ? true : false,
					'wp_version'        => $update_available,
					'is_premium'        => jltwp_spotlight_is_premium(),
					'is_plan'           => jltwp_spotlight_is_plan(),
				)
			);
		}

		/**
		* Add a new admin bar menu item.
		*
		* @param WP_Admin_Bar $admin_bar Admin bar reference.
		*/
	   public function jltwp_spotlight_add_admin_bar_items( $admin_bar ) {
		   	// Run admin bar code here. Will run on both frontend and backend.
			$spotlight_icon = '<span style=display:flex;align-items:center;justify-content:center;height:100%;cursor:pointer><svg fill=none height=20 viewBox="0 0 20 20"width=20 xmlns=http://www.w3.org/2000/svg><path d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z"fill=url(#paint0_linear_0_1) /><path d="M8.58638 6.84687L5.81763 8.20312L5.702 7.95312C5.58638 7.70624 5.69263 7.41249 5.9395 7.29687L5.89888 7.31562L5.43638 6.32499C5.36763 6.17499 5.33325 6.01875 5.33325 5.8625C5.33325 5.45 5.56763 5.05937 5.9645 4.87187C6.51138 4.61562 7.16138 4.85312 7.4145 5.4L7.877 6.39062L7.83638 6.40937C8.08325 6.29687 8.377 6.40312 8.49263 6.64999L8.58325 6.84687H8.58638Z"fill=#10102D /><path d="M6.2832 8.33124L8.26133 14.7625H8.26445H8.29883L14.602 14.7812L8.50508 7.24374L6.2832 8.33124Z"fill=url(#paint1_linear_0_1) /><path d="M11.4426 15.2312C13.1961 15.2312 14.6176 15.0214 14.6176 14.7625C14.6176 14.5036 13.1961 14.2937 11.4426 14.2937C9.68907 14.2937 8.26758 14.5036 8.26758 14.7625C8.26758 15.0214 9.68907 15.2312 11.4426 15.2312Z"fill=#10102D /><defs><linearGradient gradientUnits=userSpaceOnUse id=paint0_linear_0_1 x1=10 x2=10 y1=0 y2=20><stop stop-color=#F4F3FF /><stop stop-color=#BDB4FE offset=1 /></linearGradient><linearGradient gradientUnits=userSpaceOnUse id=paint1_linear_0_1 x1=7.19883 x2=12.0707 y1=7.44062 y2=15.8781><stop stop-color=#10102D /><stop stop-color=white offset=1 stop-opacity=0 /></linearGradient></defs></svg></span>';

		   	$admin_bar->add_menu(
			   	array(
					'id'     => 'jltwp_spotlight_floating_menu',
					'parent' => 'top-secondary',
					'title'  => $spotlight_icon,
					'href'   => false,
					'meta'   => array(
						'class' => 'jltwp_spotlight_floating_icon',
						'title' => 'Open Spotlight',
					),
			   	)
		   	);
	   }

	}
}