<?php

namespace WPSPOTLIGHT\Inc\Classes\Api;

use WPSPOTLIGHT\Inc\Utils;

// no direct access allowed
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Miscellaneous
 *
 * @author Jewel Theme <support@jeweltheme.com>
 */
class Miscellaneous
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
    
    // Register REST API routes
    public function register_routes()
    {

        if( Utils::is_plugin_active("adminify/adminify.php") || Utils::is_plugin_active("adminify-pro/adminify.php") ) {
            
            // Route to get the saved light/dark data
            register_rest_route('wpspotlight/v1', '/light-dark-mode', [
                'methods'             => 'GET',
                'callback'            => [$this, 'get_light_dark_data'],
                'permission_callback' => [$this, 'check_permissions'],
                'args' => [
                    'mode' => [
                        'required' => true,
                        'validate_callback' => function ($param) {
                            return is_string($param);
                        },
                    ]
                ]
            ]);
        } else {
            // Route to get the saved light/dark data
            register_rest_route('wpspotlight/v1', '/light-dark-mode', [
                'methods'             => 'GET',
                'callback'            => [$this, 'get_light_dark_data_default'],
                'permission_callback' => [$this, 'check_permissions'],
                'args' => [
                    'mode' => [
                        'required' => true,
                        'validate_callback' => function ($param) {
                            return is_string($param);
                        },
                    ]
                ]
            ]);
        }
    }


    // Check REST API permissions
    public function check_permissions()
    {
        if (current_user_can('manage_options') || current_user_can('manage_woocommerce')) {
            return true;
        } else {
            return false;
        }
    }

    public function get_light_dark_data($request){
        
        $default_modes = ['light', 'dark', 'system'];
        $mode = $request->get_param('mode');
        
        if( Utils::is_plugin_active("adminify/adminify.php") || Utils::is_plugin_active("adminify-pro/adminify.php") ) {
            if(in_array($mode, $default_modes)){
                $light_dark_options = (array) \WPAdminify\Inc\Admin\AdminSettings::get_instance()->get();
                $light_dark_options['light_dark_mode']['admin_ui_mode'] = $mode;
        
                update_option('_wpadminify', $light_dark_options);

                return rest_ensure_response([
                    'status' => 'success',
                    'message' => "Light Dark Mode successfully"
                ]);
            }
        }

        return rest_ensure_response([
            'status' => 'error',
            'message' => "Something went wrong"
        ]);
    }

    public function get_light_dark_data_default($request) {
        $default_modes = ['light', 'dark', 'system'];
        $mode = $request->get_param('mode');

        if( in_array( $mode, $default_modes ) ) {
            update_option('_spotlight_dark_light_mode', $mode);

            return rest_ensure_response([
                'status' => 'success',
                'message' => "Light Dark Mode successfully"
            ]);
        }

    }

}