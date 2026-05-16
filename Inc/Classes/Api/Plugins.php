<?php

namespace WPSPOTLIGHT\Inc\Classes\Api;

use WP_REST_Server;

// No, Direct access Sir !!!
if (! defined('ABSPATH')) {
    exit;
}

/**
 * Plugins
 *
 * @author Jewel Theme <support@jeweltheme.com>
 */
class Plugins {

    private static $instance = null;

    public function __construct()
    {
        add_action('rest_api_init', [$this, 'jltwp_spotlight_plugins_api'] );
    }


    /**
     * Plugins Rest API
     */

     public function jltwp_spotlight_plugins_api() {

        register_rest_route('wpspotlight/v1', '/plugin-manager', [
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'jltwp_spotlight_plugin_manager'],
            'permission_callback' => [$this, 'check_permissions'],
            'args' => [
                'slug' => [
                    'required' => true,
                    'validate_callback' => function ($param) {
                        return is_string($param);
                    },
                ],
                'action' => [
                    'required' => true,
                    'validate_callback' => function ($param) {
                        $valid_actions = apply_filters('jltwp_spotlight/control_plugin/filters', [
                            'info',
                            'install_and_activate', // TODO: maybe not need
                            'activate',
                            'deactivate',
                            'download',
                            'unpack',
                            'install'
                        ]);
                        return in_array($param, $valid_actions);
                    },
                ]
            ],
        ]);

        register_rest_route('wpspotlight/v1', '/deactivated-plugins', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_deactivated_plugins'],
            'permission_callback' => [$this, 'check_permissions'],
        ]);

        register_rest_route('wpspotlight/v1', '/activated-plugins', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_activated_plugins'],
            'permission_callback' => [$this, 'check_permissions'],
        ]);

        register_rest_route('wpspotlight/v1', '/get-all-plugins', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [$this,'get_all_installed_plugins'],
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
        }else if ((current_user_can('manage_options') || current_user_can('manage_woocommerce') )) {
            return true;
        } else {
            return false;
        }
    }

     function jltwp_spotlight_plugin_manager($request)
     {
         $slug = sanitize_text_field($request->get_param('slug'));
         $action = sanitize_text_field($request->get_param('action'));

        // Define valid actions and make them filterable
        $valid_actions = apply_filters('jltwp_spotlight/control_plugin/filter_methods', [
            'info'       => 'fetch_plugin_info',
            'activate'   => 'jltwp_spotlight_activate_plugin',
            'deactivate' => 'deactivate_plugin',
            'download'   => 'download_plugin_package',
            'unpack'     => 'unpack_plugin_package',
            'install'    => 'new_install_plugin',
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

     function fetch_plugin_info($slug)
     {
         $response = wp_remote_get("https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=$slug");
         if (is_wp_error($response)) {
             return new \WP_Error('fetch_failed', 'Failed to fetch plugin information', ['status' => 500]);
         }

         $plugin_data = json_decode(wp_remote_retrieve_body($response), true);
         if (empty($plugin_data)) {
             return new \WP_Error('not_found', 'Plugin not found', ['status' => 404]);
         }

         return [
             'slug'            => $plugin_data['slug'],
             'title'           => $plugin_data['name'],
             'version'         => $plugin_data['version'],
             'author'          => $plugin_data['author'],
             'rating'          => $plugin_data['rating'],
             'active_installs' => $plugin_data['active_installs'],
         ];
     }

    function jltwp_spotlight_activate_plugin($slug)
    {
        include_once ABSPATH . 'wp-admin/includes/file.php';
        include_once ABSPATH . 'wp-admin/includes/misc.php';
        include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        include_once ABSPATH . 'wp-admin/includes/plugin.php';

        $plugin_dir = WP_PLUGIN_DIR . "/$slug";
        if (!is_dir($plugin_dir)) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => "Installation failed: Plugin directory not found in the plugins folder."
            ]);
        }


         // Find the main plugin file in the directory
         $main_plugin_file = $this->find_main_plugin_file($plugin_dir);

         if (!$main_plugin_file) {
             return rest_ensure_response([
                 'status' => 'error',
                 'message' => "Installation failed: Could not find the main plugin file in the $slug directory."
             ]);
         }


         $result = activate_plugin($main_plugin_file);

        if (is_wp_error($result)) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => "Failed to activate plugin"
            ]);
        }

        return rest_ensure_response([
            'status' => 'success',
            'message' => "Plugin activated successfully"
        ]);
    }

    function deactivate_plugin($slug)
    {
        $plugin_dir = WP_PLUGIN_DIR . "/$slug";

        // Find the main plugin file in the directory
        $main_plugin_file = $this->find_main_plugin_file($plugin_dir);

        if (!$main_plugin_file) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => "Plugin is not installed"
            ]);
        }

        deactivate_plugins($main_plugin_file);

        return rest_ensure_response([
            'status' => 'success',
            'message' => "Plugin deactivated successfully"
        ]);
    }


    private function download_plugin_package($slug) {
        include_once ABSPATH . 'wp-admin/includes/file.php';
        include_once ABSPATH . 'wp-admin/includes/misc.php';
        include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        include_once ABSPATH . 'wp-admin/includes/plugin.php';

        $plugin_url = "https://downloads.wordpress.org/plugin/$slug.latest-stable.zip";

        // Get the upload directory path
        $upload_dir = wp_upload_dir("temp");
        $temp_file = download_url($plugin_url, 300); // Specify the timeout as needed
        if (is_wp_error($temp_file)) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => "Download failed: " . $temp_file->get_error_message()
            ]);
        }
        // Move the downloaded file from /tmp to the custom upload directory
        $destination = $upload_dir['path'] . "$slug.zip";
        global $wp_filesystem;
        if ( ! function_exists( 'WP_Filesystem' ) ) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        WP_Filesystem();
        if ( ! $wp_filesystem->move( $temp_file, $destination, true ) ) {
            wp_delete_file($temp_file); // Remove the temp file if move fails

            return rest_ensure_response([
                'status' => 'error',
                'message' => "Failed to move the file to the uploads directory."
            ]);
        }
        // Save the new location as a transient for the next step
        set_transient('wpspotlight_plugin_temp_file', $destination, 300); // Expires in 5 minutes
        set_transient('wpspotlight_plugin_slug', $slug, 300);

        return rest_ensure_response([
            'status' => 'success',
            'message' => "Download completed successfully and moved to " . $upload_dir['path']
        ]);
    }

    private function unpack_plugin_package() {
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
        $temp_file = get_transient('wpspotlight_plugin_temp_file');

        if (!$temp_file || !file_exists($temp_file)) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => "Unpack failed: Temporary file not found."
            ]);
        }

        // Unpack the file to the plugin directory
        $unpacked = unzip_file($temp_file, WP_PLUGIN_DIR);

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

        delete_transient('wpspotlight_plugin_temp_file');

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
        include_once ABSPATH . 'wp-admin/includes/plugin.php';

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


    private function new_install_plugin($slug) {
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

        // Get the plugin directory path where the plugin was unpacked
        $plugin_dir = WP_PLUGIN_DIR . "/$slug";
        if (!is_dir($plugin_dir)) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => "Installation failed: Plugin directory not found in the plugins folder."
            ]);
        }

        // Find the main plugin file in the directory
        $main_plugin_file = $this->find_main_plugin_file($plugin_dir);
        if (!$main_plugin_file) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => "Installation failed: Could not find the main plugin file in the $slug directory."
            ]);
        }

        // Activate the plugin
        // $activate_result = activate_plugin($main_plugin_file);
        // if (is_wp_error($activate_result)) {
        //     $responses[] = "Activation failed: " . $activate_result->get_error_message();
        //     return rest_ensure_response(['status' => 'error', 'messages' => $responses]);
        // }

        return rest_ensure_response([
            'status' => 'success',
            'message' => "Plugin installed successfully"
        ]);
    }

    // Helper function to find the main plugin file
    public function find_main_plugin_file($plugin_dir) {
        // Open the plugin directory and look for a PHP file with a plugin header
        $plugin_files = scandir($plugin_dir);

        foreach ($plugin_files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
                $file_path = "$plugin_dir/$file";
                $plugin_data = get_file_data($file_path, [
                    'Name' => 'Plugin Name',
                    'Version' => 'Version',
                ]);

                // Check if this file has a valid plugin header
                if (!empty($plugin_data['Name'])) {
                    return plugin_basename($file_path); // Return the relative path for activation
                }
            }
        }

        return false; // No valid plugin file found
    }

    public function get_deactivated_plugins($request) {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        // Get all plugins
        $all_plugins = get_plugins();
        $active_plugins = get_option('active_plugins', []);
        $deactivated_plugins = [];

        foreach ($all_plugins as $plugin_file => $plugin_data) {
            if (!in_array($plugin_file, $active_plugins, true)) {
                $plugin_slug = explode('/', $plugin_file);

                // // Ensure the necessary function is available
                // if (!function_exists('plugins_api')) {
                //     require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
                // }

                // // Use plugins_api() to get the plugin information
                // $api_response = plugins_api('plugin_information', [
                //     'slug'   => sanitize_text_field($plugin_slug[0]),
                //     'fields' => [
                //         'icons' => true, // We only need the icons
                //         'sections' => false,
                //         'tags' => false,
                //         'banners' => false,
                //         'reviews' => false,
                //         'ratings' => false,
                //     ]
                // ]);

                $deactivated_plugins[] = [
                    'name' => $plugin_data['Name'],
                    'slug' => $plugin_slug[0],
                    // 'img'  => $api_response->icons['1x'],
                    'version' => $plugin_data['Version'],
                    'author' => $plugin_data['Author'],
                ];
            }
        }

        return rest_ensure_response($deactivated_plugins);
    }

    public function get_activated_plugins($request) {

        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $all_plugins = \get_plugins();
        $active_plugins = get_option('active_plugins', []);
        $active_plugin_slugs = [];

        foreach ($active_plugins as $plugin_file) {
            if (isset($all_plugins[$plugin_file])) {
                $plugin_data = $all_plugins[$plugin_file];
                $plugin_slug = explode('/', $plugin_file);

                $active_plugin_slugs[] = [
                    'name' => $plugin_data['Name'],
                    'slug' => $plugin_slug[0],
                ];
            }
        }

        return rest_ensure_response($active_plugin_slugs);
    }

    // Get all Installed Plugins
    public function get_all_installed_plugins() {
        // Ensure the plugin library is included
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
    
        // Get all plugins
        $plugins = get_plugins();
    
        $formatted_plugins = [];
    
        // Format the plugins for easy use
        foreach ($plugins as $file => $plugin_data) {
            $formatted_plugins[] = [
                'name'        => $plugin_data['Name'],
                'slug'        => dirname($file),
                'version'     => $plugin_data['Version'],
                'author'      => $plugin_data['Author'],
                'description' => $plugin_data['Description'],
                'active'      => is_plugin_active($file),
            ];
        }
    
        return $formatted_plugins;
    }

    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
}