<?php
namespace WPSPOTLIGHT\Inc\Classes;

use WPSPOTLIGHT\Libs\Helper;
use WPSPOTLIGHT\Inc\Classes\Notifications\Base\Date;


// No, Direct access Sir !!!
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Upgrade to Pro Class
 *
 * Jewel Theme <support@jeweltheme.com>
 */
class Pro_Upgrade {

	use Date;

	public $slug;

	protected $data = array();

	/**
	 * Construct method
	 */
	public function __construct() {
		$this->slug = Helper::jltwp_spotlight_slug_cleanup();

		$this->maybe_sync_remote_data();
		$this->register_sync_hook();
		$this->set_data();

		add_action( 'admin_footer', array( $this, 'display_popup' ) );

		add_action( 'wp_dashboard_setup', array( $this, 'dashboard_widget' ) );
	}

	/**
	 * Register Dashboard widget
	 *
	 * @return void
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function dashboard_widget() {
		wp_add_dashboard_widget(
			'jltwp_spotlight_dashboard_widget',                          // Widget slug.
			esc_html__( 'Spotlight News & Updates', 'spotlight' ), // Title.
			array( $this, 'dashboard_widget_render' )                    // Display function.
		);

		// Globalize the metaboxes array, this holds all the widgets for wp-admin.
		global $wp_meta_boxes;

		// Get the regular dashboard widgets array
		// (which already has our new widget but appended at the end).
		$default_dashboard = $wp_meta_boxes['dashboard']['normal']['core'];

		// Backup and delete our new dashboard widget from the end of the array.
		$example_widget_backup = array( 'jltwp_spotlight_dashboard_widget' => $default_dashboard['jltwp_spotlight_dashboard_widget'] );
		unset( $default_dashboard['jltwp_spotlight_dashboard_widget'] );

		// Merge the two arrays together so our widget is at the beginning.
		$sorted_dashboard = array_merge( $example_widget_backup, $default_dashboard );

		// Save the sorted array back into the original metaboxes .
		$wp_meta_boxes['dashboard']['normal']['core'] = $sorted_dashboard;
	}

	/**
	 * Render dashboard widget
	 *
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function dashboard_widget_render() {
		include_once ABSPATH . WPINC . '/feed.php';

		$feed_url = 'https://jeweltheme.com/feed.xml';

		// Get a SimplePie feed object from the specified feed source .
		$rss      = fetch_feed( $feed_url );
		$maxitems = 0;

		if ( ! is_wp_error( $rss ) ) { // Checks that the object is created correctly .
			// Figure out how many total items there are, and choose a limit .
			$maxitems = $rss->get_item_quantity( 5 );

			// Build an array of all the items, starting with element 0 (first element).
			$rss_items = $rss->get_items( 0, $maxitems );

			// Get RSS title .
			$rss_title = '<a href="' . $rss->get_permalink() . '" target="_blank">' . strtoupper( $rss->get_title() ) . '</a>';
		}

		// Display the container .
		echo '<div class="jltwp_spotlight-rss-widget">';

		if ( wp_validate_boolean( $this->get_content( 'is_live' ) ) ) { ?>

			<div class="jltwp_spotlight-dashboard-promo" style="--jltpmd-popup-color: <?php echo esc_attr( $this->get_content( 'btn_color' ) ); ?>;">
				<a target="_blank" href="<?php echo esc_url( $this->get_content( 'button_url' ) ); ?>">
					<img src="<?php echo esc_url( $this->get_content( 'image_url' ) ); ?>" alt="Spotlight Promo Image" style="width: 100%; height: auto;">
				</a>

				<a class="jltwp_spotlight-popup-button" target="_blank" href="<?php echo esc_url( $this->get_content( 'button_url' ) ); ?>">
					<?php echo esc_html( $this->get_content( 'button_text' ) ); ?>
				</a>
			</div>

			<?php
		}

		// Starts items listing within <ul> tag
		// Check items .
		if ( ! empty( $maxitems ) ) {
			echo '<ul>';
			// Loop through each feed item and display each item as a hyperlink.
			foreach ( $rss_items as $item ) {
				// Uncomment line below to display non human date
				// $item_date = $item->get_date( get_option('date_format').' @ '.get_option('time_format') ); .

				// Get human date (comment if you want to use non human date) .
				$item_date = human_time_diff( $item->get_date( 'U' ), current_time( 'timestamp' ) ) . ' ' . __( 'ago', 'spotlight' );

				// Start displaying item content within a <li> tag .
				echo '<li>';
				// create item link .
				echo '<a href="' . esc_url( $item->get_permalink() ) . '" title="' . esc_attr( $item_date ) . '" target="_blank">';
				// Get item title .
				echo esc_html( $item->get_title() );
				echo '</a>';
				// Display date .
				echo ' <span class="rss-date">' . esc_html( $item_date ) . '</span><br />';
				// Get item content .
				$content = $item->get_content();
				// Shorten content .
				$content = wp_html_excerpt( $content, 120 ) . ' [...]';
				// Display content .
				echo esc_html( $content );
				// End <li> tag .
				echo '</li>';
			}
			echo '</ul>';
			// End <ul> tag .
		}
		?>

		<div class="jltwp_spotlight-dashboard_footer">
			<ul>
				<li class="jltwp_spotlight-overview__blog">
                    <a href="http://jeweltheme.com/blog" target="_blank">
                        Blog
                        <span class="screen-reader-text">
                            <?php echo esc_html__( '(opens in a new window)', 'spotlight' ); ?>
                        </span>
                        <span aria-hidden="true" class="dashicons dashicons-external"></span>
                    </a>
                </li>
                
			</ul>
		</div>
		<style>
			/* News Dashboard Widget */
			.jltwp_spotlight-rss-widget .hndle.ui-sortable-handle img {
				margin: -5px 10px -5px 0;
			}

			.jltwp_spotlight-rss-widget .jltwp_spotlight-dashboard_footer {
				margin: 0 -12px -12px;
				padding: 0 12px;
				border-top: 1px solid #eee;
			}

			.jltwp_spotlight-rss-widget .jltwp_spotlight-dashboard_footer ul {
				display: flex;
				list-style: none;
			}

			.jltwp_spotlight-rss-widget .jltwp_spotlight-dashboard_footer ul li:first-child {
				padding-left: 0;
				border: none;
			}

			.jltwp_spotlight-rss-widget .jltwp_spotlight-dashboard_footer li {
				padding: 0 10px;
				margin: 0;
				border-left: 1px solid #ddd;
			}

			.jltwp_spotlight-rss-widget .jltwp_spotlight-overview__go-pro a {
				color: #FCB92C;
				font-weight: 500;
			}
		</style>

		<?php
		echo '</div>';
	}


	/**
	 * Set merged data
	 *
	 * @return void
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function set_data() {
		$this->data = Helper::get_merged_data( self::get_data() );
	}

	/**
	 * Get Sheet data
	 *
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public static function get_data() {
		return get_option( 'jltwp_spotlight_sheet_promo_data' );
	}

	/**
	 * Get Contents
	 *
	 * @param [type] $key .
	 *
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function get_content( $key ) {
		if( empty( $this->data ) ) return;
		return $this->data[ $key ];
	}

	/**
	 * Get Option has data
	 *
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function get_data_hash() {
		return get_option( 'jltwp_spotlight_sheet_promo_data_hash' );
	}

	/**
	 * Sync to remote data
	 *
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function maybe_sync_remote_data() {
		$data = self::get_data();

		if ( empty( $data ) ) {
			$this->sheet_data_remote_sync();
		}
	}

	/**
	 * Register Sync hook
	 *
	 * @return void
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function register_sync_hook() {
		$hook_action = 'jltwp_spotlight_sheet_promo_data_remote_sync';
		add_action( $hook_action, array( $this, 'sheet_data_remote_sync' ) );

		if ( ! wp_next_scheduled( $hook_action ) ) {
			wp_schedule_event( time(), 'daily', $hook_action );
		}

		register_deactivation_hook( WPSPOTLIGHT_FILE, array( $this, 'clear_register_sync_hook' ) );
	}

	/**
	 * Clear register sync hook
	 *
	 * @return void
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function clear_register_sync_hook() {
		wp_clear_scheduled_hook( 'jltwp_spotlight_sheet_promo_data_remote_sync' );
	}

	/**
	 * Data sync with remote
	 *
	 * @return void
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function sheet_data_remote_sync() {
		$data  = self::get_data();
		$force = empty( $data );

		$remote_data = $this->get_update_remote_data();

		// Don't clobber stored data when the API is unreachable / returned nothing.
		if ( false === $remote_data ) {
			return;
		}

		$stored_hash = $this->get_data_hash();
		$remote_hash = base64_encode( json_encode( $remote_data ) );

		if ( $force || $stored_hash !== $remote_hash ) {
			update_option( 'jltwp_spotlight_sheet_promo_data', $remote_data );
			update_option( 'jltwp_spotlight_sheet_promo_data_hash', $remote_hash );
			do_action( 'jltwp_spotlight_sheet_promo_data_reset' );
		}
	}

	/**
	 * Update REST API base URL
	 *
	 * Development points to the local update service; production uses the
	 * Jewel Theme API endpoint. Override either with the `jltpmd_endpoint` filter.
	 *
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function get_api_base() {
		$base = 'https://pixarlabs.com/';
		return trailingslashit( apply_filters( 'jltwp_spotlight_endpoint', $base ) );
	}

	/**
	 * Update endpoint URL for this plugin
	 *
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function get_update_url() {
		return esc_url( $this->get_api_base() . 'api/plugin/update/' . Helper::jltwp_spotlight_slug_cleanup() );
	}

	/**
	 * Promotional remote data (REST API)
	 *
	 * Expects a single JSON object describing the update, e.g.
	 * { product_name, product_slug, image_url, start_date, end_date,
	 *   button_text, button_url, btn_color, notice, show_for_premium, is_live }
	 *
	 * @return array|false
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function get_update_remote_data() {
		$response = wp_remote_get(
			$this->get_update_url(),
			array(
				'timeout' => 15,
				'headers' => array( 'Accept' => 'application/json' ),
			)
		);

		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		$body = wp_remote_retrieve_body( $response );

		if ( ! $body ) {
			return false;
		}

		$data = json_decode( $body, true );

		if ( ! is_array( $data ) || JSON_ERROR_NONE !== json_last_error() ) {
			return false;
		}

		// API may return the update directly, or wrapped (e.g. { data: {...} }) / as a list.
		if ( isset( $data['data'] ) && is_array( $data['data'] ) ) {
			$data = $data['data'];
		}

		if ( isset( $data[0] ) && is_array( $data[0] ) ) {
			$data = wp_list_filter( $data, array( 'product_slug' => Helper::jltwp_spotlight_slug_cleanup() ) );
			$data = $data ? array_values( $data )[0] : array();
		}

		if ( empty( $data ) || empty( $data['product_slug'] ) ) {
			return false;
		}

		// Only accept a update that targets this plugin.
		if ( Helper::jltwp_spotlight_slug_cleanup() !== $data['product_slug'] ) {
			return false;
		}

		// API sends dates as "d/m/Y h:i a" — normalise so PHP/JS date parsers don't choke.
		foreach ( array( 'start_date', 'end_date' ) as $key ) {
			if ( ! empty( $data[ $key ] ) ) {
				$data[ $key ] = $this->normalize_date( $data[ $key ] );
			}
		}

		return $data;
	}

	/**
	 * Normalise a update date string to 'Y-m-d H:i:s'
	 *
	 * Accepts d/m/Y (optionally with 12h time) and a few common fallbacks.
	 * Returns the original value untouched if it cannot be parsed.
	 *
	 * @param string $value .
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function normalize_date( $value ) {
		$value   = trim( (string) $value );
		$formats = array( 'd/m/Y h:i a', 'd/m/Y H:i', 'd/m/Y', 'd-m-Y H:i:s', 'd-m-Y' );

		foreach ( $formats as $format ) {
			$dt = \DateTime::createFromFormat( $format, $value );

			if ( $dt instanceof \DateTime ) {
				return $dt->format( 'Y-m-d H:i:s' );
			}
		}

		$ts = strtotime( $value );

		return $ts ? gmdate( 'Y-m-d H:i:s', $ts ) : $value;
	}

	/**
	 * Display popup contents
	 *
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function display_popup() {
		$image_url = $this->get_content( 'image_url' );

		?>

		<div class="jltwp_spotlight-popup jltwp_spotlight-upgrade-popup" id="jltwp_spotlight-popup" data-plugin="<?php echo esc_attr( $this->slug ); ?>" tabindex="1" style="display: none;">

			<div class="jltwp_spotlight-popup-overlay"></div>

			<div class="jltwp_spotlight-popup-modal" style="background-image: url('<?php echo esc_url( $image_url ); ?>'); --jltwp_spotlight-popup-color: <?php echo esc_attr( $this->get_content( 'btn_color' ) ); ?>;">

				<!-- close  -->
				<div class="jltwp_spotlight-popup-modal-close popup-dismiss">×</div>

				<!-- content section  -->
				<div class="jltwp_spotlight-popup-modal-footer">

					<!-- countdown  -->
					<div class="jltwp_spotlight-popup-countdown" style="display: none;">
						<span class="jltwp_spotlight-popup-countdown-text">Deal Ends In</span>
						<div class="jltwp_spotlight-popup-countdown-time">
							<div>
								<span data-counter="days">00</span>
								<span>Days</span>
							</div>
							<span>:</span>
							<div>
								<span data-counter="hours">00</span>
								<span>Hours</span>
							</div>
							<span>:</span>
							<div>
								<span data-counter="minutes">00</span>
								<span>Minutes</span>
							</div>
							<span>:</span>
							<div>
								<span data-counter="seconds">00</span>
								<span>Seconds</span>
							</div>
						</div>
					</div>

					<!-- button  -->
					<a class="jltwp_spotlight-popup-button" target="_blank" href="<?php echo esc_url( $this->get_content( 'button_url' ) ); ?>"><?php echo esc_html( $this->get_content( 'button_text' ) ); ?></a>
				</div>
			</div>
		</div>

		<script>
			var $container = jQuery('#jltwp_spotlight-popup'),
				plugin_data = <?php echo wp_json_encode( $this->data ); ?>,
				events = {}; //Events

			// Update Counter
			function updateCounter(seconds) {
				const $counter = $container.find(".jltwp_spotlight-popup-countdown-time");
				const $days = $counter.find("[data-counter='days']");
				const $hours = $counter.find("[data-counter='hours']");
				const $minutes = $counter.find("[data-counter='minutes']");
				const $seconds = $counter.find("[data-counter='seconds']");
				const days = Math.floor(seconds / (3600 * 24));
				seconds -= days * 3600 * 24;
				const hrs = Math.floor(seconds / 3600);
				seconds -= hrs * 3600;
				const mnts = Math.floor(seconds / 60);
				seconds -= mnts * 60;

				$days.text(days);
				$hours.text(hrs);
				$minutes.text(mnts);
				$seconds.text(seconds);
			}

			// Trigger Event
			function trigger(event, args = []) {
				if (typeof(events[event]) !== 'undefined') {
					events[event].forEach(callback => {
						callback.apply(this, args);
					});
				}
			}

			// initCounter
			function initCounter(last_date) {
				$container.find(".jltwp_spotlight-popup-countdown-time").show();

				const countdown = () => {

					// system time
					const now = new Date().getTime();

					// set end time to 11:59:59 PM
					const endDate = new Date(last_date);
					endDate.setHours(23);
					endDate.setMinutes(59);
					endDate.setSeconds(59);

					const seconds = Math.floor((endDate.getTime() - now) / 1000);

					if (seconds < 0) {
						return false;
					}

					updateCounter(seconds);

					return true;
				}

				let result = countdown();


				if (result) {
					trigger("countdownStart", [plugin_data]);
					$container.find(".jltwp_spotlight-popup-countdown").show(0);
				} else {
					trigger("countdownFinish", [plugin_data]);
					$container.find(".jltwp_spotlight-popup-countdown").hide(0);
				}

				// update counter every 1 second
				const counter = setInterval(() => {

					const result = countdown();

					if (!result) {
						clearInterval(counter);
						trigger("counter_end", [plugin_data]);
						$container.find(".jltwp_spotlight-popup-countdown").hide(0);
					}

				}, 1000);
			}

			initCounter( '<?php echo esc_attr( $this->counter_date() ); ?>' );
		</script>

		<?php
	}

	/**
	 * Counter Date
	 *
	 * @author Jewel Theme <support@jeweltheme.com>
	 */
	public function counter_date() {
		$endDate = $this->get_content( 'end_date' );

		$is_active = $this->date_is_current_or_next( $endDate );

		if ( $is_active ) {
			return $endDate;
		}

		return $this->date_increment( $this->current_time(), 3 );
	}
}