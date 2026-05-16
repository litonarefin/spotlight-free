<?php

namespace WPSPOTLIGHT\Inc\Classes\Api;

// No, Direct access Sir !!!
if (! defined('ABSPATH')) {
    exit;
}

/**
 * Updates
 *
 * @author Jewel Theme <support@jeweltheme.com>
 */
class Updates
{
    private static $instance = null;

    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        add_action('rest_api_init', [$this, 'register_routes']);
    }


    public function register_routes() {

        /**
         * WordPress Plugins Update
         *
         */
        register_rest_route('wpspotlight/v1', '/update-plugin', [
            'methods' => 'POST',
            'callback' => [$this, 'update_plugin_by_slug'],
            'permission_callback' => function () {
                if( is_multisite() ){
                    if( is_super_admin() ){
                        return true;
                    }else{
                        return false;
                    }
                }else {
                    return current_user_can('update_plugins');
                }
            },
            'args' => [
                'plugin_slug' => [
                    'required' => true,
                    'validate_callback' => function ($param) {
                        return !empty($param);
                    }
                ],
            ],
        ]);

        register_rest_route('wpspotlight/v1', '/update-all-plugins', [
            'methods'             => 'POST',
            'callback'            => [$this, 'update_all_plugins'],
            'permission_callback' => [$this, "check_permissions"]
        ]);


        register_rest_route('wpspotlight/v1', '/plugins-with-updates', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_plugins_with_updates'],
            // 'permission_callback' => Utils::check_permissions(),
            'permission_callback' => [$this, "check_permissions_for_view"]
        ]);

        /**
         * WordPress Themes Update
         */
        register_rest_route('wpspotlight/v1', '/themes-with-updates', [
            'methods'             => 'GET',
            'callback'            => [$this, 'list_themes_with_updates'],
            'permission_callback' => [$this, 'check_permissions_for_view'],
        ]);

        register_rest_route('wpspotlight/v1', '/update-theme', [
            'methods'             => 'POST',
            'callback'            => [$this, 'update_theme_by_slug'],
            'permission_callback' => [$this, 'check_permissions'],
            'args' => [
                'slug' => [
                    'required'          => true,
                    'validate_callback' => function ($param) {
                        return !empty($param) && is_string($param);
                    }
                ]
            ]
        ]);
    }

    // Check REST API permissions
    public static function check_permissions()
    {
        if( is_multisite() ){
            if( is_super_admin() ){
                return true;
            }else{
                return false;
            }
        }else if (current_user_can('manage_options') || current_user_can('manage_woocommerce')) {
            return true;
        } else {
            return false;
        }
    }

    // Check REST API permissions
    public static function check_permissions_for_view()
    {
        if (current_user_can('manage_options') || current_user_can('manage_woocommerce')) {
            return true;
        } else {
            return false;
        }
    }

    // Callback function for the REST API to get plugins with updates
    public static function get_plugins_with_updates()
    {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        if (!function_exists('wp_update_plugins')) {
            require_once ABSPATH . 'wp-includes/update.php';
        }

        // Force WordPress to check for updates
        wp_update_plugins();

        // Get the update data
        $update_plugins = get_site_transient('update_plugins');
        $all_plugins = get_plugins();
        $plugins_with_updates = [];

        foreach ($all_plugins as $plugin_file => $plugin_data) {
            // Check if an update is available for this plugin
            if (isset($update_plugins->response[$plugin_file])) {
                $plugin_update = $update_plugins->response[$plugin_file];
                // $plugin_slug = explode('/', $plugin_file);

                // Add plugin details to the array
                $plugins_with_updates[] = [
                    'title' => $plugin_data['Name'],
                    'slug'  => $plugin_update->slug,
                    'current_version' => $plugin_data['Version'],
                    'new_version' => $plugin_update->new_version,
                    'plugin_file' => $plugin_file,
                    'update_url' => admin_url("update.php?action=upgrade-plugin&plugin=" . urlencode($plugin_file)),
                ];
            }
        }

        return rest_ensure_response([
            'status' => 'success',
            'plugins' => $plugins_with_updates
        ]);
    }



    // Function to update all plugins
    public static function update_all_plugins()
    {
        // Include necessary WordPress files
        if (!function_exists('request_filesystem_credentials')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
            require_once ABSPATH . 'wp-admin/admin.php'; // Ensure admin functions like show_message() are loaded
        }

        // Set up the filesystem API
        $url = wp_nonce_url(admin_url('update.php?action=update-plugin'));
        $creds = request_filesystem_credentials($url);
        if (!WP_Filesystem($creds)) {
            return new \WP_Error('filesystem_error', 'Could not access the filesystem. Please ensure the server can write to the file system.');
        }

        // Get all installed plugins
        $all_plugins = get_plugins();
        $upgrader = new \Plugin_Upgrader();
        $results = [];

        foreach ($all_plugins as $plugin_file => $plugin_data) {
            // Check if the plugin has an update available
            $update_plugins = get_site_transient('update_plugins');
            if (isset($update_plugins->response[$plugin_file])) {
                $result = $upgrader->upgrade($plugin_file);
                if (is_wp_error($result)) {
                    $results[] = [
                        'plugin' => $plugin_data['Name'],
                        'status' => 'error',
                        'message' => $result->get_error_message()
                    ];
                } else {
                    $results[] = [
                        'plugin' => $plugin_data['Name'],
                        'status' => 'success',
                        'message' => 'Plugin updated successfully.'
                    ];
                }
            } else {
                $results[] = [
                    'plugin' => $plugin_data['Name'],
                    'status' => 'no_update',
                    'message' => 'No update available.'
                ];
            }
        }

        return rest_ensure_response([
            'status' => 'completed',
            'results' => $results
        ]);
    }



    public static function update_plugin_by_slug($request)
    {
        global $wp_filesystem;

        // Initialize the WP_Filesystem API
        if (!function_exists('WP_Filesystem')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        WP_Filesystem();

        $plugin_slug = sanitize_text_field($request->get_param('plugin_slug'));

        // Ensure necessary files are included
        if (!function_exists('plugins_api')) {
            require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
        }

        // Get plugin information from the WordPress.org API
        $api = plugins_api('plugin_information', ['slug' => $plugin_slug]);
        if (is_wp_error($api)) {
            return new \WP_Error('plugin_not_found', 'Plugin not found on WordPress.org.', ['status' => 404]);
        }

        // Find the plugin file path
        $installed_plugins = get_plugins();
        $plugin_file = null;
        foreach ($installed_plugins as $file => $plugin_data) {
            if (strpos($file, $plugin_slug . '/') === 0) {
                $plugin_file = $file;
                break;
            }
        }

        if (!$plugin_file) {
            return new \WP_Error('plugin_not_installed', 'Plugin is not installed on this site.', ['status' => 404]);
        }

        // Download the plugin zip file
        $download_url = $api->download_link;
        $temp_file = download_url($download_url);

        if (is_wp_error($temp_file)) {
            return new \WP_Error('download_failed', 'Failed to download plugin: ' . $temp_file->get_error_message(), ['status' => 500]);
        }

        // Prepare the destination for extraction
        $plugins_dir = WP_PLUGIN_DIR . '/';
        $result = unzip_file($temp_file, $plugins_dir);

        // Delete the temporary file
        wp_delete_file($temp_file);

        if (is_wp_error($result)) {
            return new \WP_Error('unzip_failed', 'Failed to unzip plugin: ' . $result->get_error_message(), ['status' => 500]);
        }

        // Ensure plugin is reloaded and available
        wp_clean_plugins_cache();

        // Check that the plugin was installed and is active
        if (is_plugin_active($plugin_file)) {
            deactivate_plugins($plugin_file); // Optional: deactivate before reactivating
            activate_plugin($plugin_file);
        }

        return rest_ensure_response([
            'status' => 'success',
            'message' => 'Plugin updated successfully.',
            'plugin' => $plugin_slug
        ]);
    }

    function list_themes_with_updates() {
        // Check for theme updates using get_site_transient
        $theme_updates = get_site_transient('update_themes');

        if (!empty($theme_updates) && isset($theme_updates->response)) {
            $updates = [];
            foreach ($theme_updates->response as $theme_slug => $update_details) {
                $updates[] = [
                    'theme_name'  => $this->get_theme_name_by_slug($theme_slug),
                    'slug'        => $theme_slug,
                    'new_version' => $update_details['new_version'],
                    'package'     => $update_details['package'],                   // URL to the update package
                ];
            }
            return rest_ensure_response(['themes' => $updates]);
        } else {
            return rest_ensure_response([
                'message' => 'No theme updates available.',
                'themes'  => []
            ]);
        }
    }

    function get_theme_name_by_slug($slug) {
        // Use wp_get_theme to get theme data
        $theme = wp_get_theme($slug);

        // Check if the theme exists and is valid
        if ($theme->exists()) {
            return $theme->get('Name');
        } else {
            return '';
        }
    }


    // Function to update a theme by slug
    public function update_theme_by_slug($request)
    {
        global $wp_filesystem;

        // Initialize the WP_Filesystem API
        if (!function_exists('WP_Filesystem')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        WP_Filesystem();

        $theme_slug = sanitize_text_field($request->get_param('slug'));

        // Include necessary files for theme management
        if (!function_exists('themes_api')) {
            require_once ABSPATH . 'wp-admin/includes/theme.php';
        }

        // Get theme information from the WordPress.org API
        $api = themes_api('theme_information', ['slug' => $theme_slug]);
        if (is_wp_error($api)) {
            return new \WP_Error('theme_not_found', __('Theme not found on WordPress.org.', 'spotlight'), ['status' => 404]);
        }

        // Check if the theme is installed
        $theme = wp_get_theme($theme_slug);
        if (!$theme->exists()) {
            return new \WP_Error('theme_not_installed', __('Theme is not installed on this site.', 'spotlight'), ['status' => 404]);
        }

        // Download the theme zip file
        $download_url = $api->download_link;
        $temp_file = download_url($download_url);

        if (is_wp_error($temp_file)) {
            return new \WP_Error('download_failed', __('Failed to download theme: ', 'spotlight') . $temp_file->get_error_message(), ['status' => 500]);
        }

        // Prepare the destination for extraction
        $themes_dir = get_theme_root() . '/';
        $result = unzip_file($temp_file, $themes_dir);

        // Delete the temporary file
        wp_delete_file($temp_file);

        if (is_wp_error($result)) {
            return new \WP_Error('unzip_failed', __('Failed to unzip theme: ', 'spotlight') . $result->get_error_message(), ['status' => 500]);
        }

        // Clear the theme cache
        wp_clean_themes_cache();
        // Re-read the theme data
        wp_get_themes(true);

        return rest_ensure_response([
            'status' => 'success',
            'message' => __('Theme updated successfully.', 'spotlight'),
            'theme' => $theme_slug
        ]);
    }
}