<?php

namespace WPSPOTLIGHT\Inc\Classes\Api;

// No, Direct access Sir !!!
if (! defined('ABSPATH')) {
    exit;
}

/**
 * Themes
 *
 * @author Jewel Theme <support@jeweltheme.com>
 */
class Themes
{
    private static $instance = null;

    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct()
    {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes()
    {
        register_rest_route('wpspotlight/v1', '/theme-manager', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_theme_action'],
            'permission_callback' => [$this, 'check_permissions'],
            'args'                => [
                'slug' => [
                    'required' => false,
                    'validate_callback' => function ($param) {
                        return is_string($param);
                    },
                ],
                'action' => [
                    'required' => true,
                    'validate_callback' => function ($param) {
                        $valid_actions = apply_filters('jltwp_spotlight/control_theme/filters', [
                            'info',
                            'activate',
                            'download',
                            'unpack',
                            'install'
                        ]);
                        return in_array($param, $valid_actions);
                    },
                ],
            ],
        ]);

        register_rest_route('wpspotlight/v1', '/get_installed_themes', [
            'methods' => 'GET',
            'callback' => [$this, 'get_installed_themes'],
            'permission_callback' => [$this, 'check_permissions'],
        ]);

    }


    // Check REST API permissions
    public function check_permissions()
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

    public function handle_theme_action($request)
    {
        $slug = sanitize_text_field($request->get_param('slug'));
        $action = sanitize_text_field($request->get_param('action'));


        // Define valid actions and make them filterable
        $valid_actions = apply_filters('jltwp_spotlight/control_theme/filter_methods', [
            'info'       => 'fetch_theme_info',
            'activate'   => 'activate_theme',
            'download'   => 'download_theme',
            'unpack'     => 'unpack_theme',
            'install'    => 'install_theme',
        ]);

        if (!isset($valid_actions[$action])) {
            return new \WP_Error('invalid_action', __('Invalid action specified', 'spotlight'), ['status' => 400]);
        }

        // Dynamically call the appropriate method
        if (method_exists($this, $valid_actions[$action])) {
            return $this->{$valid_actions[$action]}($slug);
        }

        return new \WP_Error('invalid_method', __('Invalid method specified for action', 'spotlight'), ['status' => 400]);
    }

    private function fetch_theme_info($slug)
    {
        $response = wp_remote_get("https://api.wordpress.org/themes/info/1.1/?action=theme_information&request[slug]=$slug");
        if (is_wp_error($response)) {
            return new \WP_Error('fetch_failed', 'Failed to fetch theme information', ['status' => 500]);
        }

        $theme_data = json_decode(wp_remote_retrieve_body($response), true);
        if (empty($theme_data)) {
            return new \WP_Error('not_found', 'Theme not found', ['status' => 404]);
        }

        return [
            'slug' => $theme_data['slug'],
            'name' => $theme_data['name'],
            'version' => $theme_data['version'],
            'author' => $theme_data['author'],
            'rating' => $theme_data['rating'],
            'active_installs' => $theme_data['active_installs'],
        ];
    }

    private function unpack_theme($slug) {
        global $wp_filesystem;

        // Ensure Filesystem API is available
        if (!function_exists('WP_Filesystem')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }

        if (!WP_Filesystem()) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => "Filesystem unavailable: Could not initialize WordPress filesystem API."
            ]);
        }

        // Retrieve the temporary file from transient storage
        $temp_file = get_transient('wpspotlight_theme_temp_file');

        if (!$temp_file || !file_exists($temp_file)) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => "Unpack failed: Temporary file not found."
            ]);
        }

        // Unpack the file to the themes directory
        $unpacked = unzip_file($temp_file, get_theme_root());

        if (is_wp_error($unpacked)) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => "Unpacking failed: " . $unpacked->get_error_message()
            ]);
        }


        // Clean up temp file after unpacking
        // https://developer.wordpress.org/reference/functions/wp_delete_file/
        // wp_delete_file() (and worse, its @ silenced version) is discouraged in WPCS.
        // https://developer.wordpress.org/reference/functions/download_url/
        // wp_delete_file($temp_file);

        wp_delete_file( $temp_file );


        // Remove 'temp' directory from the uploads folder
        $upload_dir = wp_upload_dir('temp');
        $temp_dir = trailingslashit($upload_dir['path']);

        if (is_dir($temp_dir)) {
            $this->remove_directory($temp_dir);
            // $responses[] = "'temp' directory removed from uploads folder.";
        } else {
            // $responses[] = "No 'temp' directory found in uploads folder.";
        }

        delete_transient('wpspotlight_theme_temp_file');

        return rest_ensure_response([
            'status' => 'success',
            'message' => "Package unpacked successfully. Ready to install."
        ]);
    }

    // Helper function to remove a directory and its contents recursively
    private function remove_directory($dir) {
        global $wp_filesystem;

        include_once ABSPATH . 'wp-admin/includes/file.php';
        include_once ABSPATH . 'wp-admin/includes/misc.php';
        include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        include_once ABSPATH . 'wp-admin/includes/theme.php';

        if (!$wp_filesystem) {
            WP_Filesystem();
        }

        // Recursively delete directory contents
        if ($wp_filesystem->is_dir($dir)) {
            foreach ($wp_filesystem->dirlist($dir) as $fileinfo) {
                $filepath = trailingslashit($dir) . $fileinfo['name'];
                if ($fileinfo['type'] === 'f') {
                    $wp_filesystem->delete($filepath); // Delete file
                } elseif ($fileinfo['type'] === 'd') {
                    $this->remove_directory($filepath); // Recursive delete for subdirectories
                }
            }
            $wp_filesystem->rmdir($dir); // Remove the directory itself
        }
    }

    private function install_theme($slug)
    {
        global $wp_filesystem;

        // Ensure Filesystem API is available
        if (!function_exists('WP_Filesystem')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }

        if (!WP_Filesystem()) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => "Filesystem unavailable: Could not initialize WordPress filesystem API."
            ]);
        }

        // Get the themes directory path where the theme was unpacked
        $theme_dir = trailingslashit( get_theme_root( $slug ) ) . $slug;
        if (!is_dir($theme_dir)) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => "Installation failed: Theme directory not found in the themes folder."
            ]);
        }

        return rest_ensure_response([
            'status' => 'success',
            'message' => "Theme installed successfully"
        ]);
    }

    private function activate_theme($slug)
    {
        $theme = wp_get_theme($slug);

        if (!$theme->exists()) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => 'Theme is not installed'
            ]);
        }

        switch_theme($slug);

        if (wp_get_theme()->get_stylesheet() !== $slug) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => 'Failed to activate theme'
            ]);
        }

        return rest_ensure_response([
            'status' => 'success',
            'message' => 'Theme activated successfully'
        ]);
    }

    public function get_installed_themes () {
        $themes = wp_get_themes();
        $installed_themes = [];

        foreach ($themes as $theme_slug => $theme) {
            $installed_themes[] = [
                'name'      => $theme->get('Name'),
                'slug'      => $theme_slug,
                'is_active' => $theme->get_stylesheet() === get_option('stylesheet'),
            ];
        }

        return rest_ensure_response(['status' => 'success', 'themes' => $installed_themes]);
    }


}